#!/bin/bash
# /opt/sf-template/scripts/steps/shared.sh
# Shared utilities for all deploy step scripts

# ── State file helpers ────────────────────────────────────────────────────────

STATE_DIR="/tmp"
MIRROR_BASE="/opt/sf-instances"

state_file() {
  echo "${STATE_DIR}/sf-deploy-${1}.json"
}

mirror_state_file() {
  echo "${MIRROR_BASE}/${1}/.deploy-state.json"
}

read_state() {
  local SLUG=$1
  local FILE=$(state_file "$SLUG")
  # Prefer /tmp (freshest), fall back to mirrored copy
  if [ ! -f "$FILE" ] && [ -f "$(mirror_state_file $SLUG)" ]; then
    cp "$(mirror_state_file $SLUG)" "$FILE"
    echo "[shared] Restored state file from mirror" >&2
  fi
  [ -f "$FILE" ] || { echo "ERROR: State file not found for ${SLUG}. Run init-deploy.sh first." >&2; exit 1; }
  cat "$FILE"
}

get_state() {
  # Usage: get_state SLUG .path.to.key
  read_state "$1" | jq -r "${2}"
}

set_state() {
  # Usage: set_state SLUG '.key = "value"'
  local SLUG=$1
  local MUTATION=$2
  local FILE=$(state_file "$SLUG")
  local TEMP=$(mktemp)
  jq "$MUTATION" "$FILE" > "$TEMP" && mv "$TEMP" "$FILE"
  # Mirror to instance dir if it exists
  local MIRROR=$(mirror_state_file "$SLUG")
  [ -d "$(dirname $MIRROR)" ] && cp "$FILE" "$MIRROR" 2>/dev/null || true
}

mark_step_running() {
  set_state "$1" ".steps[\"${2}\"].status = \"running\" | .steps[\"${2}\"].ran_at = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\""
}

mark_step_ok() {
  set_state "$1" ".steps[\"${2}\"].status = \"run_ok\" | .steps[\"${2}\"].ran_at = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\" | .steps[\"${2}\"].error = null"
}

mark_step_failed() {
  local SLUG=$1 STEP=$2 ERROR=$3
  set_state "$SLUG" ".steps[\"${STEP}\"].status = \"run_failed\" | .steps[\"${STEP}\"].error = $(echo "$ERROR" | jq -Rs .)"
}

mark_step_verified() {
  set_state "$1" ".steps[\"${2}\"].status = \"verified\" | .steps[\"${2}\"].verified_at = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\" | .steps[\"${2}\"].error = null"
}

mark_step_verify_failed() {
  local SLUG=$1 STEP=$2 ERROR=$3
  set_state "$SLUG" ".steps[\"${STEP}\"].status = \"verify_failed\" | .steps[\"${STEP}\"].error = $(echo "$ERROR" | jq -Rs .)"
}

mark_step_skipped() {
  set_state "$1" ".steps[\"${2}\"].status = \"skipped\""
}

# ── Output helpers ─────────────────────────────────────────────────────────────

PASS="✓"
FAIL="✗"
WARN="⚠"
INFO="→"

ok()   { echo "${PASS} $*"; }
fail() { echo "${FAIL} $*" >&2; }
warn() { echo "${WARN} $*" >&2; }
info() { echo "${INFO} $*"; }

exit_ok()   { ok "$1"; exit 0; }
exit_fail() { fail "$1"; exit 1; }

# ── PocketBase API helpers ─────────────────────────────────────────────────────

pb_authenticate() {
  local PB_URL=$1 EMAIL=$2 PASSWORD=$3
  local RESPONSE=$(curl -sf -X POST \
    "${PB_URL}/api/collections/_superusers/auth-with-password" \
    -H "Content-Type: application/json" \
    -d "{\"identity\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" 2>/dev/null)
  echo "$RESPONSE" | jq -r '.token // empty'
}

pb_api() {
  # Usage: pb_api TOKEN METHOD URL [DATA]
  local TOKEN=$1 METHOD=$2 URL=$3 DATA=${4:-}
  local ARGS=(-sf -X "$METHOD" -H "Authorization: ${TOKEN}" -H "Content-Type: application/json" "$URL")
  [ -n "$DATA" ] && ARGS+=(-d "$DATA")
  curl "${ARGS[@]}" 2>/dev/null
}

pb_collection_exists() {
  local TOKEN=$1 PB_URL=$2 NAME=$3
  local CODE=$(curl -sf -o /dev/null -w "%{http_code}" \
    -H "Authorization: ${TOKEN}" \
    "${PB_URL}/api/collections/${NAME}" 2>/dev/null)
  [ "$CODE" = "200" ]
}

# ── Wait helpers ───────────────────────────────────────────────────────────────

wait_for_http() {
  # Usage: wait_for_http URL [MAX_ATTEMPTS] [INTERVAL_SECONDS]
  local URL=$1 MAX=${2:-15} INTERVAL=${3:-2}
  for i in $(seq 1 $MAX); do
    CODE=$(curl -sf -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 5 "$URL" 2>/dev/null)
    [ -n "$CODE" ] && [ "$CODE" != "000" ] && return 0
    [ $i -lt $MAX ] && sleep $INTERVAL
  done
  return 1
}
