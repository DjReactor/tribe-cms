#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."15_health_check".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

NEXTJS_PORT=$(echo "$STATE" | jq -r '.ports.nextjs_port')
INTERNAL_SECRET=$(echo "$STATE" | jq -r '.secrets.internal_secret')
EXPECTED_VERSION=$(echo "$STATE" | jq -r '.runtime.template_version')
ERRORS=()

RESP=$(curl -sf -H "Authorization: Bearer $INTERNAL_SECRET" \
  --connect-timeout 5 --max-time 10 \
  "http://127.0.0.1:${NEXTJS_PORT}/api/tribe/health" 2>/dev/null)

[ -z "$RESP" ] && { mark_step_verify_failed "$SLUG" "15_health_check" "No response from health endpoint"; exit_fail "Health endpoint unreachable"; }

S=$(echo "$RESP" | jq -r '.status // ""')
PB=$(echo "$RESP" | jq -r '.pb_connected // ""')
DB=$(echo "$RESP" | jq -r '.database // ""')
V=$(echo "$RESP" | jq -r '.version // ""')
INST=$(echo "$RESP" | jq -r '.instance_slug // ""')

[ "$S" != "ok" ] && [ "$S" != "healthy" ] && ERRORS+=("status is '$S', expected 'ok' or 'healthy'")
[ "$PB" != "true" ] && [ "$DB" != "connected" ] && ERRORS+=("pb_connected/database is invalid, expected true/connected")
[ "$V" != "$EXPECTED_VERSION" ]     && ERRORS+=("version is '$V', expected '$EXPECTED_VERSION'")
[ -n "$INST" ] && [ "$INST" != "$SLUG" ] && ERRORS+=("instance_slug is '$INST', expected '$SLUG'")

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "15_health_check" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "Health check verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

mark_step_verified "$SLUG" "15_health_check"
ok "Health check verified: status=ok, PB connected, version=$V"
