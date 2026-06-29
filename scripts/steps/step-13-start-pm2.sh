#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "13_start_pm2"

STATE=$(read_state "$SLUG")
BASE="/opt/tribe-sites/${SLUG}"
PB_PORT=$(echo "$STATE" | jq -r '.ports.pb_port')
NEXTJS_PORT=$(echo "$STATE" | jq -r '.ports.nextjs_port')

# Kill any orphaned init PB process
fuser -k "${PB_PORT}/tcp" 2>/dev/null || true
sleep 1

info "Starting PocketBase under PM2..."
pm2 start "$BASE/pocketbase" \
  --name "tribe-pb-${SLUG}" \
  --log "$BASE/logs/pocketbase.log" \
  --time \
  --restart-delay 3000 \
  --max-restarts 10 \
  -- serve --http "127.0.0.1:${PB_PORT}" --dir "$BASE/pb_data"

wait_for_http "http://127.0.0.1:${PB_PORT}/api/health" 15 2 || \
  { mark_step_failed "$SLUG" "13_start_pm2" "PocketBase PM2 process failed to come online"; exit_fail "PocketBase PM2 startup failed"; }
info "PocketBase online"

info "Starting Next.js under PM2..."
# Explicitly load .env variables into the environment before starting PM2
# so Next.js doesn't have to rely on next start's internal dotenv loading
set -a
[ -f "$BASE/.env" ] && source "$BASE/.env"
set +a

pm2 start pnpm \
  --name "tribe-${SLUG}-next" \
  --cwd "$BASE" \
  --log "$BASE/logs/nextjs.log" \
  --time \
  --restart-delay 3000 \
  --max-restarts 10 \
  -- start --port "$NEXTJS_PORT"

sleep 8  # Give Next.js time to boot

info "Starting outbox drain worker under PM2..."
# Polls /api/internal/outbox/drain to deliver queued automation events (CMS → n8n).
# Reads PORT + INTERNAL_SECRET from the env sourced above (and falls back to $BASE/.env).
pm2 start "$BASE/scripts/drain-worker.js" \
  --name "tribe-${SLUG}-drain" \
  --cwd "$BASE" \
  --log "$BASE/logs/drain.log" \
  --time \
  --restart-delay 5000 \
  --max-restarts 10

pm2 save
mark_step_ok "$SLUG" "13_start_pm2"
ok "All PM2 processes started"
info "tribe-pb-${SLUG}    → PocketBase :${PB_PORT}"
info "tribe-${SLUG}-next  → Next.js :${NEXTJS_PORT}"
info "tribe-${SLUG}-drain → outbox drain worker"
