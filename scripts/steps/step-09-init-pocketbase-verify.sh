#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."09_init_pocketbase".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

BASE="/opt/sf-instances/${SLUG}"
PB_PORT=$(echo "$STATE" | jq -r '.ports.pb_port')
PB_ADMIN_PW=$(echo "$STATE" | jq -r '.secrets.pb_admin_password')
ERRORS=()

# Check pb_data has been initialized (contains data.db)
[ ! -f "$BASE/pb_data/data.db" ] && ERRORS+=("pb_data/data.db missing — PocketBase was not initialized")

# Try to start PB temporarily to verify schema (only if not already running)
PB_RUNNING=false
if ! ss -tlnp | grep -q ":${PB_PORT} "; then
  "$BASE/pocketbase" serve --http "127.0.0.1:${PB_PORT}" --dir "$BASE/pb_data" &
  TMP_PID=$!
  trap "kill $TMP_PID 2>/dev/null; wait $TMP_PID 2>/dev/null" EXIT
  wait_for_http "http://127.0.0.1:${PB_PORT}/api/health" 15 2 || \
    { ERRORS+=("PocketBase failed to start for verification"); mark_step_verify_failed "$SLUG" "09_init_pocketbase" "$(printf '%s\n' "${ERRORS[@]}")"; exit_fail "PocketBase won't start"; }
else
  PB_RUNNING=true
fi

# Get fresh token
TOKEN=$(pb_authenticate "http://127.0.0.1:${PB_PORT}" "admin@successforce.com" "$PB_ADMIN_PW")
[ -z "$TOKEN" ] && ERRORS+=("Could not authenticate as PocketBase admin")

if [ -n "$TOKEN" ]; then
  # Verify key collections exist
  for COL in business_info services service_areas settings seo_settings redirects seo_404_log users template_meta; do
    pb_collection_exists "$TOKEN" "http://127.0.0.1:${PB_PORT}" "$COL" || \
      ERRORS+=("Collection missing: $COL")
  done
  # Update token in state
  set_state "$SLUG" ".runtime.pb_admin_token = \"$TOKEN\""
fi

$PB_RUNNING || { kill $TMP_PID 2>/dev/null; wait $TMP_PID 2>/dev/null; trap - EXIT; }

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "09_init_pocketbase" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "PocketBase verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

mark_step_verified "$SLUG" "09_init_pocketbase"
ok "PocketBase verified: admin auth works, schema imported correctly"
