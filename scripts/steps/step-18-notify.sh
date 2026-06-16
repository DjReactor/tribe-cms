#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "18_notify"

STATE=$(read_state "$SLUG")
DOMAIN=$(echo "$STATE" | jq -r '.input.domain')
BUSINESS_NAME=$(echo "$STATE" | jq -r '.input.business_name')
NICHE=$(echo "$STATE" | jq -r '.input.niche // ""')
BO_EMAIL=$(echo "$STATE" | jq -r '.input.bo_email')
BO_PW=$(echo "$STATE" | jq -r '.secrets.bo_temp_password')
VERSION=$(echo "$STATE" | jq -r '.runtime.template_version')
TEMPLATE=$(echo "$STATE" | jq -r '.input.template')
SSL=$(echo "$STATE" | jq -r '.runtime.ssl_issued')

if [ -z "$TRIBE_N8N_DEPLOY_WEBHOOK" ]; then
  mark_step_ok "$SLUG" "18_notify"
  ok "n8n webhook not configured — skipping notification (deploy complete)"
  info "Set TRIBE_N8N_DEPLOY_WEBHOOK in /etc/environment to enable welcome emails"
  exit 0
fi

RESP=$(curl -sf -w "\n%{http_code}" -X POST "$TRIBE_N8N_DEPLOY_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"instance.deployed\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"slug\": \"$SLUG\",
    \"domain\": \"$DOMAIN\",
    \"business_name\": $(echo "$BUSINESS_NAME" | jq -Rs .),
    \"niche\": \"$NICHE\",
    \"bo_email\": \"$BO_EMAIL\",
    \"bo_temp_password\": \"$BO_PW\",
    \"dashboard_url\": \"https://${DOMAIN}/dashboard\",
    \"login_url\": \"https://${DOMAIN}/login\",
    \"site_url\": \"https://${DOMAIN}\",
    \"template\": \"$TEMPLATE\",
    \"version\": \"$VERSION\",
    \"ssl_active\": $SSL
  }" 2>/dev/null)

HTTP_CODE=$(echo "$RESP" | tail -1)
if [[ "$HTTP_CODE" =~ ^2 ]]; then
  mark_step_ok "$SLUG" "18_notify"
  ok "n8n webhook triggered (HTTP $HTTP_CODE)"
  info "n8n will send welcome email to $BO_EMAIL"
else
  # Notification failure is non-fatal — deployment itself is complete
  mark_step_ok "$SLUG" "18_notify"
  warn "n8n webhook returned HTTP $HTTP_CODE — notification not sent (non-fatal)"
  info "Deploy is complete. Send welcome email to $BO_EMAIL manually if needed."
fi
