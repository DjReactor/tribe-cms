#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."03_secrets".status')
[ "$STATUS" = "pending" ] && exit_fail "Step not run yet"

ERRORS=()
FIELDS="pb_admin_password nextauth_secret internal_secret bo_temp_password blog_webhook_secret retell_webhook_secret reviews_webhook_secret"
MIN_LENGTHS='{"pb_admin_password":40,"nextauth_secret":60,"internal_secret":60,"bo_temp_password":8,"blog_webhook_secret":60,"retell_webhook_secret":60,"reviews_webhook_secret":60}'

for FIELD in $FIELDS; do
  VAL=$(echo "$STATE" | jq -r ".secrets.${FIELD}")
  [ "$VAL" = "null" ] || [ -z "$VAL" ] && { ERRORS+=("$FIELD is null or empty"); continue; }
  MIN=$(echo "$MIN_LENGTHS" | jq -r ".${FIELD}")
  [ ${#VAL} -lt $MIN ] && ERRORS+=("$FIELD is too short: ${#VAL} chars (min: $MIN)")
done

# Check all secrets are unique (no duplicates)
ALL_SECRETS=$(echo "$STATE" | jq '[.secrets | to_entries[] | .value] | sort')
UNIQUE=$(echo "$ALL_SECRETS" | jq 'unique | length')
TOTAL=$(echo "$ALL_SECRETS" | jq 'length')
[ "$UNIQUE" != "$TOTAL" ] && ERRORS+=("Duplicate secrets detected ($TOTAL total, $UNIQUE unique)")

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "03_secrets" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "Secret verification failed:"; printf '  %s\n' "${ERRORS[@]}" >&2; exit 1
fi

mark_step_verified "$SLUG" "03_secrets"
ok "All 7 secrets present, unique, and meet minimum length"
BO_PW=$(echo "$STATE" | jq -r '.secrets.bo_temp_password')
info "BO temp password (note this): $BO_PW"
