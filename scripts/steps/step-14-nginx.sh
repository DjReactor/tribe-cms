#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "14_nginx"

STATE=$(read_state "$SLUG")
DOMAIN=$(echo "$STATE" | jq -r '.input.domain')
NEXTJS_PORT=$(echo "$STATE" | jq -r '.ports.nextjs_port')
WWW_MODE=$(echo "$STATE" | jq -r '.input.www_mode')
BASE="/opt/tribe-sites/${SLUG}"
CONFIG="/etc/nginx/sites-available/tribe-${SLUG}"

# Generate www redirect block based on mode
case "$WWW_MODE" in
  "www-only")
    WWW_BLOCK="    if (\$host = ${DOMAIN}) { return 301 http://www.${DOMAIN}\$request_uri; }"
    SERVER_NAME="${DOMAIN} www.${DOMAIN}"
    ;;
  "both")
    WWW_BLOCK=""
    SERVER_NAME="${DOMAIN} www.${DOMAIN}"
    ;;
  *)  # redirect (default): www → non-www
    WWW_BLOCK="    if (\$host = www.${DOMAIN}) { return 301 http://${DOMAIN}\$request_uri; }"
    SERVER_NAME="${DOMAIN} www.${DOMAIN}"
    ;;
esac

cat > "$CONFIG" << NGINXEOF
# Tribe CMS — ${SLUG}
# Domain: ${DOMAIN} | Port: ${NEXTJS_PORT}
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)

server {
    listen 80;
    server_name ${SERVER_NAME};
${WWW_BLOCK}

    client_max_body_size 20M;

    location /_next/static/ {
        alias ${BASE}/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:${NEXTJS_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Pathname \$uri;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
NGINXEOF

# Validate
nginx -t 2>&1 || { rm "$CONFIG"; mark_step_failed "$SLUG" "14_nginx" "Nginx config validation failed"; exit_fail "Nginx config is invalid"; }

# Enable
ln -sf "$CONFIG" "/etc/nginx/sites-enabled/tribe-${SLUG}"

# Reload
systemctl reload nginx || { mark_step_failed "$SLUG" "14_nginx" "nginx reload failed"; exit_fail "nginx reload failed"; }

mark_step_ok "$SLUG" "14_nginx"
ok "Nginx configured for $DOMAIN → :$NEXTJS_PORT"
