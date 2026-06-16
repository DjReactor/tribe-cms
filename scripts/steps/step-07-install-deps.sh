#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "07_install_deps"

BASE="/opt/tribe-sites/${SLUG}"
[ ! -f "$BASE/package.json" ] && \
  { mark_step_failed "$SLUG" "07_install_deps" "package.json missing — run step 05 first"; exit_fail "package.json not found"; }

info "Running pnpm install (hard-linking from global store)..."
cd "$BASE"
pnpm install --frozen-lockfile 2>&1
RC=$?

[ $RC -ne 0 ] && { mark_step_failed "$SLUG" "07_install_deps" "pnpm install exited $RC"; exit_fail "pnpm install failed (exit $RC)"; }

mark_step_ok "$SLUG" "07_install_deps"
ok "Dependencies installed"
PKG_COUNT=$(ls node_modules | wc -l)
info "node_modules contains $PKG_COUNT top-level packages"
