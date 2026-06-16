#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
DOMAIN=$(echo "$STATE" | jq -r '.input.domain')
BO_EMAIL=$(echo "$STATE" | jq -r '.input.bo_email')
TEMPLATE=$(echo "$STATE" | jq -r '.input.template')

mark_step_running "$SLUG" "01_validate"
ERRORS=()

# Check slug format
echo "$SLUG" | grep -qE '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' || \
  ERRORS+=("Slug '$SLUG' invalid: use lowercase letters, numbers, hyphens, 3-40 chars")

# Check slug uniqueness (no existing instance directory)
[ -d "/opt/tribe-sites/${SLUG}" ] && \
  ERRORS+=("Instance directory already exists: /opt/tribe-sites/${SLUG}")

# Check PM2 conflict
pm2 list 2>/dev/null | grep -q "tribe-${SLUG}-next" && \
  ERRORS+=("PM2 process tribe-${SLUG}-next already exists")

# Check domain format
echo "$DOMAIN" | grep -qE '^[a-zA-Z0-9][a-zA-Z0-9.-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$' || \
  ERRORS+=("Domain '$DOMAIN' is not a valid format")

# Check domain not already used by another instance
for ENV in /opt/tribe-sites/*/.env; do
  [ -f "$ENV" ] || continue
  EXISTING=$(grep "^SITE_URL=" "$ENV" 2>/dev/null | grep -o "$DOMAIN" || true)
  [ -n "$EXISTING" ] && ERRORS+=("Domain '$DOMAIN' already used by $(basename $(dirname $ENV))")
done

# Check Nginx conflict
[ -f "/etc/nginx/sites-available/tribe-${SLUG}" ] && \
  ERRORS+=("Nginx config already exists: tribe-${SLUG}")

# Check BO email format
echo "$BO_EMAIL" | grep -qE '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' || \
  ERRORS+=("BO email '$BO_EMAIL' is not valid format")

# Check template exists
[ ! -d "/opt/tribe-instances/src/templates/${TEMPLATE}" ] && \
  ERRORS+=("Template '${TEMPLATE}' not found in /opt/tribe-instances/src/templates/")

# Check master template has .tribe-version
[ ! -f "/opt/tribe-instances/.tribe-version" ] && \
  ERRORS+=("Master template is missing .tribe-version file")

# Check required tools
for TOOL in jq curl openssl pnpm pm2 nginx certbot; do
  command -v $TOOL &>/dev/null || ERRORS+=("Required tool not found: $TOOL")
done

# Evaluate
if [ ${#ERRORS[@]} -gt 0 ]; then
  ERROR_MSG=$(printf '%s\n' "${ERRORS[@]}")
  mark_step_failed "$SLUG" "01_validate" "$ERROR_MSG"
  fail "Validation failed:"
  printf '  %s\n' "${ERRORS[@]}" >&2
  exit 1
fi

mark_step_ok "$SLUG" "01_validate"
ok "All validations passed"
info "Slug:     $SLUG (unique)"
info "Domain:   $DOMAIN (available)"
info "Email:    $BO_EMAIL (valid)"
info "Template: $TEMPLATE (found)"
info "Version:  $(cat /opt/tribe-instances/.tribe-version)"
