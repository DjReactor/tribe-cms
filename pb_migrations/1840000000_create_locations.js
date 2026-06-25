/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // ── 1. Create the `locations` collection (idempotent) ──────────────────────
  // Repeatable physical business locations (area name + address + phone).
  // Distinct from `business_info` (single HQ) and `service_areas` (SEO pages).
  let existing = null;
  try { existing = app.findCollectionByNameOrId("locations"); } catch (_) { existing = null; }
  if (!existing) {
    const collection = new Collection({
      type: "base",
      name: "locations",
      // Public read (public /locations pages); writes require an authenticated BO.
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { type: "text", name: "area_name", required: true },
        { type: "text", name: "slug", required: true },
        { type: "text", name: "address" },
        { type: "text", name: "phone" },
        { type: "bool", name: "is_active" },
        { type: "number", name: "sort_order" },
        { type: "text", name: "seo_title" },
        { type: "text", name: "seo_description" },
        { type: "bool", name: "noindex" },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
      ]
    });
    app.save(collection);
  }

  // ── 2. Add the `locations_enabled` feature flag to settings (idempotent) ───
  try {
    const settings = app.findCollectionByNameOrId("settings");
    if (!settings.fields.some(f => f.name === "locations_enabled")) {
      settings.fields.push(new Field({
        "hidden": false,
        "id": "bool_locations_enabled",
        "name": "locations_enabled",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      }));
      app.save(settings);
    }
  } catch (_) { /* settings may not exist in some bare instances */ }

  return null;
}, (app) => {
  // Down: drop the settings flag, then the collection.
  try {
    const settings = app.findCollectionByNameOrId("settings");
    settings.fields = settings.fields.filter(f => f.name !== "locations_enabled");
    app.save(settings);
  } catch (_) { /* ignore */ }

  let existing = null;
  try { existing = app.findCollectionByNameOrId("locations"); } catch (_) { existing = null; }
  if (existing) app.delete(existing);
  return null;
});
