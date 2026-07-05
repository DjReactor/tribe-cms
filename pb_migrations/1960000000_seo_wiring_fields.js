/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: seo_wiring_fields
 *
 * Reconciles the SEO collections with what the dashboard UI and the public
 * site actually read/write (the 404 tracker and redirect manager shipped
 * unwired — see dashboard/seo):
 *
 *   - seo_settings: adds the form fields missing from the original snapshot
 *     (site_name, twitter_handle, verifications, custom_robots_rules, …).
 *   - redirects: adds the UI field names (from_path/to_path/type/note/
 *     hit_count). The legacy source/destination/permanent/hits fields are
 *     kept if present and backfilled into the new columns.
 *   - seo_404_log: adds hit_count/last_seen/resolved expected by the logs
 *     table; backfills hit_count from the legacy hits column.
 *
 * All additions are guarded so the migration is idempotent and safe against
 * instances whose live schema already drifted from the committed snapshot.
 */
migrate((app) => {
  const addMissing = (collection, fields) => {
    const has = (name) => collection.fields.some((f) => f.name === name);
    for (const spec of fields) {
      if (!has(spec.name)) {
        collection.fields.push(new Field({ id: `${spec.type}_${spec.name}`, ...spec }));
      }
    }
    app.save(collection);
  };

  const seoSettings = app.findCollectionByNameOrId("seo_settings");
  addMissing(seoSettings, [
    { type: "text", name: "schema_price_range" },
    { type: "text", name: "site_name" },
    { type: "text", name: "twitter_handle" },
    { type: "text", name: "google_verification" },
    { type: "text", name: "bing_verification" },
    { type: "text", name: "custom_robots_rules" },
    { type: "text", name: "default_og_image" },
  ]);

  const redirects = app.findCollectionByNameOrId("redirects");
  addMissing(redirects, [
    { type: "text", name: "from_path" },
    { type: "text", name: "to_path" },
    { type: "text", name: "type" },
    { type: "text", name: "note" },
    { type: "number", name: "hit_count" },
  ]);
  try {
    app.db().newQuery(
      "UPDATE redirects SET " +
      "from_path = COALESCE(NULLIF(from_path, ''), source), " +
      "to_path   = COALESCE(NULLIF(to_path, ''), destination), " +
      "type      = COALESCE(NULLIF(type, ''), CASE WHEN permanent THEN '301' ELSE '302' END), " +
      "hit_count = CASE WHEN hit_count > 0 THEN hit_count ELSE COALESCE(hits, 0) END"
    ).execute();
  } catch (_) { /* legacy columns absent — nothing to backfill */ }

  const log404 = app.findCollectionByNameOrId("seo_404_log");
  addMissing(log404, [
    { type: "number", name: "hit_count" },
    { type: "date", name: "last_seen" },
    { type: "bool", name: "resolved" },
  ]);
  try {
    app.db().newQuery(
      "UPDATE seo_404_log SET hit_count = CASE WHEN hit_count > 0 THEN hit_count ELSE COALESCE(hits, 0) END"
    ).execute();
  } catch (_) { /* legacy hits column absent */ }
}, (app) => {
  const drop = (name, fields) => {
    const collection = app.findCollectionByNameOrId(name);
    collection.fields = collection.fields.filter((f) => !fields.includes(f.name));
    app.save(collection);
  };
  drop("seo_settings", [
    "schema_price_range", "site_name", "twitter_handle",
    "google_verification", "bing_verification", "custom_robots_rules", "default_og_image",
  ]);
  drop("redirects", ["from_path", "to_path", "type", "note", "hit_count"]);
  drop("seo_404_log", ["hit_count", "last_seen", "resolved"]);
});
