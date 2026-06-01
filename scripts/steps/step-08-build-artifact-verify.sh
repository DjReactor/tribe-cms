#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."08_build_artifact".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

BASE="/opt/sf-instances/${SLUG}"
ERRORS=()

[ ! -d "$BASE/.next" ] && ERRORS+=(".next directory missing")
[ ! -f "$BASE/.next/BUILD_ID" ] && ERRORS+=(".next/BUILD_ID missing (build may be incomplete)")
[ ! -d "$BASE/.next/static" ] && ERRORS+=(".next/static directory missing")
[ ! -d "$BASE/.next/server" ] && ERRORS+=(".next/server directory missing")

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "08_build_artifact" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "Build artifact verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

BUILD_ID=$(cat "$BASE/.next/BUILD_ID")
CHUNK_COUNT=$(find "$BASE/.next/static" -name "*.js" | wc -l)
mark_step_verified "$SLUG" "08_build_artifact"
ok "Build artifact verified: BUILD_ID=$BUILD_ID, $CHUNK_COUNT JS chunks"
