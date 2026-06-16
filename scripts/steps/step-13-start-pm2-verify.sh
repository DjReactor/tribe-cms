#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."13_start_pm2".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

PB_PORT=$(echo "$STATE" | jq -r '.ports.pb_port')
NEXTJS_PORT=$(echo "$STATE" | jq -r '.ports.nextjs_port')
ERRORS=()

# Check PM2 process statuses
PB_STATUS=$(pm2 jlist 2>/dev/null | jq -r --arg n "tribe-pb-${SLUG}" '.[] | select(.name==$n) | .pm2_env.status // "missing"')
NX_STATUS=$(pm2 jlist 2>/dev/null | jq -r --arg n "tribe-${SLUG}-next" '.[] | select(.name==$n) | .pm2_env.status // "missing"')

[ "$PB_STATUS" != "online" ] && ERRORS+=("tribe-pb-${SLUG} PM2 status: $PB_STATUS (expected: online)")
[ "$NX_STATUS" != "online" ] && ERRORS+=("tribe-${SLUG}-next PM2 status: $NX_STATUS (expected: online)")

# Check ports are bound
ss -tlnp 2>/dev/null | grep -q ":${PB_PORT} " || ERRORS+=("PocketBase port $PB_PORT is not bound")
ss -tlnp 2>/dev/null | grep -q ":${NEXTJS_PORT} " || ERRORS+=("Next.js port $NEXTJS_PORT is not bound")

# Check PocketBase health
PB_HEALTH=$(curl -sf --connect-timeout 5 "http://127.0.0.1:${PB_PORT}/api/health" 2>/dev/null)
echo "$PB_HEALTH" | jq -e '.code == 200' > /dev/null 2>&1 || ERRORS+=("PocketBase health check failed")

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "13_start_pm2" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "PM2 verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

PB_RESTARTS=$(pm2 jlist 2>/dev/null | jq -r --arg n "tribe-pb-${SLUG}" '.[] | select(.name==$n) | .pm2_env.restart_time // 0')
NX_RESTARTS=$(pm2 jlist 2>/dev/null | jq -r --arg n "tribe-${SLUG}-next" '.[] | select(.name==$n) | .pm2_env.restart_time // 0')
mark_step_verified "$SLUG" "13_start_pm2"
ok "Both processes online"
info "tribe-pb-${SLUG}: online (restarts: $PB_RESTARTS)"
info "tribe-${SLUG}-next: online (restarts: $NX_RESTARTS)"
