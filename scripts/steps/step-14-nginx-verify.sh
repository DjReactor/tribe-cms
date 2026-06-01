#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."14_nginx".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

DOMAIN=$(echo "$STATE" | jq -r '.input.domain')
NEXTJS_PORT=$(echo "$STATE" | jq -r '.ports.nextjs_port')
ERRORS=()

[ ! -f "/etc/nginx/sites-available/sf-${SLUG}" ] && ERRORS+=("Nginx config file missing")
[ ! -L "/etc/nginx/sites-enabled/sf-${SLUG}" ] && ERRORS+=("Nginx site not enabled (symlink missing)")

nginx -t 2>/dev/null || ERRORS+=("Nginx config validation fails")

# Test HTTP response (accept 200, 301, 302)
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 \
  -H "Host: $DOMAIN" "http://127.0.0.1:80/" 2>/dev/null)
[ -z "$HTTP_CODE" ] && ERRORS+=("No HTTP response from Nginx on port 80 for domain $DOMAIN")
[[ ! "$HTTP_CODE" =~ ^(200|301|302)$ ]] && [ -n "$HTTP_CODE" ] && \
  ERRORS+=("Unexpected HTTP status: $HTTP_CODE (expected 200, 301, or 302)")

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "14_nginx" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "Nginx verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

mark_step_verified "$SLUG" "14_nginx"
ok "Nginx verified: config valid, site enabled, HTTP $HTTP_CODE on port 80"
