/// <reference path="../pb_data/types.d.ts" />
// Catalog datatypes — Types, Brands, Certifications, Awards & Nominations.
// Four collections sharing one schema (image + name + description + BlockNote
// details + slug/SEO), each with its own settings master switch, mirroring the
// locations/projects pattern (public read, auth write, `*_enabled` gate).
const CATALOG_COLLECTIONS = ["types", "brands", "certifications", "awards"];

migrate((app) => {
  // ── 1. Create the four catalog collections (idempotent) ────────────────────
  for (const name of CATALOG_COLLECTIONS) {
    let existing = null;
    try { existing = app.findCollectionByNameOrId(name); } catch (_) { existing = null; }
    if (existing) continue;

    const collection = new Collection({
      type: "base",
      name,
      // Public read (public index/detail pages); writes require an authenticated BO.
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { type: "text", name: "name", required: true },
        { type: "text", name: "slug", required: true },
        { type: "text", name: "description" },
        { type: "json", name: "details", maxSize: 0 },   // BlockNote JSON (array of blocks)
        { type: "text", name: "image_url" },             // full URL from the media library
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

  // ── 2. Add the four feature flags to settings (idempotent) ─────────────────
  try {
    const settings = app.findCollectionByNameOrId("settings");
    let changed = false;
    for (const name of CATALOG_COLLECTIONS) {
      const flag = `${name}_enabled`;
      if (!settings.fields.some(f => f.name === flag)) {
        settings.fields.push(new Field({
          "hidden": false,
          "id": `bool_${flag}`,
          "name": flag,
          "presentable": false,
          "required": false,
          "system": false,
          "type": "bool"
        }));
        changed = true;
      }
    }
    if (changed) app.save(settings);
  } catch (_) { /* settings may not exist in some bare instances */ }

  return null;
}, (app) => {
  // Down: drop the settings flags, then the collections.
  try {
    const settings = app.findCollectionByNameOrId("settings");
    const flags = CATALOG_COLLECTIONS.map(n => `${n}_enabled`);
    settings.fields = settings.fields.filter(f => !flags.includes(f.name));
    app.save(settings);
  } catch (_) { /* ignore */ }

  for (const name of CATALOG_COLLECTIONS) {
    let existing = null;
    try { existing = app.findCollectionByNameOrId(name); } catch (_) { existing = null; }
    if (existing) app.delete(existing);
  }
  return null;
});
