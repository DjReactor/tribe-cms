#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "12_create_bo_user"

STATE=$(read_state "$SLUG")
BASE="/opt/tribe-sites/${SLUG}"
PB_PORT=$(echo "$STATE" | jq -r '.ports.pb_port')
PB_ADMIN_PW=$(echo "$STATE" | jq -r '.secrets.pb_admin_password')
BO_EMAIL=$(echo "$STATE" | jq -r '.input.bo_email')
BO_PW=$(echo "$STATE" | jq -r '.secrets.bo_temp_password')
BUSINESS_NAME=$(echo "$STATE" | jq -r '.input.business_name')

fuser -k "${PB_PORT}/tcp" 2>/dev/null || true; sleep 1
"$BASE/pocketbase" serve --http "127.0.0.1:${PB_PORT}" --dir "$BASE/pb_data" &
PB_PID=$!
trap "kill $PB_PID 2>/dev/null; wait $PB_PID 2>/dev/null" EXIT
wait_for_http "http://127.0.0.1:${PB_PORT}/api/health" 15 2 || exit_fail "PocketBase won't start"

TOKEN=$(pb_authenticate "http://127.0.0.1:${PB_PORT}" "${PB_ADMIN_EMAIL:-admin@tribecms.local}" "$PB_ADMIN_PW")
[ -z "$TOKEN" ] && exit_fail "PB auth failed"

EXISTING_USER=$(pb_api "$TOKEN" GET "http://127.0.0.1:${PB_PORT}/api/collections/users/records?filter=(email='$(echo "$BO_EMAIL" | jq -R -r @uri)')")
EXISTING_ID=$(echo "$EXISTING_USER" | jq -r '.items[0].id // empty')

PAYLOAD="{\"email\":\"$BO_EMAIL\",\"password\":\"$BO_PW\",\"passwordConfirm\":\"$BO_PW\",\"role\":\"business_owner\",\"display_name\":$(echo "$BUSINESS_NAME Admin" | jq -Rs .),\"emailVisibility\":true,\"verified\":true,\"must_change_password\":true}"

if [ -n "$EXISTING_ID" ]; then
  USER_RESP=$(pb_api "$TOKEN" PATCH "http://127.0.0.1:${PB_PORT}/api/collections/users/records/$EXISTING_ID" "$PAYLOAD")
else
  USER_RESP=$(pb_api "$TOKEN" POST "http://127.0.0.1:${PB_PORT}/api/collections/users/records" "$PAYLOAD")
fi

USER_ID=$(echo "$USER_RESP" | jq -r '.id // empty')
[ -z "$USER_ID" ] && \
  { ERR=$(echo "$USER_RESP" | jq -r '.message // "Unknown error"'); kill $PB_PID 2>/dev/null; \
    mark_step_failed "$SLUG" "12_create_bo_user" "User creation failed: $ERR"; exit_fail "User creation failed: $ERR"; }

set_state "$SLUG" ".runtime.bo_user_id = \"$USER_ID\""
kill $PB_PID 2>/dev/null; wait $PB_PID 2>/dev/null; trap - EXIT; sleep 1
mark_step_ok "$SLUG" "12_create_bo_user"
ok "BO user created: $BO_EMAIL (ID: $USER_ID)"
info "Temp password: $BO_PW"
