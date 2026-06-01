#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "15_health_check"

STATE=$(read_state "$SLUG")
NEXTJS_PORT=$(echo "$STATE" | jq -r '.ports.nextjs_port')
INTERNAL_SECRET=$(echo "$STATE" | jq -r '.secrets.internal_secret')
EXPECTED_VERSION=$(echo "$STATE" | jq -r '.runtime.template_version')

info "Polling /api/internal/health (up to 60 seconds)..."
for i in $(seq 1 12); do
  RESP=$(curl -sf \
    -H "Authorization: Bearer $INTERNAL_SECRET" \
    --connect-timeout 5 --max-time 10 \
    "http://127.0.0.1:${NEXTJS_PORT}/api/internal/health" 2>/dev/null)

    if [ -n "$RESP" ]; then
      STATUS=$(echo "$RESP" | jq -r '.status // ""')
      PB_CONN=$(echo "$RESP" | jq -r '.pb_connected // ""')
      DB_CONN=$(echo "$RESP" | jq -r '.database // ""')
      VERSION=$(echo "$RESP" | jq -r '.version // ""')
      if { [ "$STATUS" = "ok" ] || [ "$STATUS" = "healthy" ]; } && { [ "$PB_CONN" = "true" ] || [ "$DB_CONN" = "connected" ]; } && [ "$VERSION" = "$EXPECTED_VERSION" ]; then
        set_state "$SLUG" ".runtime.health_verified_at = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\""
        mark_step_ok "$SLUG" "15_health_check"
        ok "Health check passed on attempt $i"
        info "Status: $STATUS | PB connected: ${PB_CONN:-$DB_CONN} | Version: $VERSION"
        exit 0
      fi
      info "Attempt $i: status=$STATUS pb=${PB_CONN:-$DB_CONN} version=$VERSION"
    else
    info "Attempt $i: no response"
  fi
  [ $i -lt 12 ] && sleep 5
done

mark_step_failed "$SLUG" "15_health_check" "Health check failed after 60 seconds"
exit_fail "Health check failed — see pm2 logs sf-${SLUG}-next for errors"
