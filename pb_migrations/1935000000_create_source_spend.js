/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: create_source_spend
 *
 * Manual monthly ad/lead-gen spend per channel (§4.8), entered by the BO/agency,
 * so analytics can compute cost-per-acquired-job and ROAS. One row per source per
 * month (unique source+period). Backfillable, so it lives in Phase 5 rather than
 * Phase 0.
 */
migrate((app) => {
  let existing = null;
  try { existing = app.findCollectionByNameOrId("source_spend"); } catch (_) { existing = null; }
  if (existing) return;

  const leadSourcesId = app.findCollectionByNameOrId("lead_sources").id;

  const collection = new Collection({
    id: "pbc_source_spend",
    type: "base",
    name: "source_spend",
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      { type: "relation", name: "source", required: true, collectionId: leadSourcesId, cascadeDelete: false, maxSelect: 1 },
      { type: "text",     name: "period", required: true },   // "YYYY-MM"
      { type: "number",   name: "amount", required: true },   // dollars spent that month
      { type: "text",     name: "notes" },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_source_spend_src_period` ON `source_spend` (`source`, `period`)"
    ]
  });
  app.save(collection);
}, (app) => {
  let existing = null;
  try { existing = app.findCollectionByNameOrId("source_spend"); } catch (_) { existing = null; }
  if (existing) app.delete(existing);
});
