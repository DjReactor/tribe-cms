#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "03_secrets"

# Generate all secrets
PB_ADMIN_PW=$(openssl rand -hex 24)           # 48 chars
NEXTAUTH_SECRET=$(openssl rand -hex 32)        # 64 chars
INTERNAL_SECRET=$(openssl rand -hex 32)        # 64 chars
BO_TEMP_PW=$(openssl rand -base64 12 | tr -d '/+=!' | head -c 12)  # 12 alphanumeric
BLOG_SECRET=$(openssl rand -hex 32)
RETELL_SECRET=$(openssl rand -hex 32)
REVIEWS_SECRET=$(openssl rand -hex 32)

# Validate all were generated
for VAR_NAME in PB_ADMIN_PW NEXTAUTH_SECRET INTERNAL_SECRET BO_TEMP_PW BLOG_SECRET RETELL_SECRET REVIEWS_SECRET; do
  VAL="${!VAR_NAME}"
  [ -z "$VAL" ] && { mark_step_failed "$SLUG" "03_secrets" "Failed to generate $VAR_NAME"; exit_fail "openssl failed for $VAR_NAME"; }
done

# Write to state
set_state "$SLUG" "
  .secrets.pb_admin_password     = \"$PB_ADMIN_PW\"     |
  .secrets.nextauth_secret        = \"$NEXTAUTH_SECRET\"  |
  .secrets.internal_secret        = \"$INTERNAL_SECRET\"  |
  .secrets.bo_temp_password       = \"$BO_TEMP_PW\"       |
  .secrets.blog_webhook_secret    = \"$BLOG_SECRET\"      |
  .secrets.retell_webhook_secret  = \"$RETELL_SECRET\"    |
  .secrets.reviews_webhook_secret = \"$REVIEWS_SECRET\"
"
mark_step_ok "$SLUG" "03_secrets"
ok "All secrets generated"
info "PB admin password: ${PB_ADMIN_PW:0:6}... (${#PB_ADMIN_PW} chars)"
info "BO temp password:  $BO_TEMP_PW"
info "Internal secret:   ${INTERNAL_SECRET:0:8}... (${#INTERNAL_SECRET} chars)"
