#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."06_write_env".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

ENV_FILE="/opt/tribe-sites/${SLUG}/.env"
ERRORS=()
REQUIRED_KEYS="PB_URL PB_PORT PB_ADMIN_EMAIL PB_ADMIN_PASSWORD PORT NODE_ENV SITE_URL INSTANCE_SLUG TEMPLATE_NAME NEXTAUTH_SECRET INTERNAL_SECRET AGENCY_TOKEN BLOG_WEBHOOK_SECRET RETELL_WEBHOOK_SECRET REVIEWS_WEBHOOK_SECRET"

[ ! -f "$ENV_FILE" ] && { mark_step_verify_failed "$SLUG" "06_write_env" ".env file missing"; exit_fail ".env file not found"; }

# Check permissions
PERMS=$(stat -c "%a" "$ENV_FILE")
[ "$PERMS" != "600" ] && ERRORS+=(".env permissions are $PERMS, expected 600")

# Check all required keys are present and non-empty
for KEY in $REQUIRED_KEYS; do
  VAL=$(grep "^${KEY}=" "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
  ( [ -z "$VAL" ] || echo "$VAL" | grep -q "^$" ) && ERRORS+=("Missing or empty: $KEY")
done

# Cross-check .env values against state
STATE_PORT=$(echo "$STATE" | jq -r '.ports.nextjs_port')
ENV_PORT=$(grep "^PORT=" "$ENV_FILE" | cut -d= -f2)
[ "$STATE_PORT" != "$ENV_PORT" ] && ERRORS+=("PORT mismatch: state=$STATE_PORT, .env=$ENV_PORT")

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "06_write_env" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "Env file verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

KEY_COUNT=$(grep -c "^[A-Z]" "$ENV_FILE")
mark_step_verified "$SLUG" "06_write_env"
ok ".env verified: $KEY_COUNT keys, permissions 600"
