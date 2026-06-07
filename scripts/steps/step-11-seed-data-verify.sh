#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."11_seed_data".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

BASE="/opt/sf-instances/${SLUG}"
PB_PORT=$(echo "$STATE" | jq -r '.ports.pb_port')
PB_ADMIN_PW=$(echo "$STATE" | jq -r '.secrets.pb_admin_password')
ERRORS=()

fuser -k "${PB_PORT}/tcp" 2>/dev/null || true; sleep 1
"$BASE/pocketbase" serve --http "127.0.0.1:${PB_PORT}" --dir "$BASE/pb_data" &
TMP_PID=$!
trap "kill $TMP_PID 2>/dev/null; wait $TMP_PID 2>/dev/null" EXIT
wait_for_http "http://127.0.0.1:${PB_PORT}/api/health" 15 2 || exit_fail "PocketBase won't start"

TOKEN=$(pb_authenticate "http://127.0.0.1:${PB_PORT}" "${PB_ADMIN_EMAIL:-admin@successforce.com}" "$PB_ADMIN_PW")

for COL in business_info settings seo_settings template_meta; do
  RESP=$(pb_api "$TOKEN" GET "http://127.0.0.1:${PB_PORT}/api/collections/${COL}/records?perPage=1")
  COUNT=$(echo "$RESP" | jq -r '.totalItems // 0')
  [ "$COUNT" -lt 1 ] && ERRORS+=("$COL has no records (seeding failed)")
done

# Check business_name was set
BIZ_RESP=$(pb_api "$TOKEN" GET "http://127.0.0.1:${PB_PORT}/api/collections/business_info/records?perPage=1")
BN=$(echo "$BIZ_RESP" | jq -r '.items[0].business_name // ""')
EXPECTED_BN=$(echo "$STATE" | jq -r '.input.business_name')
[ "$BN" != "$EXPECTED_BN" ] && ERRORS+=("business_name mismatch: got '$BN', expected '$EXPECTED_BN'")
NICHE_ATTRS_TYPE=$(echo "$BIZ_RESP" | jq -r '.items[0].niche_attributes | type')
[ "$NICHE_ATTRS_TYPE" != "object" ] && ERRORS+=("business_info.niche_attributes is missing or not an object (type: $NICHE_ATTRS_TYPE)")

# Check settings template is correct
SET_RESP=$(pb_api "$TOKEN" GET "http://127.0.0.1:${PB_PORT}/api/collections/settings/records?perPage=1")
AT=$(echo "$SET_RESP" | jq -r '.items[0].active_template // ""')
EXPECTED_T=$(echo "$STATE" | jq -r '.input.template')
[ "$AT" != "$EXPECTED_T" ] && ERRORS+=("active_template mismatch: got '$AT', expected '$EXPECTED_T'")
NICHE_SCHEMA_TYPE=$(echo "$SET_RESP" | jq -r '.items[0].niche_schema | type')
[ "$NICHE_SCHEMA_TYPE" != "object" ] && ERRORS+=("settings.niche_schema is missing or not an object (type: $NICHE_SCHEMA_TYPE)")

kill $TMP_PID 2>/dev/null; wait $TMP_PID 2>/dev/null; trap - EXIT

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "11_seed_data" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "Seed data verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

mark_step_verified "$SLUG" "11_seed_data"
ok "Seed data verified: all 4 single-record collections populated correctly"
