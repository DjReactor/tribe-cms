/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: create_activities
 *
 * Immutable events/transitions feed per contact. Every lifecycle and deal-stage
 * change writes a row here with meta:{old,new} + created — this is the source of
 * funnel conversion, velocity (time-in-stage, time-to-close), and speed-to-lead
 * analytics. `deals.stage` is current-state; `activities` is the history.
 *
 * Numbered after create_deals so the `deal` relation target exists.
 */
migrate((app) => {
  let existing = null;
  try { existing = app.findCollectionByNameOrId("activities"); } catch (_) { existing = null; }
  if (existing) return;

  const contactsId = app.findCollectionByNameOrId("contacts").id;
  const dealsId    = app.findCollectionByNameOrId("deals").id;

  const collection = new Collection({
    id: "pbc_activities",
    type: "base",
    name: "activities",
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      { type: "relation", name: "contact", required: true,  collectionId: contactsId, cascadeDelete: false, maxSelect: 1 },
      { type: "relation", name: "deal",    required: false, collectionId: dealsId,    cascadeDelete: false, maxSelect: 1 },
      { type: "select",   name: "type",    required: true,  maxSelect: 1,
        values: ["lifecycle_changed", "deal_stage_changed", "note", "enrolled", "form_submitted", "tag_added", "system"] },
      { type: "text",     name: "title" },
      { type: "text",     name: "detail" },
      { type: "json",     name: "meta" },
      { type: "text",     name: "actor" },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false }
    ],
    indexes: [
      "CREATE INDEX `idx_activities_contact` ON `activities` (`contact`)",
      "CREATE INDEX `idx_activities_deal`    ON `activities` (`deal`)",
      "CREATE INDEX `idx_activities_type`    ON `activities` (`type`)",
      "CREATE INDEX `idx_activities_created` ON `activities` (`created`)"
    ]
  });
  app.save(collection);
}, (app) => {
  let existing = null;
  try { existing = app.findCollectionByNameOrId("activities"); } catch (_) { existing = null; }
  if (existing) app.delete(existing);
});
