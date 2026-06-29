/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: create_lead_sources
 *
 * The UI-editable managed picklist backing `contacts.source` and `deals.source`
 * — a controlled vocabulary stored as DATA (rows added/edited/archived from the
 * dashboard) rather than a schema `select` (which would need a migration to
 * change). `is_active=false` archives a row (hidden from new dropdowns, history
 * still resolves); `needs_review=true` flags rows auto-created from an inbound
 * API miss.
 *
 * Seeds the two code-referenced rows: `website` (public contact-form default)
 * and `referral` (drives the referrer picker on deals).
 */
migrate((app) => {
  let existing = null;
  try { existing = app.findCollectionByNameOrId("lead_sources"); } catch (_) { existing = null; }
  if (existing) return;

  const collection = new Collection({
    id: "pbc_lead_sources",
    type: "base",
    name: "lead_sources",
    // BO/agency manage via dashboard; the admin API bypasses these rules.
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      { type: "text",     name: "slug",  required: true },
      { type: "text",     name: "label", required: true },
      { type: "bool",     name: "is_active" },
      { type: "bool",     name: "needs_review" },
      { type: "number",   name: "sort_order" },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_lead_sources_slug` ON `lead_sources` (`slug`)"
    ]
  });
  app.save(collection);

  // Seed the two code-referenced rows.
  const col = app.findCollectionByNameOrId("lead_sources");
  app.save(new Record(col, { slug: "website",  label: "Website",  is_active: true, needs_review: false, sort_order: 1 }));
  app.save(new Record(col, { slug: "referral", label: "Referral", is_active: true, needs_review: false, sort_order: 2 }));
}, (app) => {
  let existing = null;
  try { existing = app.findCollectionByNameOrId("lead_sources"); } catch (_) { existing = null; }
  if (existing) app.delete(existing);
});
