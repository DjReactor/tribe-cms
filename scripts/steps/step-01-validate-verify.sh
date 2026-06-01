#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."01_validate".status')

[ "$STATUS" != "run_ok" ] && [ "$STATUS" != "verify_failed" ] && \
  exit_fail "Step has not been run yet (status: $STATUS). Run step-01-validate.sh first."

ERRORS=()
SLUG_VAL=$(echo "$STATE" | jq -r '.input.slug')
DOMAIN=$(echo "$STATE" | jq -r '.input.domain')
TEMPLATE=$(echo "$STATE" | jq -r '.input.template')

# Re-check conditions independently
[ -d "/opt/sf-instances/${SLUG_VAL}" ] && \
  ERRORS+=("Instance directory appeared since run: /opt/sf-instances/${SLUG_VAL}")
[ ! -d "/opt/sf-template/src/templates/${TEMPLATE}" ] && \
  ERRORS+=("Template directory missing: ${TEMPLATE}")
[ ! -f "/opt/sf-template/.sf-version" ] && \
  ERRORS+=("Master template .sf-version missing")

# Confirm niche was resolved
BTYPE=$(echo "$STATE" | jq -r '.resolved.business_type')
STYPE=$(echo "$STATE" | jq -r '.resolved.schema_type')
[ -z "$STYPE" ] && ERRORS+=("schema_type not resolved in state file")

if [ ${#ERRORS[@]} -gt 0 ]; then
  mark_step_verify_failed "$SLUG" "01_validate" "$(printf '%s\n' "${ERRORS[@]}")"
  fail "Verification failed:"
  printf '  %s\n' "${ERRORS[@]}" >&2
  exit 1
fi

mark_step_verified "$SLUG" "01_validate"
ok "Step 01 verified"
info "No conflicts found for slug '$SLUG_VAL' or domain '$DOMAIN'"
info "Template '$TEMPLATE' is ready"
info "Schema type: $STYPE | Business type: $BTYPE"
