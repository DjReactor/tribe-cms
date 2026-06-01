#!/bin/bash
. /opt/sf-template/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"

STATE=$(read_state "$SLUG")
STATUS=$(echo "$STATE" | jq -r '.steps."18_notify".status')
[ "$STATUS" = "pending" ]  && exit_fail "Step not run yet"
[ "$STATUS" = "run_failed" ] && \
  { warn "Notification failed. You can re-run or mark as skipped if email was sent manually."
    exit_fail "Notification step failed. Re-run or skip."; }

# Notification verification is lightweight: we confirm the step ran without error
# Deep verification (did n8n actually send the email) is out of scope here
RAN_AT=$(echo "$STATE" | jq -r '.steps."18_notify".ran_at // ""')
[ -z "$RAN_AT" ] && exit_fail "No run timestamp found in state"

mark_step_verified "$SLUG" "18_notify"
BO_EMAIL=$(echo "$STATE" | jq -r '.input.bo_email')
ok "Notification step verified: n8n webhook fired at $RAN_AT"
info "Welcome email was triggered for $BO_EMAIL via n8n"
