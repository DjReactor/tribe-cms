#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."12_create_bo_user".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

BASE="/opt/tribe-sites/${SLUG}"
PB_PORT=$(echo "$STATE" | jq -r '.ports.pb_port')
PB_ADMIN_PW=$(echo "$STATE" | jq -r '.secrets.pb_admin_password')
BO_EMAIL=$(echo "$STATE" | jq -r '.input.bo_email')
BO_PW=$(echo "$STATE" | jq -r '.secrets.bo_temp_password')
ERRORS=()

fuser -k "${PB_PORT}/tcp" 2>/dev/null || true; sleep 1
"$BASE/pocketbase" serve --http "127.0.0.1:${PB_PORT}" --dir "$BASE/pb_data" &
TMP_PID=$!
trap "kill $TMP_PID 2>/dev/null; wait $TMP_PID 2>/dev/null" EXIT
wait_for_http "http://127.0.0.1:${PB_PORT}/api/health" 15 2 || exit_fail "PocketBase won't start"

TOKEN=$(pb_authenticate "http://127.0.0.1:${PB_PORT}" "${PB_ADMIN_EMAIL:-admin@tribecms.local}" "$PB_ADMIN_PW")

USERS=$(pb_api "$TOKEN" GET "http://127.0.0.1:${PB_PORT}/api/collections/users/records?filter=email='$BO_EMAIL'")
USER_COUNT=$(echo "$USERS" | jq -r '.totalItems // 0')
[ "$USER_COUNT" -lt 1 ] && ERRORS+=("BO user with email $BO_EMAIL not found")

if [ "$USER_COUNT" -ge 1 ]; then
  ROLE=$(echo "$USERS" | jq -r '.items[0].role // ""')
  [ "$ROLE" != "business_owner" ] && ERRORS+=("User role is '$ROLE', expected 'business_owner'")

  # Verify BO can actually log in with temp password
  BO_AUTH=$(curl -sf -X POST \
    "http://127.0.0.1:${PB_PORT}/api/collections/users/auth-with-password" \
    -H "Content-Type: application/json" \
    -d "{\"identity\":\"$BO_EMAIL\",\"password\":\"$BO_PW\"}" 2>/dev/null)
  BO_TOKEN=$(echo "$BO_AUTH" | jq -r '.token // empty')
  [ -z "$BO_TOKEN" ] && ERRORS+=("BO cannot log in with temp password — auth failed")
fi

kill $TMP_PID 2>/dev/null; wait $TMP_PID 2>/dev/null; trap - EXIT

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "12_create_bo_user" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "BO user verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

mark_step_verified "$SLUG" "12_create_bo_user"
ok "BO user verified: $BO_EMAIL can authenticate as business_owner"
