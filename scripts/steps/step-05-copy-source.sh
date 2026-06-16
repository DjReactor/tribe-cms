#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "05_copy_source"

SRC="/opt/tribe-instances"
DEST="/opt/tribe-sites/${SLUG}"

[ ! -d "$SRC/src" ] && { mark_step_failed "$SLUG" "05_copy_source" "Master template src/ missing"; exit_fail "Master template src/ not found"; }

info "Copying template source (this may take a moment)..."
rsync -a --delete \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='pb_data' \
  --exclude='.env' \
  --exclude='custom' \
  --exclude='*.log' \
  --exclude='backups' \
  --exclude='.deploy-state.json' \
  --exclude='.tribe-update-lock' \
  "$SRC/" "$DEST/" 2>&1 | tail -5

[ ${PIPESTATUS[0]} -ne 0 ] && { mark_step_failed "$SLUG" "05_copy_source" "rsync failed"; exit_fail "rsync failed"; }

# Copy PocketBase binary
cp /usr/local/bin/pocketbase "$DEST/pocketbase"
chmod +x "$DEST/pocketbase"

# Write current template version
cp "$SRC/.tribe-version" "$DEST/.tribe-version"
VERSION=$(cat "$DEST/.tribe-version")
set_state "$SLUG" ".runtime.template_version = \"$VERSION\""

mark_step_ok "$SLUG" "05_copy_source"
ok "Template source copied"
info "Version: $VERSION"
info "PocketBase binary: $DEST/pocketbase"
