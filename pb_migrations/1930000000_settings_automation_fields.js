/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: settings_automation_fields
 *
 * Adds the Marketing Automation (n8n) config to the single `settings` row:
 *   - automation_webhook_url    — per-instance n8n master webhook (event sink)
 *   - automation_webhook_secret — HMAC key for outbound event signing (§5.1)
 *   - automation_enabled        — master on/off
 *   - automation_events         — per-event on/off toggles (json map)
 *   - automation_allowed_host   — SSRF allowlist host for outbound events
 *
 * These supersede the older `lead_webhook_url`/`lead_webhook_secret`, which are
 * kept for one release as a read fallback (mapped in getSettings()).
 */
migrate((app) => {
  const settings = app.findCollectionByNameOrId("settings");
  const has = (name) => settings.fields.some((f) => f.name === name);

  if (!has("automation_webhook_url")) {
    settings.fields.push(new Field({ id: "text_automation_webhook_url", type: "text", name: "automation_webhook_url" }));
  }
  if (!has("automation_webhook_secret")) {
    settings.fields.push(new Field({ id: "text_automation_webhook_secret", type: "text", name: "automation_webhook_secret" }));
  }
  if (!has("automation_enabled")) {
    settings.fields.push(new Field({ id: "bool_automation_enabled", type: "bool", name: "automation_enabled" }));
  }
  if (!has("automation_events")) {
    settings.fields.push(new Field({ id: "json_automation_events", type: "json", name: "automation_events" }));
  }
  if (!has("automation_allowed_host")) {
    settings.fields.push(new Field({ id: "text_automation_allowed_host", type: "text", name: "automation_allowed_host" }));
  }

  app.save(settings);
}, (app) => {
  const settings = app.findCollectionByNameOrId("settings");
  const dropped = [
    "automation_webhook_url", "automation_webhook_secret",
    "automation_enabled", "automation_events", "automation_allowed_host"
  ];
  settings.fields = settings.fields.filter((f) => !dropped.includes(f.name));
  app.save(settings);
});
