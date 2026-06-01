#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."04_directories".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

BASE="/opt/sf-instances/${SLUG}"
REQUIRED=("$BASE" "$BASE/pb_data" "$BASE/pb_data/storage" "$BASE/logs" "$BASE/backups" "$BASE/custom")
ERRORS=()

for DIR in "${REQUIRED[@]}"; do
  [ ! -d "$DIR" ] && ERRORS+=("Missing directory: $DIR")
done

[ ! -w "$BASE" ] && ERRORS+=("$BASE is not writable")
[ ! -w "$BASE/pb_data" ] && ERRORS+=("$BASE/pb_data is not writable")

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "04_directories" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "Directory verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

mark_step_verified "$SLUG" "04_directories"
ok "All ${#REQUIRED[@]} directories exist and are writable"
