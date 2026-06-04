#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "06_write_env"

STATE=$(read_state "$SLUG")
BASE="/opt/sf-instances/${SLUG}"
ENV_FILE="$BASE/.env"

# Extract all values from state
DOMAIN=$(echo "$STATE" | jq -r '.input.domain')
NEXTJS_PORT=$(echo "$STATE" | jq -r '.ports.nextjs_port')
PB_PORT=$(echo "$STATE" | jq -r '.ports.pb_port')
PB_ADMIN_PW=$(echo "$STATE" | jq -r '.secrets.pb_admin_password')
NEXTAUTH_SECRET=$(echo "$STATE" | jq -r '.secrets.nextauth_secret')
INTERNAL_SECRET=$(echo "$STATE" | jq -r '.secrets.internal_secret')
BLOG_SECRET=$(echo "$STATE" | jq -r '.secrets.blog_webhook_secret')
RETELL_SECRET=$(echo "$STATE" | jq -r '.secrets.retell_webhook_secret')
REVIEWS_SECRET=$(echo "$STATE" | jq -r '.secrets.reviews_webhook_secret')
TEMPLATE=$(echo "$STATE" | jq -r '.input.template')

# Validate all values are present before writing
for VAR in DOMAIN NEXTJS_PORT PB_PORT PB_ADMIN_PW NEXTAUTH_SECRET INTERNAL_SECRET; do
  VAL="${!VAR}"
  ( [ -z "$VAL" ] || [ "$VAL" = "null" ] ) && \
    { mark_step_failed "$SLUG" "06_write_env" "$VAR is null/empty in state"; exit_fail "$VAR not set. Complete earlier steps first."; }
done

cat > "$ENV_FILE" << ENVEOF
# SuccessForce CMS — Instance: ${SLUG}
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
# DO NOT EDIT MANUALLY WITHOUT CARE

PB_URL=http://127.0.0.1:${PB_PORT}
PB_PORT=${PB_PORT}
PB_ADMIN_EMAIL=${PB_ADMIN_EMAIL:-admin@successforce.com}
PB_ADMIN_PASSWORD=${PB_ADMIN_PW}

PORT=${NEXTJS_PORT}
NODE_ENV=production

SITE_URL=https://${DOMAIN}
INSTANCE_SLUG=${SLUG}
TEMPLATE_NAME=${TEMPLATE}

NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
INTERNAL_SECRET=${INTERNAL_SECRET}

AGENCY_TOKEN=${SF_AGENCY_TOKEN:-change-me}

BLOG_WEBHOOK_SECRET=${BLOG_SECRET}
RETELL_WEBHOOK_SECRET=${RETELL_SECRET}
REVIEWS_WEBHOOK_SECRET=${REVIEWS_SECRET}
ENVEOF

chmod 600 "$ENV_FILE"
mark_step_ok "$SLUG" "06_write_env"
ok ".env file written and permissions set to 600"
