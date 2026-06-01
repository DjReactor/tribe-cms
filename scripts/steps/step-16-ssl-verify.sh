#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."16_ssl".status')
[ "$STATUS" = "skipped" ]  && exit_ok "SSL was intentionally skipped"
[ "$STATUS" = "pending" ]  && exit_fail "Step not run yet"

DOMAIN=$(echo "$STATE" | jq -r '.input.domain')
ERRORS=()

# Check Certbot has a cert for this domain
certbot certificates 2>/dev/null | grep -q "$DOMAIN" || \
  ERRORS+=("No Certbot certificate found for $DOMAIN")

# Test HTTPS response
HTTPS_CODE=$(curl -sf -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 \
  "https://${DOMAIN}/" 2>/dev/null)
[ "$HTTPS_CODE" != "200" ] && [ -n "$HTTPS_CODE" ] && \
  ERRORS+=("HTTPS returned $HTTPS_CODE, expected 200")
[ -z "$HTTPS_CODE" ] && ERRORS+=("No HTTPS response from $DOMAIN")

# Verify cert expiry
EXPIRY=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "$DOMAIN" 2>/dev/null \
  | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
[ -n "$EXPIRY" ] && info "Certificate expires: $EXPIRY"

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "16_ssl" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "SSL verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

mark_step_verified "$SLUG" "16_ssl"
ok "SSL verified: HTTPS returns 200, certificate valid. Expires: $EXPIRY"
