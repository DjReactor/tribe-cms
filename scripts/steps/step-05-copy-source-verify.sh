#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."05_copy_source".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

BASE="/opt/tribe-sites/${SLUG}"
ERRORS=()
REQUIRED_FILES=(
  "$BASE/src" "$BASE/public" "$BASE/package.json" "$BASE/pnpm-lock.yaml"
  "$BASE/next.config.ts" "$BASE/tsconfig.json"
  "$BASE/pb_migrations" "$BASE/pb_seed/defaults.json"
  "$BASE/pocketbase" "$BASE/.tribe-version"
)

for F in "${REQUIRED_FILES[@]}"; do
  [ ! -e "$F" ] && ERRORS+=("Missing: $F")
done

# Check pocketbase is executable
[ -x "$BASE/pocketbase" ] || ERRORS+=("PocketBase binary is not executable")

# Check version matches master
INST_VER=$(cat "$BASE/.tribe-version" 2>/dev/null)
TMPL_VER=$(cat "/opt/tribe-instances/.tribe-version" 2>/dev/null)
[ "$INST_VER" != "$TMPL_VER" ] && ERRORS+=("Version mismatch: instance=$INST_VER, master=$TMPL_VER")

# Check state version was set
STATE_VER=$(echo "$STATE" | jq -r '.runtime.template_version')
[ "$STATE_VER" != "$INST_VER" ] && ERRORS+=("State file version mismatch")

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "05_copy_source" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "Source copy verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

FILE_COUNT=$(find "$BASE/src" -type f | wc -l)
mark_step_verified "$SLUG" "05_copy_source"
ok "Source files verified: $FILE_COUNT files, version $INST_VER"
