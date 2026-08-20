/// <reference path="../pb_data/types.d.ts" />
// Landing pages, schema layer — the service×area "pair".
//
// A pair is exactly one `service` + one `service_area`, and nothing else. That
// constraint is the whole design: Google's spam policy names "pages targeted at
// specific regions or cities" as doorway abuse, and thin-content actions have
// landed on sites with unique human-written copy purely on volume. So pairs are
// OPT-IN RECORDS, never a computed route — the page count equals what somebody
// actually wrote. A third relation would reintroduce the cartesian product this
// exists to prevent; if another axis is ever needed it belongs in page content,
// not in the key.
//
// Three changes here:
//
//   1. `service_areas.neighborhoods` -> `also_serving`. Areas nest 4 tiers now,
//      so tier 4 *is* the neighborhood tier and the old name misleads. The field
//      survives because it is the only way to name a place WITHOUT giving it a
//      page: page-worthy => an area record, name-worthy => a string.
//   2. `pairs` — the landing-page records themselves, at `/{area.slug}/{slug}`.
//   3. `settings.manual_checklist_items` — the agency-defined readiness items
//      that `pairs.manual_checklist` ticks off.
migrate((app) => {
  // ── 1. service_areas: neighborhoods -> also_serving ───────────────────────
  // Field renames do not persist in place in the JSVM (see tribe-cms/AGENTS.md),
  // so this is add + backfill + drop. That order rather than drop-first means an
  // interrupted run never destroys data: the worst case leaves both columns.
  const areas = app.findCollectionByNameOrId("service_areas");

  if (!areas.fields.some(f => f.name === "also_serving")) {
    areas.fields.push(new Field({
      "help": "Places named on this area's page but given no page of their own. Page-worthy => its own area record.",
      "hidden": false,
      "id": "json_service_areas_also_serving",
      "maxSize": 0,
      "name": "also_serving",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "json"
    }));
    app.save(areas);
  }

  // Copy across only where the destination is still empty, so a re-run after a
  // partial failure cannot clobber edits made in between.
  try {
    app.db()
      .newQuery("UPDATE service_areas SET also_serving = neighborhoods " +
                "WHERE (also_serving IS NULL OR also_serving = '' OR also_serving = 'null') " +
                "AND neighborhoods IS NOT NULL AND neighborhoods != '' AND neighborhoods != 'null'")
      .execute();
  } catch (_) { /* column absent on a fresh install */ }

  const areasAfterBackfill = app.findCollectionByNameOrId("service_areas");
  if (areasAfterBackfill.fields.some(f => f.name === "neighborhoods")) {
    areasAfterBackfill.fields.removeByName("neighborhoods");
    app.save(areasAfterBackfill);
  }

  // ── 2. pairs ──────────────────────────────────────────────────────────────
  const services = app.findCollectionByNameOrId("services");
  const serviceAreas = app.findCollectionByNameOrId("service_areas");

  // Unique on (service, service_area) is what makes "one page per pair"
  // structural rather than a validation rule somebody can forget to call.
  // Unique on (service_area, slug) is scoped to the area because the URL is —
  // the slug only has to be unique within its own first segment.
  const IDX_PAIR = "CREATE UNIQUE INDEX `idx_pairs_service_area_unique` ON `pairs` (`service`, `service_area`)";
  const IDX_SLUG = "CREATE UNIQUE INDEX `idx_pairs_area_slug_unique` ON `pairs` (`service_area`, `slug`)";

  let pairs = null;
  try { pairs = app.findCollectionByNameOrId("pairs"); } catch (_) { pairs = null; }

  if (!pairs) {
    pairs = new Collection({
      type: "base",
      name: "pairs",
      // Public read — these are public landing pages. Writes need an authed
      // session; the collection rule is the FLOOR, not the policy. Pairs are
      // agency-only, and that is enforced by requireAgencyAdmin() in the server
      // actions (see the dashboard role split in tribe-cms/AGENTS.md).
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        // cascadeDelete stays false on both: deleting a service or area must
        // leave the pair standing as a flagged record, not vanish silently.
        {
          type: "relation", name: "service", required: true,
          collectionId: services.id, maxSelect: 1, minSelect: 0, cascadeDelete: false
        },
        {
          type: "relation", name: "service_area", required: true,
          collectionId: serviceAreas.id, maxSelect: 1, minSelect: 0, cascadeDelete: false
        },
        // Second URL segment. Required because the slug is materialised at write
        // time (defaulting to the service slug) rather than resolved at render:
        // if blanks were allowed, two blank-slug pairs in one area would collide
        // on idx_pairs_area_slug_unique despite having different real URLs.
        { type: "text", name: "slug", required: true },
        { type: "text", name: "h1" },
        { type: "text", name: "intro" },
        { type: "json", name: "body", maxSize: 0 },      // BlockNote; empty => cannot publish
        { type: "text", name: "seo_title" },
        { type: "text", name: "seo_description" },
        { type: "bool", name: "noindex" },
        { type: "bool", name: "is_published" },
        // Set when the pair's service or area is deactivated/deleted; drives the
        // dashboard flag that offers the agency a delete.
        { type: "bool", name: "auto_unpublished" },
        { type: "json", name: "manual_checklist", maxSize: 0 },  // { [itemId]: boolean }
        { type: "number", name: "sort_order" },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
      ],
      // Safe to declare inline: a collection created here has no rows.
      indexes: [IDX_PAIR, IDX_SLUG]
    });
    app.save(pairs);
  } else {
    // Pre-existing collection (hand-created, or a re-run after a partial
    // failure) may already hold rows that violate the constraints. Log and skip
    // rather than crash the whole migration, matching 2010000000 / 2030000000.
    let changed = false;

    const guardedIndexes = [
      {
        name: "idx_pairs_service_area_unique",
        sql: IDX_PAIR,
        probe: "SELECT COUNT(*) AS n FROM (SELECT service, service_area FROM pairs GROUP BY service, service_area HAVING COUNT(*) > 1)"
      },
      {
        name: "idx_pairs_area_slug_unique",
        sql: IDX_SLUG,
        probe: "SELECT COUNT(*) AS n FROM (SELECT service_area, slug FROM pairs GROUP BY service_area, slug HAVING COUNT(*) > 1)"
      }
    ];

    for (const idx of guardedIndexes) {
      if (pairs.indexes.some(i => i.indexOf(idx.name) !== -1)) continue;

      let duplicates = 0;
      try {
        const row = new DynamicModel({ n: 0 });
        app.db().newQuery(idx.probe).one(row);
        duplicates = row.n;
      } catch (_) { /* table shape unexpected — fall through and try the index */ }

      if (duplicates > 0) {
        console.log(
          "[2040000000] SKIPPED " + idx.name + " — " + duplicates +
          " duplicate group(s) present in `pairs`. De-duplicate and re-run."
        );
      } else {
        pairs.indexes.push(idx.sql);
        changed = true;
      }
    }
    if (changed) app.save(pairs);
  }

  // ── 3. settings.manual_checklist_items ────────────────────────────────────
  // The agency-defined checklist: [{ id, label, description? }]. Only these
  // free-text items are data — predicated system checks stay in code.
  try {
    const settings = app.findCollectionByNameOrId("settings");
    if (!settings.fields.some(f => f.name === "manual_checklist_items")) {
      settings.fields.push(new Field({
        "help": "Agency-defined pair readiness items: [{ id, label, description? }]",
        "hidden": false,
        "id": "json_settings_manual_checklist_items",
        "maxSize": 0,
        "name": "manual_checklist_items",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      }));
      app.save(settings);
    }
  } catch (_) { /* settings may not exist in a bare instance */ }

  return null;
}, (app) => {
  // ── Down ──────────────────────────────────────────────────────────────────
  try {
    const settings = app.findCollectionByNameOrId("settings");
    if (settings.fields.some(f => f.name === "manual_checklist_items")) {
      settings.fields.removeByName("manual_checklist_items");
      app.save(settings);
    }
  } catch (_) { /* ignore */ }

  try { app.delete(app.findCollectionByNameOrId("pairs")); } catch (_) { /* already gone */ }

  // Restore neighborhoods, same add + backfill + drop shape as the up path.
  const areas = app.findCollectionByNameOrId("service_areas");
  if (!areas.fields.some(f => f.name === "neighborhoods")) {
    areas.fields.push(new Field({
      "help": "Sub-areas/neighborhoods served within this area (array of strings)",
      "hidden": false,
      "id": "json_service_areas_neighborhoods",
      "maxSize": 0,
      "name": "neighborhoods",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "json"
    }));
    app.save(areas);
  }

  try {
    app.db()
      .newQuery("UPDATE service_areas SET neighborhoods = also_serving " +
                "WHERE (neighborhoods IS NULL OR neighborhoods = '' OR neighborhoods = 'null') " +
                "AND also_serving IS NOT NULL AND also_serving != '' AND also_serving != 'null'")
      .execute();
  } catch (_) { /* ignore */ }

  const areasAfter = app.findCollectionByNameOrId("service_areas");
  if (areasAfter.fields.some(f => f.name === "also_serving")) {
    areasAfter.fields.removeByName("also_serving");
    app.save(areasAfter);
  }

  return null;
});
