/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: backfill_lifecycle_status  (Phase 6 closeout)
 *
 * One-time backfill mapping the legacy free-text contacts.status onto the new
 * lifecycle_status select for rows created before Phase 0 (which lack it).
 * Idempotent — only sets lifecycle_status where it is currently empty.
 *
 * Deliberately NOT done here (each would corrupt the Phase 5 analytics):
 *   - created/updated → now(): historical rows must keep EMPTY timestamps so
 *     they're excluded from cohort / speed-to-lead metrics rather than all
 *     bucketed into the migration month (the views guard on `created != ''`);
 *   - synthetic initial deals from converted contacts: no value data — would
 *     skew win-rate and avg-job-value;
 *   - dropping source_text_legacy: irreversible and harmless to keep.
 */
migrate((app) => {
  const map = (status) => {
    const s = (status || "").trim().toLowerCase();
    if (s === "converted") return "customer";
    if (s === "closed") return "inactive";
    return "lead"; // new, contacted, qualified, blank, or anything else
  };

  let recs = [];
  try { recs = app.findAllRecords("contacts"); } catch (_) { recs = []; }
  for (const r of recs) {
    if (!r) continue;
    try {
      if (!r.getString("lifecycle_status")) {
        r.set("lifecycle_status", map(r.getString("status")));
        app.save(r);
      }
    } catch (_) { /* skip a bad row rather than abort the migration */ }
  }
}, (app) => {
  // Down: no-op — a backfilled lifecycle_status can't be told apart from an
  // authored one, so leaving the values in place is the safe reversal.
});
