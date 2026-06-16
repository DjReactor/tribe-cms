#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."17_register".status')
[ "$STATUS" = "pending" ]  && exit_fail "Step not run yet"

RECORD_ID=$(echo "$STATE" | jq -r '.runtime.superadmin_record_id // ""')
ERRORS=()

[ -z "$RECORD_ID" ] || [ "$RECORD_ID" = "null" ] && \
  ERRORS+=("No record ID in state file — registration may have failed")

SA_DB="/opt/tribe-superadmin/data/instances.db"

if [ -n "$RECORD_ID" ] && [ "$RECORD_ID" != "null" ]; then
  if [ ! -f "$SA_DB" ]; then
    ERRORS+=("SuperAdmin instances.db not found at $SA_DB")
  else
    DB_SLUG=$(node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(process.argv[1]);
try {
  const row = db.prepare('SELECT slug FROM instances WHERE id = ?').get(process.argv[2]);
  process.stdout.write(row ? row.slug : '');
} catch(e) { process.stdout.write(''); }
" "$SA_DB" "$RECORD_ID" 2>/dev/null)

    if [ "$DB_SLUG" != "$SLUG" ]; then
      ERRORS+=("Record slug mismatch in instances.db: got '$DB_SLUG', expected '$SLUG'")
    fi
  fi
fi

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "17_register" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "Registration verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

mark_step_verified "$SLUG" "17_register"
ok "Instance record verified in SuperAdmin SQLite registry (ID: $RECORD_ID)"
