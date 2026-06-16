#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."10_run_migrations".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

BASE="/opt/tribe-sites/${SLUG}"
PB_PORT=$(echo "$STATE" | jq -r '.ports.pb_port')
PB_ADMIN_PW=$(echo "$STATE" | jq -r '.secrets.pb_admin_password')
ERRORS=()

# Start PB temporarily
fuser -k "${PB_PORT}/tcp" 2>/dev/null || true; sleep 1
"$BASE/pocketbase" serve --http "127.0.0.1:${PB_PORT}" --dir "$BASE/pb_data" &
TMP_PID=$!
trap "kill $TMP_PID 2>/dev/null; wait $TMP_PID 2>/dev/null" EXIT
wait_for_http "http://127.0.0.1:${PB_PORT}/api/health" 15 2 || { kill $TMP_PID 2>/dev/null; exit_fail "PocketBase won't start for verification"; }

TOKEN=$(pb_authenticate "http://127.0.0.1:${PB_PORT}" "${PB_ADMIN_EMAIL:-admin@tribecms.local}" "$PB_ADMIN_PW")

# Verify all expected collections exist (schema + migration additions)
EXPECTED="business_info services service_areas testimonials blog_posts media contacts ai_call_logs settings seo_settings redirects seo_404_log site_content template_meta users"
for COL in $EXPECTED; do
  pb_collection_exists "$TOKEN" "http://127.0.0.1:${PB_PORT}" "$COL" || \
    ERRORS+=("Collection missing after migrations: $COL")
done

# Verify key fields exist on settings (added by v1.2 migration)
SETTINGS_SCHEMA=$(pb_api "$TOKEN" GET "http://127.0.0.1:${PB_PORT}/api/collections/settings")
echo "$SETTINGS_SCHEMA" | jq -e '.fields[]? | select(.name == "updates_enabled")' > /dev/null 2>&1 || \
  ERRORS+=("settings.updates_enabled field missing — migration 1.2 may not have run")

kill $TMP_PID 2>/dev/null; wait $TMP_PID 2>/dev/null; trap - EXIT

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "10_run_migrations" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "Migration verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

COL_COUNT=$(echo "$EXPECTED" | wc -w)
mark_step_verified "$SLUG" "10_run_migrations"
ok "Migrations verified: all $COL_COUNT collections and required fields present"
