/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: create_messages
 *
 * SMS/email communication log per contact (§4.2). Written by n8n via
 * /api/internal/crm/messages — the CMS never touches Twilio/SES, it only stores
 * the result. The UNIQUE external_id index is the idempotency guarantee:
 * provider webhooks fire more than once, so the POST route dedupes on it
 * (returns { deduped: true }).
 *
 * cascadeDelete:false on contact — deleting a contact must not destroy
 * communication history (retention/audit moat). Numbered after create_deals so
 * the timeline's collections cluster together; depends only on contacts.
 */
migrate((app) => {
  let existing = null;
  try { existing = app.findCollectionByNameOrId("messages"); } catch (_) { existing = null; }
  if (existing) return;

  const contactsId = app.findCollectionByNameOrId("contacts").id;

  const collection = new Collection({
    id: "pbc_messages",
    type: "base",
    name: "messages",
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      { type: "relation", name: "contact",   required: true, collectionId: contactsId, cascadeDelete: false, maxSelect: 1 },
      { type: "select",   name: "direction", required: true, maxSelect: 1, values: ["inbound", "outbound"] },
      { type: "select",   name: "channel",   required: true, maxSelect: 1, values: ["sms", "email"] },
      { type: "select",   name: "status",    required: true, maxSelect: 1,
        values: ["queued", "sent", "delivered", "failed", "received", "undelivered"] },
      { type: "text",     name: "subject" },
      { type: "text",     name: "body" },
      { type: "text",     name: "from_addr" },
      { type: "text",     name: "to_addr" },
      { type: "text",     name: "provider" },
      { type: "text",     name: "external_id", required: true },
      { type: "text",     name: "error" },
      { type: "json",     name: "meta" },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_messages_external_id` ON `messages` (`external_id`)",
      "CREATE INDEX `idx_messages_contact` ON `messages` (`contact`)",
      "CREATE INDEX `idx_messages_created` ON `messages` (`created`)"
    ]
  });
  app.save(collection);
}, (app) => {
  let existing = null;
  try { existing = app.findCollectionByNameOrId("messages"); } catch (_) { existing = null; }
  if (existing) app.delete(existing);
});
