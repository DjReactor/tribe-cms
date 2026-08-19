/// <reference path="../pb_data/types.d.ts" />
// Retire the `types` catalog datatype.
//
// `types` was defined as "types of work/offerings", which is what `services`
// already is — and once services gained a 3-tier parent hierarchy (migration
// 2010000000) they categorise themselves, so the collection had no distinct
// job left. The other three catalog datatypes (brands / certifications /
// awards) are trust assets and stay exactly as they were.
//
// "Type" may come back later as an ATTRIBUTE on another datatype (roof type,
// system type, …). That would be a new field on an existing collection, not a
// revival of this standalone collection — do not resurrect this one for it.
migrate((app) => {
  // ── 1. Drop the collection (idempotent) ───────────────────────────────────
  try {
    const types = app.findCollectionByNameOrId("types");
    app.delete(types);
  } catch (_) {
    // Already gone, or never created on this instance.
  }

  // ── 2. Drop the master switch ─────────────────────────────────────────────
  try {
    const settings = app.findCollectionByNameOrId("settings");
    if (settings.fields.some(f => f.name === "types_enabled")) {
      settings.fields.removeByName("types_enabled");
      app.save(settings);
    }
  } catch (_) {
    // settings missing is not recoverable here and not this migration's job.
  }
}, (app) => {
  // ── Down: recreate the collection and the switch ──────────────────────────
  // Shape copied from 1990000000_create_catalog_collections.js. Records are
  // NOT restored — a down migration cannot resurrect deleted rows.
  let existing = null;
  try { existing = app.findCollectionByNameOrId("types"); } catch (_) { existing = null; }
  if (!existing) {
    app.save(new Collection({
      type: "base",
      name: "types",
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { type: "text", name: "name", required: true },
        { type: "text", name: "slug", required: true },
        { type: "text", name: "description" },
        { type: "json", name: "details", maxSize: 0 },
        { type: "text", name: "image_url" },
        { type: "bool", name: "is_active" },
        { type: "number", name: "sort_order" },
        { type: "text", name: "seo_title" },
        { type: "text", name: "seo_description" },
        { type: "bool", name: "noindex" },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
      ]
    }));
  }

  const settings = app.findCollectionByNameOrId("settings");
  if (!settings.fields.some(f => f.name === "types_enabled")) {
    settings.fields.push(new Field({
      "hidden": false,
      "id": "bool_types_enabled",
      "name": "types_enabled",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "bool"
    }));
    app.save(settings);
  }
});
