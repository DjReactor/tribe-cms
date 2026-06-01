#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
SKIP_SSL=$(echo "$STATE" | jq -r '.input.skip_ssl')

if [ "$SKIP_SSL" = "true" ]; then
  mark_step_skipped "$SLUG" "16_ssl"
  warn "SSL skipped (--skip-ssl was set). Run add-ssl.sh later."
  exit 0
fi

mark_step_running "$SLUG" "16_ssl"
DOMAIN=$(echo "$STATE" | jq -r '.input.domain')
VPS_IP=$(curl -sf --max-time 5 ifconfig.me 2>/dev/null)
DNS_IP=$(dig +short "$DOMAIN" 2>/dev/null | tail -1)

info "DNS check: $DOMAIN → $DNS_IP (VPS: $VPS_IP)"
[ "$DNS_IP" != "$VPS_IP" ] && \
  warn "DNS does not point to VPS. Certbot may fail. Expected $VPS_IP, got $DNS_IP"

WWW_DNS_IP=$(dig +short "www.$DOMAIN" 2>/dev/null | tail -1)

if [ "$WWW_DNS_IP" = "$VPS_IP" ]; then
  info "DNS check: www.$DOMAIN → $WWW_DNS_IP"
  certbot --nginx \
    -d "$DOMAIN" -d "www.${DOMAIN}" \
    --non-interactive --agree-tos \
    -m "${SF_SSL_EMAIL:-ssl@successforce.com}" \
    --redirect 2>&1
else
  info "DNS for www.$DOMAIN missing or mismatch. Requesting SSL for $DOMAIN only."
  certbot --nginx \
    -d "$DOMAIN" \
    --non-interactive --agree-tos \
    -m "${SF_SSL_EMAIL:-ssl@successforce.com}" \
    --redirect 2>&1
fi

RC=$?
if [ $RC -ne 0 ]; then
  mark_step_failed "$SLUG" "16_ssl" "Certbot exited $RC. DNS may not have propagated."
  fail "SSL provisioning failed (Certbot exit $RC). Run add-ssl.sh after DNS propagates."
  exit 1
fi

set_state "$SLUG" ".runtime.ssl_issued = true"
systemctl reload nginx
mark_step_ok "$SLUG" "16_ssl"
ok "SSL certificate issued for $DOMAIN and www.$DOMAIN"
