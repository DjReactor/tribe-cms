#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."02_ports".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

NEXTJS_PORT=$(echo "$STATE" | jq -r '.ports.nextjs_port')
PB_PORT=$(echo "$STATE" | jq -r '.ports.pb_port')
ERRORS=()

[ "$NEXTJS_PORT" = "null" ] || [ -z "$NEXTJS_PORT" ] && \
  ERRORS+=("nextjs_port not set in state file")
[ "$PB_PORT" = "null" ] || [ -z "$PB_PORT" ] && \
  ERRORS+=("pb_port not set in state file")

# Confirm ports not taken by another instance since allocation
if [ -n "$NEXTJS_PORT" ] && [ "$NEXTJS_PORT" != "null" ]; then
  for ENV in /opt/tribe-sites/*/.env; do
    [ -f "$ENV" ] || continue
    grep -q "^PORT=${NEXTJS_PORT}$" "$ENV" 2>/dev/null && \
      ERRORS+=("Next.js port $NEXTJS_PORT is now used by $(basename $(dirname $ENV))")
  done
  ss -tlnp 2>/dev/null | grep -q ":${NEXTJS_PORT} " && \
    ERRORS+=("Port $NEXTJS_PORT is already bound by a running process")
fi

if [ -n "$PB_PORT" ] && [ "$PB_PORT" != "null" ]; then
  for ENV in /opt/tribe-sites/*/.env; do
    [ -f "$ENV" ] || continue
    grep -q "^PB_PORT=${PB_PORT}$" "$ENV" 2>/dev/null && \
      ERRORS+=("PB port $PB_PORT is now used by $(basename $(dirname $ENV))")
  done
  ss -tlnp 2>/dev/null | grep -q ":${PB_PORT} " && \
    ERRORS+=("Port $PB_PORT is already bound by a running process")
fi

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "02_ports" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "Port verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

mark_step_verified "$SLUG" "02_ports"
ok "Ports verified: Next.js=$NEXTJS_PORT, PocketBase=$PB_PORT"
