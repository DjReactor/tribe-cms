/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: settings_lead_notifications
 *
 * CMS-native lead notifications (Automation & CRM plan §12) + outbound envelope
 * extensions (§12.8).
 *
 * Adds to the single `settings` row:
 *   - 4 independent toggles (owner/lead × sms/email) — all default off
 *   - owner destinations (email list, E.164 phone)
 *   - SMS provider picker (twilio | telnyx) + provider credentials (Twilio,
 *     Telnyx, Postmark)
 *   - optional template overrides (code defaults apply when blank — §12.6)
 *   - §12.8: `automation_custom_headers` (receiver-required headers for the
 *     webhook lane) and `automation_context` (per-instance payload context)
 *
 * IMPORTANT: none of these fields are mapped into getSettings()/TemplateSettings
 * or the BO settings form — they are agency-admin-only, read server-side via
 * getNotificationConfig() (§12.2).
 *
 * Also adds `kind` to `event_outbox` (§12.4): "webhook" rows deliver to the n8n
 * URL; "notification" rows deliver through the provider adapters in
 * src/lib/notifications.ts. Blank/missing kind is treated as "webhook" for
 * pre-existing rows.
 */
migrate((app) => {
  // ── settings fields ───────────────────────────────────────────────────────
  const settings = app.findCollectionByNameOrId("settings");
  const has = (name) => settings.fields.some((f) => f.name === name);

  const textFields = [
    "notify_owner_email_to",
    "notify_owner_sms_to",
    "twilio_account_sid",
    "twilio_auth_token",
    "twilio_from_number",
    "telnyx_api_key",
    "telnyx_from_number",
    "postmark_server_token",
    "postmark_from_email",
    "lead_ack_email_subject",
    "lead_ack_email_body",
    "lead_ack_sms_body",
    "sms_consent_text",
  ];
  const boolFields = [
    "notify_owner_email_enabled",
    "notify_owner_sms_enabled",
    "lead_ack_email_enabled",
    "lead_ack_sms_enabled",
  ];

  for (const name of boolFields) {
    if (!has(name)) settings.fields.push(new Field({ id: `bool_${name}`, type: "bool", name }));
  }
  for (const name of textFields) {
    if (!has(name)) settings.fields.push(new Field({ id: `text_${name}`, type: "text", name }));
  }
  if (!has("sms_provider")) {
    settings.fields.push(new Field({
      id: "select_sms_provider", type: "select", name: "sms_provider",
      required: false, maxSelect: 1, values: ["twilio", "telnyx"]
    }));
  }
  if (!has("automation_custom_headers")) {
    settings.fields.push(new Field({ id: "json_automation_custom_headers", type: "json", name: "automation_custom_headers" }));
  }
  if (!has("automation_context")) {
    settings.fields.push(new Field({ id: "json_automation_context", type: "json", name: "automation_context" }));
  }
  app.save(settings);

  // ── event_outbox.kind ─────────────────────────────────────────────────────
  const outbox = app.findCollectionByNameOrId("event_outbox");
  if (!outbox.fields.some((f) => f.name === "kind")) {
    outbox.fields.push(new Field({
      id: "select_outbox_kind", type: "select", name: "kind",
      required: false, maxSelect: 1, values: ["webhook", "notification"]
    }));
    app.save(outbox);
  }

  // ── activities.type: add "owner_notified" (§12.4 timeline logging) ────────
  // Mutate the live select's values in place — in-place select-value extension
  // persists (unlike renames); verified on a scratch PB.
  const activities = app.findCollectionByNameOrId("activities");
  const typeField = activities.fields.getByName("type");
  if (typeField && typeField.values && !typeField.values.includes("owner_notified")) {
    typeField.values.push("owner_notified");
    app.save(activities);
  }
}, (app) => {
  const settings = app.findCollectionByNameOrId("settings");
  const dropped = [
    "notify_owner_email_enabled", "notify_owner_sms_enabled",
    "lead_ack_email_enabled", "lead_ack_sms_enabled",
    "notify_owner_email_to", "notify_owner_sms_to",
    "sms_provider",
    "twilio_account_sid", "twilio_auth_token", "twilio_from_number",
    "telnyx_api_key", "telnyx_from_number",
    "postmark_server_token", "postmark_from_email",
    "lead_ack_email_subject", "lead_ack_email_body", "lead_ack_sms_body",
    "sms_consent_text",
    "automation_custom_headers", "automation_context",
  ];
  for (const name of dropped) settings.fields.removeByName(name);
  app.save(settings);

  const outbox = app.findCollectionByNameOrId("event_outbox");
  if (outbox.fields.some((f) => f.name === "kind")) {
    outbox.fields.removeByName("kind");
    app.save(outbox);
  }

  const activities = app.findCollectionByNameOrId("activities");
  const typeField = activities.fields.getByName("type");
  if (typeField && typeField.values && typeField.values.includes("owner_notified")) {
    typeField.values = typeField.values.filter((v) => v !== "owner_notified");
    app.save(activities);
  }
});
