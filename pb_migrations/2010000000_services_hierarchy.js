/// <reference path="../pb_data/types.d.ts" />
// Service hierarchy — self-relation on `services` so a service can be the child
// of another service (e.g. Remodeling › Interior › Kitchen Remodeling).
//
// Design notes (see src/lib/services.ts for the runtime half):
//   * `parent` is a single, non-cascading relation back to `services`. Deleting
//     a parent leaves children as orphans rather than nuking a whole branch;
//     the tree builder promotes unresolvable parents to roots.
//   * Slugs are GLOBALLY unique, not unique-per-parent. Public URLs resolve on
//     the LAST path segment only, which is what lets a moved service keep
//     answering on its old URL (the route 301s to the recomputed canonical
//     path) with no redirect bookkeeping. A composite (parent, slug) index
//     could not do this, and would also silently allow duplicate top-level
//     slugs because SQLite treats NULLs as distinct in unique indexes.
//   * Depth is capped at 3 tiers in application code (MAX_SERVICE_DEPTH), not
//     here — changing the cap must never require a migration.
migrate((app) => {
  const services = app.findCollectionByNameOrId("services");

  // ── 1. parent relation (idempotent) ───────────────────────────────────────
  if (!services.fields.some(f => f.name === "parent")) {
    services.fields.push(new Field({
      "cascadeDelete": false,
      "collectionId": services.id,
      "help": "Parent service. Empty = top-level. Max 3 tiers deep.",
      "hidden": false,
      "id": "rel_services_parent",
      "maxSelect": 1,
      "minSelect": 0,
      "name": "parent",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "relation"
    }));
  }

  // ── 2. unique index on slug ───────────────────────────────────────────────
  // Nested-URL resolution keys off the last path segment, so a duplicate slug
  // would make a page unreachable. Refuse to create the index (rather than
  // crash the deploy mid-migration) if an instance already holds duplicates —
  // the operator fixes the data, re-runs, and gets the constraint.
  const INDEX = "CREATE UNIQUE INDEX `idx_services_slug_unique` ON `services` (`slug`)";
  if (!services.indexes.some(i => i.indexOf("idx_services_slug_unique") !== -1)) {
    let duplicates = [];
    try {
      const rows = arrayOf(new DynamicModel({ slug: "", n: 0 }));
      app.db()
        .newQuery("SELECT slug, COUNT(*) AS n FROM services GROUP BY slug HAVING n > 1")
        .all(rows);
      duplicates = rows.map(r => r.slug);
    } catch (_) {
      // Fresh install: the table may not be queryable yet — nothing to collide.
    }

    if (duplicates.length > 0) {
      console.log(
        "[2010000000] SKIPPED unique index on services.slug — duplicate slugs present: " +
        duplicates.join(", ") + ". De-duplicate them and re-run this migration."
      );
    } else {
      services.indexes.push(INDEX);
    }
  }

  app.save(services);

  // ── 3. settings.services_display_mode ─────────────────────────────────────
  // auto = nest where children exist, flat elsewhere. flat/tree force it.
  const settings = app.findCollectionByNameOrId("settings");
  if (!settings.fields.some(f => f.name === "services_display_mode")) {
    settings.fields.push(new Field({
      "help": "How the services index renders: auto | flat | tree",
      "hidden": false,
      "id": "text_services_display_mode",
      "max": 0,
      "min": 0,
      "name": "services_display_mode",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }));
    app.save(settings);
  }
}, (app) => {
  // ── Down ──────────────────────────────────────────────────────────────────
  const services = app.findCollectionByNameOrId("services");
  services.fields = services.fields.filter(f => f.name !== "parent");
  services.indexes = services.indexes.filter(i => i.indexOf("idx_services_slug_unique") === -1);
  app.save(services);

  const settings = app.findCollectionByNameOrId("settings");
  settings.fields = settings.fields.filter(f => f.name !== "services_display_mode");
  app.save(settings);
});
