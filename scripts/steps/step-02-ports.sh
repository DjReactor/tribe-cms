#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "02_ports"

# Build list of ports already used by instances
USED_PORTS=()
for ENV in /opt/tribe-sites/*/.env; do
  [ -f "$ENV" ] || continue
  while IFS= read -r LINE; do
    echo "$LINE" | grep -qE '^(PORT|PB_PORT)=' && \
      USED_PORTS+=($(echo "$LINE" | grep -oE '[0-9]+'))
  done < "$ENV"
done

# Also include ports from other in-progress deploys (lock files)
for LOCK in /tmp/tribe-port-lock-*; do
  [ -f "$LOCK" ] && USED_PORTS+=($(basename "$LOCK" | grep -oE '[0-9]+'))
done

# Find next available port in range
find_port() {
  local START=$1 END=$2
  for P in $(seq $START $END); do
    if ! [[ " ${USED_PORTS[@]} " =~ " ${P} " ]]; then
      # Also verify not in use by system
      if ! ss -tlnp 2>/dev/null | grep -q ":${P} "; then
        echo $P
        return 0
      fi
    fi
  done
  return 1
}

NEXTJS_PORT=$(find_port 3001 3999) || \
  { mark_step_failed "$SLUG" "02_ports" "No available ports in 3001-3999"; exit_fail "No Next.js ports available (3001-3999)"; }

USED_PORTS+=($NEXTJS_PORT)  # Prevent PB from grabbing same number

PB_PORT=$(find_port 8001 8999) || \
  { mark_step_failed "$SLUG" "02_ports" "No available ports in 8001-8999"; exit_fail "No PocketBase ports available (8001-8999)"; }

# Reserve with lock files
touch "/tmp/tribe-port-lock-${NEXTJS_PORT}"
touch "/tmp/tribe-port-lock-${PB_PORT}"

# Write to state
set_state "$SLUG" ".ports.nextjs_port = $NEXTJS_PORT | .ports.pb_port = $PB_PORT"
mark_step_ok "$SLUG" "02_ports"

ok "Ports allocated"
info "Next.js: $NEXTJS_PORT"
info "PocketBase: $PB_PORT"
