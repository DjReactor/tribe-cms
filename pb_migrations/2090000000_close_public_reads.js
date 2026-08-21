/// <reference path="../pb_data/types.d.ts" />
// Four collections were readable by anyone who could reach the PocketBase API,
// and the settings singleton served its credentials along with everything else.
//
// Reachability today depends on the per-instance nginx vhost, which is generated
// on the droplet and is not in this repo, so this is not a claim that anything
// is currently exposed on the public internet. It is a claim that nothing but
// that vhost is stopping it, which is the wrong place for the boundary to live:
// the collection rules should be correct on their own.
//
// What changes, and why each is safe — every reader was checked before the rule
// was tightened, because a rule that outruns its callers is the recurring
// failure mode here (see the write-path rule in AGENTS.md):
//
//   contacts       CRM leads: name, email, phone, message, street address,
//   ai_call_logs   private notes; and full AI call records. Read by the
//                  dashboard through the cookie client (always authenticated)
//                  and by the API routes through the admin client. Nothing
//                  anonymous reads either. `deals` and `messages` already sit
//                  at exactly this rule and are read by the same dashboard
//                  screens, so this is the established pattern, not a new one.
//                  createRule stays null — the public contact form writes
//                  through the admin client.
//
//   redirects      Superuser-only rather than merely authenticated, because no
//   seo_404_log    Business-Owner surface shows either one. Callers, all
//                  checked: lib/redirects.ts, api/track-404 and
//                  api/internal/redirects use the admin client; the
//                  dashboard/seo reads use the cookie client but that segment
//                  is gated by requireAgencyPage(), and an agency admin is a
//                  PocketBase superuser, so they are unaffected. Those two are
//                  also exported server actions with no auth gate of their own,
//                  which means this rule closes a direct POST to them from an
//                  unauthenticated caller — previously that returned the whole
//                  redirect list. One caller did have to change: sitemap.ts
//                  filtered redirected URLs out of /sitemap.xml using the
//                  ordinary client on a public route, and its catch would have
//                  swallowed the new 403 and silently stopped filtering. It
//                  reads through the admin client now.
//
//   settings       Cannot be locked: the public site reads it anonymously via
//                  the cookie client on every render (lib/settings.ts), so a
//                  rule here would take the sites down. Instead the credential
//                  fields are marked `hidden`, which drops them from API
//                  responses for everyone except superusers. The app already
//                  strips this same list in code (AGENTS_ONLY_SETTINGS_KEYS in
//                  dashboard/settings/actions.ts); marking them hidden moves
//                  that from a convention somebody has to remember into
//                  something the database enforces. Both writers
//                  (agency/notifications-actions.ts) and the only reader that
//                  needs the plaintext (lib/automation.ts) use the admin
//                  client, so neither is affected.
//
//                  This also closes a latent leak: lib/settings.ts copies
//                  `lead_webhook_secret` and `automation_webhook_secret` into
//                  the TemplateSettings object handed to templates. No template
//                  is a client component today, so nothing is serialized into
//                  the HTML — but the comment saying "do not use in templates"
//                  was the only thing preventing it.
migrate((app) => {
  const setReadRules = (collectionName, rule) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId(collectionName);
    } catch (_) {
      return;   // collection absent on a bare instance
    }
    collection.listRule = rule;
    collection.viewRule = rule;
    app.save(collection);
  };

  const AUTHED = "@request.auth.id != ''";

  setReadRules("contacts", AUTHED);
  setReadRules("ai_call_logs", AUTHED);
  setReadRules("redirects", null);
  setReadRules("seo_404_log", null);

  // Credentials and shared secrets on the settings singleton. Kept in step with
  // AGENCY_ONLY_SETTINGS_KEYS plus the webhook secrets, which that list omits.
  const SECRET_SETTINGS_FIELDS = [
    "twilio_account_sid", "twilio_auth_token", "twilio_from_number",
    "telnyx_api_key", "telnyx_from_number",
    "postmark_server_token", "postmark_from_email",
    "n8n_api_key", "n8n_webhook_url",
    "lead_webhook_secret", "automation_webhook_secret",
    "blog_webhook_secret", "retell_webhook_secret", "reviews_webhook_secret",
  ];

  let settings;
  try {
    settings = app.findCollectionByNameOrId("settings");
  } catch (_) {
    return null;
  }

  for (const name of SECRET_SETTINGS_FIELDS) {
    const existing = settings.fields.find(f => f.name === name);
    if (!existing || existing.hidden) continue;
    existing.hidden = true;
  }
  app.save(settings);

  return null;
}, (app) => {
  const setReadRules = (collectionName, rule) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId(collectionName);
    } catch (_) {
      return;
    }
    collection.listRule = rule;
    collection.viewRule = rule;
    app.save(collection);
  };

  setReadRules("contacts", "");
  setReadRules("ai_call_logs", "");
  setReadRules("redirects", "");
  setReadRules("seo_404_log", "");

  const SECRET_SETTINGS_FIELDS = [
    "twilio_account_sid", "twilio_auth_token", "twilio_from_number",
    "telnyx_api_key", "telnyx_from_number",
    "postmark_server_token", "postmark_from_email",
    "n8n_api_key", "n8n_webhook_url",
    "lead_webhook_secret", "automation_webhook_secret",
    "blog_webhook_secret", "retell_webhook_secret", "reviews_webhook_secret",
  ];

  let settings;
  try {
    settings = app.findCollectionByNameOrId("settings");
  } catch (_) {
    return null;
  }

  for (const name of SECRET_SETTINGS_FIELDS) {
    const existing = settings.fields.find(f => f.name === name);
    if (!existing || !existing.hidden) continue;
    existing.hidden = false;
  }
  app.save(settings);

  return null;
});
