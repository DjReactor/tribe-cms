/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: create_deals
 *
 * Revenue pipeline. Contacts are PEOPLE, deals are JOBS — one contact has many
 * deals over years (repeat/referral lifetime value). Pipeline state lives in the
 * DB-enforced `stage` select; immutable stage history is captured separately in
 * `activities`. `source` references the managed `lead_sources` picklist; when
 * source is "referral", `referred_by` links the referring contact.
 *
 * Every relation uses cascadeDelete:false — deleting a contact must NEVER
 * silently destroy deal/revenue history (retention/audit moat).
 *
 * Numbered after create_lead_sources so the `source` relation target exists.
 */
migrate((app) => {
  let existing = null;
  try { existing = app.findCollectionByNameOrId("deals"); } catch (_) { existing = null; }
  if (existing) return;

  const contactsId    = app.findCollectionByNameOrId("contacts").id;
  const leadSourcesId = app.findCollectionByNameOrId("lead_sources").id;
  const usersId       = app.findCollectionByNameOrId("users").id;

  const collection = new Collection({
    id: "pbc_deals",
    type: "base",
    name: "deals",
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      { type: "relation", name: "contact",        required: true,  collectionId: contactsId,    cascadeDelete: false, maxSelect: 1 },
      { type: "text",     name: "title" },
      { type: "select",   name: "stage",          required: true,  maxSelect: 1,
        values: ["new", "estimate_scheduled", "quoted", "won", "lost"] },
      { type: "number",   name: "estimate_value" },
      { type: "number",   name: "won_value" },
      { type: "relation", name: "source",         required: false, collectionId: leadSourcesId, cascadeDelete: false, maxSelect: 1 },
      { type: "relation", name: "referred_by",    required: false, collectionId: contactsId,    cascadeDelete: false, maxSelect: 1 },
      { type: "text",     name: "lost_reason" },
      { type: "date",     name: "expected_close" },
      { type: "date",     name: "closed_at" },
      { type: "relation", name: "assigned_to",    required: false, collectionId: usersId,       cascadeDelete: false, maxSelect: 1 },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    indexes: [
      "CREATE INDEX `idx_deals_contact`     ON `deals` (`contact`)",
      "CREATE INDEX `idx_deals_stage`       ON `deals` (`stage`)",
      "CREATE INDEX `idx_deals_source`      ON `deals` (`source`)",
      "CREATE INDEX `idx_deals_referred_by` ON `deals` (`referred_by`)",
      "CREATE INDEX `idx_deals_created`     ON `deals` (`created`)"
    ]
  });
  app.save(collection);
}, (app) => {
  let existing = null;
  try { existing = app.findCollectionByNameOrId("deals"); } catch (_) { existing = null; }
  if (existing) app.delete(existing);
});
