/// <reference path="../pb_data/types.d.ts" />
// Three related schema changes for the service-area / landing-page work:
//
//   1. `states` — a small picklist datatype (full name + code). NOT a substitute
//      for a service area: it exists wherever a state's name or abbreviation is
//      needed as an attribute, and the template decides which form to render.
//   2. `service_areas.parent` — a self-relation, exactly like `services.parent`,
//      so areas nest State > County > City > Neighborhood. Depth is capped at 4
//      in application code (MAX_AREA_DEPTH), never here. Area URLs stay FLAT
//      (`/santa-rosa`), which is what keeps combo landing pages at exactly two
//      segments regardless of how deep the geography goes.
//   3. `projects` swaps its free-text location for real relations: a
//      `service_area` (which is what auto-pull matches on), a `state`, and a
//      free-text `neighborhood` for granularity below the area tree.
migrate((app) => {
  // ── 1. states ─────────────────────────────────────────────────────────────
  let states = null;
  try { states = app.findCollectionByNameOrId("states"); } catch (_) { states = null; }
  if (!states) {
    states = new Collection({
      type: "base",
      name: "states",
      // Public read (templates render the name/code); writes need an authed BO.
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { type: "text", name: "name", required: true },   // "California"
        { type: "text", name: "code", required: true },   // "CA"
        { type: "bool", name: "is_active" },
        { type: "number", name: "sort_order" },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
      ]
    });
    app.save(states);
    states = app.findCollectionByNameOrId("states");
  }

  // ── 2. service_areas.parent + .state ──────────────────────────────────────
  const areas = app.findCollectionByNameOrId("service_areas");
  let areasChanged = false;

  if (!areas.fields.some(f => f.name === "parent")) {
    areas.fields.push(new Field({
      "cascadeDelete": false,
      "collectionId": areas.id,
      "help": "Parent area. Empty = top level. Max 4 tiers (state/county/city/neighborhood).",
      "hidden": false,
      "id": "rel_areas_parent",
      "maxSelect": 1,
      "minSelect": 0,
      "name": "parent",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "relation"
    }));
    areasChanged = true;
  }

  if (!areas.fields.some(f => f.name === "state")) {
    areas.fields.push(new Field({
      "cascadeDelete": false,
      "collectionId": states.id,
      "help": "State this area sits in — powers 'Santa Rosa, CA' and region schema.",
      "hidden": false,
      "id": "rel_areas_state",
      "maxSelect": 1,
      "minSelect": 0,
      "name": "state",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "relation"
    }));
    areasChanged = true;
  }

  // Area slugs are the site's root namespace, so they must be unique.
  const AREA_INDEX = "CREATE UNIQUE INDEX `idx_service_areas_slug_unique` ON `service_areas` (`slug`)";
  if (!areas.indexes.some(i => i.indexOf("idx_service_areas_slug_unique") !== -1)) {
    let duplicates = [];
    try {
      const rows = arrayOf(new DynamicModel({ slug: "", n: 0 }));
      app.db()
        .newQuery("SELECT slug, COUNT(*) AS n FROM service_areas GROUP BY slug HAVING n > 1")
        .all(rows);
      duplicates = rows.map(r => r.slug);
    } catch (_) { /* fresh install */ }

    if (duplicates.length > 0) {
      console.log(
        "[2030000000] SKIPPED unique index on service_areas.slug — duplicates present: " +
        duplicates.join(", ") + ". De-duplicate and re-run."
      );
    } else {
      areas.indexes.push(AREA_INDEX);
      areasChanged = true;
    }
  }
  if (areasChanged) app.save(areas);

  // ── 3. projects: relations in, free-text location out ─────────────────────
  const projects = app.findCollectionByNameOrId("projects");

  if (!projects.fields.some(f => f.name === "service_area")) {
    projects.fields.push(new Field({
      "cascadeDelete": false,
      "collectionId": areas.id,
      "help": "Which service area this project was done in — auto-pull matches on this.",
      "hidden": false,
      "id": "rel_projects_service_area",
      "maxSelect": 1,
      "minSelect": 0,
      "name": "service_area",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "relation"
    }));
  }

  if (!projects.fields.some(f => f.name === "state")) {
    projects.fields.push(new Field({
      "cascadeDelete": false,
      "collectionId": states.id,
      "help": "State — for businesses working across adjacent states.",
      "hidden": false,
      "id": "rel_projects_state",
      "maxSelect": 1,
      "minSelect": 0,
      "name": "state",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "relation"
    }));
  }

  if (!projects.fields.some(f => f.name === "neighborhood")) {
    projects.fields.push(new Field({
      "autogeneratePattern": "",
      "help": "Finer than the area tree — e.g. 'Tribeca' when the area is Manhattan.",
      "hidden": false,
      "id": "text_projects_neighborhood",
      "max": 0,
      "min": 0,
      "name": "neighborhood",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }));
  }
  app.save(projects);

  // Backfill: the old free-text city is the best available guess at a
  // neighborhood label. The service_area relation is deliberately NOT guessed —
  // matching a city string to an area record is exactly the kind of silent
  // mis-association that is worse than an empty field.
  try {
    app.db()
      .newQuery("UPDATE projects SET neighborhood = location_city " +
                "WHERE (neighborhood IS NULL OR neighborhood = '') " +
                "AND location_city IS NOT NULL AND location_city != ''")
      .execute();
  } catch (_) { /* columns may not exist on a fresh install */ }

  // Retire the free-text columns now that relations carry the meaning.
  const projects2 = app.findCollectionByNameOrId("projects");
  let dropped = false;
  for (const name of ["location_city", "location_state"]) {
    if (projects2.fields.some(f => f.name === name)) {
      projects2.fields.removeByName(name);
      dropped = true;
    }
  }
  if (dropped) app.save(projects2);
}, (app) => {
  // ── Down ──────────────────────────────────────────────────────────────────
  const projects = app.findCollectionByNameOrId("projects");
  for (const name of ["service_area", "state", "neighborhood"]) {
    if (projects.fields.some(f => f.name === name)) projects.fields.removeByName(name);
  }
  for (const name of ["location_city", "location_state"]) {
    if (!projects.fields.some(f => f.name === name)) {
      projects.fields.push(new Field({
        "autogeneratePattern": "", "help": "", "hidden": false,
        "id": `text_projects_${name}`, "max": 0, "min": 0, "name": name,
        "pattern": "", "presentable": false, "primaryKey": false,
        "required": false, "system": false, "type": "text"
      }));
    }
  }
  app.save(projects);

  const areas = app.findCollectionByNameOrId("service_areas");
  for (const name of ["parent", "state"]) {
    if (areas.fields.some(f => f.name === name)) areas.fields.removeByName(name);
  }
  areas.indexes = areas.indexes.filter(i => i.indexOf("idx_service_areas_slug_unique") === -1);
  app.save(areas);

  try { app.delete(app.findCollectionByNameOrId("states")); } catch (_) { /* already gone */ }
});
