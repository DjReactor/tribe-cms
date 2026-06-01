#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."07_install_deps".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

BASE="/opt/sf-instances/${SLUG}"
ERRORS=()

[ ! -d "$BASE/node_modules" ] && ERRORS+=("node_modules directory missing")
[ ! -d "$BASE/node_modules/.pnpm" ] && ERRORS+=("node_modules/.pnpm missing (pnpm store not linked)")
[ ! -d "$BASE/node_modules/next" ] && ERRORS+=("next package not found in node_modules")
[ ! -d "$BASE/node_modules/react" ] && ERRORS+=("react package not found in node_modules")
[ ! -d "$BASE/node_modules/typescript" ] && ERRORS+=("typescript not found in node_modules")

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "07_install_deps" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "Dependency verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

NEXT_VER=$(cat "$BASE/node_modules/next/package.json" | jq -r '.version')
mark_step_verified "$SLUG" "07_install_deps"
ok "Dependencies verified: Next.js $NEXT_VER installed"
