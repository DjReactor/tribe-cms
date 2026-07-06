/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: consent_records
 *
 * SMS-consent capture + durable proof (Automation & CRM plan §12.3, TCPA
 * "prior express written consent").
 *
 * - `contacts` gains a denormalized gate: `sms_consent` (bool) +
 *   `sms_consent_at` (date) — checked by the lead-ack SMS send path.
 * - New `consent_records` collection: an APPEND-ONLY proof log. Every grant or
 *   revocation is a new row carrying the verbatim consent text shown, page URL,
 *   IP, and user agent. All access rules are null (superuser only — writes go
 *   through getAdminPocketBase()); there is deliberately no update path.
 * - `replay` file field ships EMPTY in v1 — reserved for consent-session
 *   evidence (rrweb events JSON or a TrustedForm cert) so attaching it later
 *   needs no migration (§12.3 session-replay decision).
 *
 * Retention: keep ≥ 5 years after last use — satisfied by the plan's
 * keep-indefinitely retention decision (§9).
 */
migrate((app) => {
  // ── contacts: denormalized consent gate ───────────────────────────────────
  const contacts = app.findCollectionByNameOrId("contacts");
  const has = (name) => contacts.fields.some((f) => f.name === name);
  if (!has("sms_consent")) {
    contacts.fields.push(new Field({ id: "bool_contacts_sms_consent", type: "bool", name: "sms_consent" }));
  }
  if (!has("sms_consent_at")) {
    contacts.fields.push(new Field({ id: "date_contacts_sms_consent_at", type: "date", name: "sms_consent_at" }));
  }
  app.save(contacts);

  // ── consent_records: append-only proof log ────────────────────────────────
  let existing = null;
  try { existing = app.findCollectionByNameOrId("consent_records"); } catch (_) { existing = null; }
  if (existing) return;

  const collection = new Collection({
    id: "pbc_consent_records",
    type: "base",
    name: "consent_records",
    // all rules omitted → null (superuser only); append-only by convention —
    // server code must never update or delete rows
    fields: [
      { type: "relation", name: "contact", required: true, collectionId: contacts.id, cascadeDelete: false, maxSelect: 1 },
      { type: "select",   name: "channel", required: true, maxSelect: 1, values: ["sms", "email"] },
      { type: "select",   name: "action",  required: true, maxSelect: 1, values: ["granted", "revoked"] },
      { type: "select",   name: "method",  required: true, maxSelect: 1, values: ["web_form", "provider_stop", "manual"] },
      { type: "text",     name: "consent_text" },   // exact language shown at capture time
      { type: "text",     name: "page_url" },
      { type: "text",     name: "ip" },
      { type: "text",     name: "user_agent" },
      { type: "file",     name: "replay", maxSelect: 1 }, // reserved — empty in v1 (§12.3)
      { type: "autodate", name: "created", onCreate: true, onUpdate: false }
    ],
    indexes: [
      "CREATE INDEX `idx_consent_contact` ON `consent_records` (`contact`)"
    ]
  });
  app.save(collection);
}, (app) => {
  let existing = null;
  try { existing = app.findCollectionByNameOrId("consent_records"); } catch (_) { existing = null; }
  if (existing) app.delete(existing);

  const contacts = app.findCollectionByNameOrId("contacts");
  ["sms_consent", "sms_consent_at"].forEach((n) => contacts.fields.removeByName(n));
  app.save(contacts);
});
