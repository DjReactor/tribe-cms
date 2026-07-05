/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: seo_404_reset_unique
 *
 * The 0.4.1 404 logger wrote from the root not-found component, which Next.js
 * renders speculatively on every page request — so every row collected by it
 * is noise (200 responses counted as 404s, duplicate rows from double
 * renders). Tracking moved to a client beacon (/api/track-404).
 *
 *   - wipes all seo_404_log rows (nothing legitimate was ever collected;
 *     the feature was dead before 0.4.1 and mis-logging after)
 *   - adds a unique index on path so concurrent beacons can't create
 *     duplicate rows again
 */
migrate((app) => {
  try {
    app.db().newQuery("DELETE FROM seo_404_log").execute();
  } catch (_) { /* empty table */ }

  const coll = app.findCollectionByNameOrId("seo_404_log");
  const hasIdx = coll.indexes.some((i) => String(i).includes("idx_seo_404_log_path"));
  if (!hasIdx) {
    coll.indexes.push("CREATE UNIQUE INDEX `idx_seo_404_log_path` ON `seo_404_log` (`path`)");
    app.save(coll);
  }
}, (app) => {
  const coll = app.findCollectionByNameOrId("seo_404_log");
  coll.indexes = coll.indexes.filter((i) => !String(i).includes("idx_seo_404_log_path"));
  app.save(coll);
});
