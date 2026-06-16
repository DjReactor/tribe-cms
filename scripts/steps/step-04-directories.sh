#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "04_directories"

BASE="/opt/tribe-sites/${SLUG}"
DIRS=("$BASE" "$BASE/pb_data" "$BASE/pb_data/storage" "$BASE/logs" "$BASE/backups" "$BASE/custom")

for DIR in "${DIRS[@]}"; do
  mkdir -p "$DIR" || { mark_step_failed "$SLUG" "04_directories" "mkdir failed: $DIR"; exit_fail "Failed to create: $DIR"; }
  info "Created: $DIR"
done

chmod 750 "$BASE"
chmod 700 "$BASE/pb_data"
mark_step_ok "$SLUG" "04_directories"
ok "All directories created"
