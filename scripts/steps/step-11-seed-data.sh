#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "11_seed_data"

STATE=$(read_state "$SLUG")
BASE="/opt/sf-instances/${SLUG}"
PB_PORT=$(echo "$STATE" | jq -r '.ports.pb_port')
PB_ADMIN_PW=$(echo "$STATE" | jq -r '.secrets.pb_admin_password')
BUSINESS_NAME=$(echo "$STATE" | jq -r '.input.business_name')
CITY=$(echo "$STATE" | jq -r '.input.city // ""')
PHONE=$(echo "$STATE" | jq -r '.input.phone // ""')
BUSINESS_TYPE=$(echo "$STATE" | jq -r '.resolved.business_type // ""')
SCHEMA_TYPE=$(echo "$STATE" | jq -r '.resolved.schema_type // "LocalBusiness"')

NICHE_ID=$(echo "$STATE" | jq -r '.resolved.niche_id // ""')
if [ -z "$NICHE_ID" ]; then
  NICHE_ID=$(echo "$BUSINESS_TYPE" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')
fi

NICHE_CONFIG_FILE="/opt/sf-template/scripts/steps/niche-configs/${NICHE_ID}.json"
if [ ! -f "$NICHE_CONFIG_FILE" ]; then
  NICHE_SCHEMA_JSON='{"niche_id":"default","niche_name":"Local Business","custom_attributes":[]}'
else
  NICHE_SCHEMA_JSON=$(cat "$NICHE_CONFIG_FILE" | jq -c '.')
fi

NICHE_ATTRIBUTES_SCAFFOLD=$(echo "$NICHE_SCHEMA_JSON" | jq -c 'if .custom_attributes then [.custom_attributes[].key] | map({(.): ""}) | add else {} end')
[ -z "$NICHE_ATTRIBUTES_SCAFFOLD" ] || [ "$NICHE_ATTRIBUTES_SCAFFOLD" = "null" ] && NICHE_ATTRIBUTES_SCAFFOLD="{}"
TEMPLATE=$(echo "$STATE" | jq -r '.input.template')
CHANNEL=$(echo "$STATE" | jq -r '.input.channel')
BLOG_SECRET=$(echo "$STATE" | jq -r '.secrets.blog_webhook_secret')
RETELL_SECRET=$(echo "$STATE" | jq -r '.secrets.retell_webhook_secret')
REVIEWS_SECRET=$(echo "$STATE" | jq -r '.secrets.reviews_webhook_secret')
VERSION=$(cat "$BASE/.sf-version")

fuser -k "${PB_PORT}/tcp" 2>/dev/null || true; sleep 1
"$BASE/pocketbase" serve --http "127.0.0.1:${PB_PORT}" --dir "$BASE/pb_data" &
PB_PID=$!
trap "kill $PB_PID 2>/dev/null; wait $PB_PID 2>/dev/null" EXIT
wait_for_http "http://127.0.0.1:${PB_PORT}/api/health" 15 2 || { kill $PB_PID 2>/dev/null; exit_fail "PocketBase won't start"; }

TOKEN=$(pb_authenticate "http://127.0.0.1:${PB_PORT}" "${PB_ADMIN_EMAIL:-admin@successforce.com}" "$PB_ADMIN_PW")
[ -z "$TOKEN" ] && { kill $PB_PID 2>/dev/null; exit_fail "PB auth failed"; }

DEFAULT_HOURS='[
  {"day":"monday","enabled":true,"open":"08:00 am","close":"06:00 pm"},
  {"day":"tuesday","enabled":true,"open":"08:00 am","close":"06:00 pm"},
  {"day":"wednesday","enabled":true,"open":"08:00 am","close":"06:00 pm"},
  {"day":"thursday","enabled":true,"open":"08:00 am","close":"06:00 pm"},
  {"day":"friday","enabled":true,"open":"08:00 am","close":"06:00 pm"},
  {"day":"saturday","enabled":false,"open":"09:00 am","close":"04:00 pm"},
  {"day":"sunday","enabled":false,"open":"09:00 am","close":"01:00 pm"}
]'

# Create business_info
jq -n \
  --arg bn "$BUSINESS_NAME" \
  --arg city "$CITY" \
  --arg phone "$PHONE" \
  --arg type "$BUSINESS_TYPE" \
  --argjson hours "$DEFAULT_HOURS" \
  --argjson attrs "$NICHE_ATTRIBUTES_SCAFFOLD" \
  '{business_name: $bn, city: $city, phone: $phone, business_type: $type, hours: $hours, emergency_service: "No", service_radius: 25, niche_attributes: $attrs}' > /tmp/biz_payload.json

pb_api "$TOKEN" POST "http://127.0.0.1:${PB_PORT}/api/collections/business_info/records" "$(< /tmp/biz_payload.json)"
info "Created business_info"

# Create settings
jq -n \
  --arg tmpl "$TEMPLATE" \
  --arg ch "$CHANNEL" \
  --arg blog "$BLOG_SECRET" \
  --arg retell "$RETELL_SECRET" \
  --arg rev "$REVIEWS_SECRET" \
  --argjson schema "$NICHE_SCHEMA_JSON" \
  '{active_template: $tmpl, template_config: {}, allowed_templates: [], niche_schema: $schema, blog_enabled: true, retell_enabled: true, reviews_enabled: true, analytics_enabled: true, crm_enabled: true, updates_enabled: true, update_channel: $ch, show_powered_by: false, notify_on_publish: true, notify_monthly_summary: true, notify_new_blog_post: true, blog_auto_publish: true, blog_webhook_secret: $blog, retell_webhook_secret: $retell, reviews_webhook_secret: $rev}' > /tmp/settings_payload.json

pb_api "$TOKEN" POST "http://127.0.0.1:${PB_PORT}/api/collections/settings/records" "$(< /tmp/settings_payload.json)"
info "Created settings"

# Create seo_settings
pb_api "$TOKEN" POST "http://127.0.0.1:${PB_PORT}/api/collections/seo_settings/records" \
  "{\"schema_business_type\":\"$SCHEMA_TYPE\",\"title_separator\":\"|\",\"enable_breadcrumbs\":true,\"enable_aggregate_rating\":true,\"noindex_blog\":false,\"noindex_service_areas\":false}"
info "Created seo_settings"

# Create template_meta
pb_api "$TOKEN" POST "http://127.0.0.1:${PB_PORT}/api/collections/template_meta/records" \
  "{\"current_version\":\"$VERSION\",\"update_available\":false,\"last_updated\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
info "Created template_meta"

kill $PB_PID 2>/dev/null; wait $PB_PID 2>/dev/null; trap - EXIT; sleep 1
mark_step_ok "$SLUG" "11_seed_data"
ok "Default data seeded: business_info, settings, seo_settings, template_meta"
