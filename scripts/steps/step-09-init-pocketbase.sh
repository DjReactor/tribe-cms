#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "09_init_pocketbase"

STATE=$(read_state "$SLUG")
BASE="/opt/sf-instances/${SLUG}"
PB_PORT=$(echo "$STATE" | jq -r '.ports.pb_port')
PB_ADMIN_PW=$(echo "$STATE" | jq -r '.secrets.pb_admin_password')

# Kill any orphaned PocketBase process on this port
fuser -k "${PB_PORT}/tcp" 2>/dev/null || true
sleep 1

info "Creating admin account..."
"$BASE/pocketbase" superuser upsert "admin@successforce.com" "${PB_ADMIN_PW}" --dir "$BASE/pb_data" > /dev/null 2>&1
RC=$?
[ $RC -ne 0 ] && \
  { mark_step_failed "$SLUG" "09_init_pocketbase" "Admin creation failed via CLI"; exit_fail "Admin creation failed"; }

info "Starting PocketBase on port $PB_PORT for initialization..."
"$BASE/pocketbase" serve \
  --http "127.0.0.1:${PB_PORT}" \
  --dir "$BASE/pb_data" &
PB_PID=$!
trap "kill $PB_PID 2>/dev/null; wait $PB_PID 2>/dev/null" EXIT

wait_for_http "http://127.0.0.1:${PB_PORT}/api/health" 20 2 || \
  { mark_step_failed "$SLUG" "09_init_pocketbase" "PocketBase did not start within 40s"; exit_fail "PocketBase failed to start"; }

info "Authenticating as admin..."
AUTH_RESP=$(curl -sf -X POST \
  "http://127.0.0.1:${PB_PORT}/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"admin@successforce.com\",\"password\":\"${PB_ADMIN_PW}\"}" 2>/dev/null)

PB_TOKEN=$(echo "$AUTH_RESP" | jq -r '.token // empty')
[ -z "$PB_TOKEN" ] && \
  { mark_step_failed "$SLUG" "09_init_pocketbase" "Admin auth failed"; exit_fail "Could not get admin token"; }

info "Importing collection schema..."
SCHEMA_JSON=$(cat "$BASE/pb_schema/schema.json")
IMPORT_RESP=$(curl -sf -X PUT \
  "http://127.0.0.1:${PB_PORT}/api/collections/import" \
  -H "Authorization: ${PB_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"collections\":${SCHEMA_JSON},\"deleteMissing\":false}" 2>/dev/null)

echo "$IMPORT_RESP" | jq -e '.code >= 400' > /dev/null 2>&1 && \
  { mark_step_failed "$SLUG" "09_init_pocketbase" "Schema import failed: $(echo $IMPORT_RESP | jq -r '.message // .')"; exit_fail "Schema import failed"; }

# Store token in state (expires in 1 day, enough for all steps)
set_state "$SLUG" ".runtime.pb_admin_token = \"$PB_TOKEN\" | .runtime.pb_admin_token_expires = \"$(date -u -d '+23 hours' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)\""

# Stop init process (PM2 will start the permanent one in step 13)
kill $PB_PID 2>/dev/null; wait $PB_PID 2>/dev/null; trap - EXIT
sleep 2

mark_step_ok "$SLUG" "09_init_pocketbase"
ok "PocketBase initialized: admin created, schema imported"
