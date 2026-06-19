#!/bin/bash
# Creates the initial deploy state file.
# Usage: init-deploy.sh --slug SLUG --domain DOMAIN --business-name NAME
#                       --bo-email EMAIL [--niche NICHE] [--city CITY]
#                       [--state STATE] [--phone PHONE] [--template TEMPLATE]
#                       [--channel CHANNEL] [--www WWW_MODE] [--skip-ssl]
. /opt/tribe-instances/scripts/steps/shared.sh

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --slug)          SLUG="$2"; shift 2 ;;
    --domain)        DOMAIN="$2"; shift 2 ;;
    --business-name) BUSINESS_NAME="$2"; shift 2 ;;
    --bo-email)      BO_EMAIL="$2"; shift 2 ;;
    --niche)         NICHE="$2"; shift 2 ;;
    --city)          CITY="${2:-}"; shift 2 ;;
    --state)         STATE="${2:-}"; shift 2 ;;
    --phone)         PHONE="${2:-}"; shift 2 ;;
    --template)      TEMPLATE="$2"; shift 2 ;;
    --channel)       CHANNEL="${2:-stable}"; shift 2 ;;
    --www)           WWW_MODE="${2:-redirect}"; shift 2 ;;
    --skip-ssl)      SKIP_SSL=true; shift ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# Validate required args
[ -z "$SLUG" ]          && exit_fail "--slug is required"
[ -z "$DOMAIN" ]        && exit_fail "--domain is required"
[ -z "$BUSINESS_NAME" ] && exit_fail "--business-name is required"
[ -z "$BO_EMAIL" ]      && exit_fail "--bo-email is required"

# Resolve template selection.
# An explicit --template (or TEMPLATE env var) always wins. Otherwise auto-discover
# the first available template — the first dir (alphabetical) that ships a manifest.json,
# matching how src/lib/template-registry.ts decides what is a real template. This avoids
# depending on a hardcoded template name that could be renamed or removed.
# To pin a specific default later, add a "default": true flag to a manifest.json and
# prefer it here.
TEMPLATES_DIR="/opt/tribe-instances/src/templates"
if [ -z "${TEMPLATE:-}" ]; then
  for d in "$TEMPLATES_DIR"/*/; do
    [ -f "${d}manifest.json" ] || continue
    TEMPLATE=$(basename "$d")
    break
  done
fi
[ -z "${TEMPLATE:-}" ] && exit_fail "No usable template (with manifest.json) found in $TEMPLATES_DIR"

# Resolve niche to business_type and schema_type
NICHE_MAP=$(cat /opt/tribe-instances/scripts/steps/niche-map.json)
BUSINESS_TYPE=$(echo "$NICHE_MAP" | jq -r --arg n "${NICHE:-other}" '.[$n].business_type // ""')
SCHEMA_TYPE=$(echo "$NICHE_MAP" | jq -r --arg n "${NICHE:-other}" '.[$n].schema_type // "LocalBusiness"')

FILE=$(state_file "$SLUG")
[ -f "$FILE" ] && echo "WARNING: State file already exists. Overwriting." >&2

cat > "$FILE" << STATEOF
{
  "_meta": {
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "initiated_by": "${SUDO_USER:-root}",
    "version": "1.0"
  },
  "input": {
    "slug": "$SLUG",
    "domain": "$DOMAIN",
    "business_name": $(echo "$BUSINESS_NAME" | jq -Rs .),
    "bo_email": "$BO_EMAIL",
    "niche": "${NICHE:-}",
    "city": "${CITY:-}",
    "state": "${STATE:-}",
    "phone": "${PHONE:-}",
    "template": "$TEMPLATE",
    "channel": "${CHANNEL:-stable}",
    "www_mode": "${WWW_MODE:-redirect}",
    "skip_ssl": ${SKIP_SSL:-false}
  },
  "resolved": {
    "business_type": $(echo "$BUSINESS_TYPE" | jq -Rs .),
    "schema_type": "$SCHEMA_TYPE",
    "site_url": "https://$DOMAIN"
  },
  "ports":   { "nextjs_port": null, "pb_port": null },
  "secrets": { "pb_admin_password": null, "nextauth_secret": null, "internal_secret": null,
               "bo_temp_password": null, "blog_webhook_secret": null,
               "retell_webhook_secret": null, "reviews_webhook_secret": null },
  "runtime": { "template_version": null, "pb_admin_token": null,
               "pb_admin_token_expires": null, "bo_user_id": null,
               "ssl_issued": false, "superadmin_record_id": null },
  "steps": {
    "01_validate":        { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "02_ports":           { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "03_secrets":         { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "04_directories":     { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "05_copy_source":     { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "06_write_env":       { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "07_install_deps":    { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "08_build_artifact":  { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "09_init_pocketbase": { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "10_run_migrations":  { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "11_seed_data":       { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "12_create_bo_user":  { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "13_start_pm2":       { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "14_nginx":           { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "15_health_check":    { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "16_ssl":             { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "17_register":        { "status": "pending", "ran_at": null, "verified_at": null, "error": null },
    "18_notify":          { "status": "pending", "ran_at": null, "verified_at": null, "error": null }
  }
}
STATEOF

ok "State file created: $FILE"
info "Slug:     $SLUG"
info "Domain:   $DOMAIN"
info "Business: $BUSINESS_NAME"
info "Niche:    ${NICHE:-none} → type: ${BUSINESS_TYPE:-unset}, schema: $SCHEMA_TYPE"
info "Template: $TEMPLATE"
