/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: create_event_outbox
 *
 * Durable outbound queue for CMS → n8n automation events (§4.6 / §5.1). The CMS
 * has no scheduler: dispatchEvent() enqueues a signed envelope here and attempts
 * immediate delivery; a per-instance PM2 drain worker retries failures with
 * exponential backoff. Delivery is at-least-once — consumers dedupe on the
 * envelope's idempotency_key (this row's id).
 *
 * Admin/server only — every access rule is left null (writes go through
 * getAdminPocketBase(), never the BO-facing API). Numbered 1870… so it applies
 * first among the automation/CRM migrations; it has no dependency on the others.
 */
migrate((app) => {
  let existing = null;
  try { existing = app.findCollectionByNameOrId("event_outbox"); } catch (_) { existing = null; }
  if (existing) return;

  const collection = new Collection({
    id: "pbc_event_outbox",
    type: "base",
    name: "event_outbox",
    // listRule/viewRule/createRule/updateRule/deleteRule omitted → null (superuser only)
    fields: [
      { type: "text",     name: "event",   required: true },          // e.g. "lead.created"
      { type: "json",     name: "payload", required: true },          // full envelope (§5.1)
      { type: "select",   name: "status",  required: true, maxSelect: 1,
        values: ["pending", "delivering", "delivered", "failed", "dead"] },
      { type: "number",   name: "attempts" },
      { type: "date",     name: "next_attempt_at" },
      { type: "text",     name: "last_error" },
      { type: "date",     name: "delivered_at" },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    indexes: [
      "CREATE INDEX `idx_outbox_status_due` ON `event_outbox` (`status`, `next_attempt_at`)"
    ]
  });
  app.save(collection);
}, (app) => {
  let existing = null;
  try { existing = app.findCollectionByNameOrId("event_outbox"); } catch (_) { existing = null; }
  if (existing) app.delete(existing);
});
