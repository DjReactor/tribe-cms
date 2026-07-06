/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: business_hours_24h
 *
 * The Business Hours editor (dashboard/business-info) stores times as canonical
 * 24-hour "HH:MM" so they are valid schema.org OpeningHoursSpecification
 * opens/closes (Google/Bing/calendar tooling reject the old "08:00 am" display
 * strings and drop the opening-hours block).
 *
 * This backfills existing business_info.hours records from 12-hour display
 * strings to 24-hour, and adds the `open24` flag (defaulting false). The
 * `hours` field is json (no schema change) — this is data-only.
 *
 * Idempotent: already-24h values pass through unchanged, and re-running only
 * re-normalizes.
 */
function to24(value) {
  const raw = String(value == null ? "" : value).trim().toLowerCase();
  if (!raw) return "";
  const iso = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (iso) {
    const h = Math.min(23, parseInt(iso[1], 10));
    return (h < 10 ? "0" + h : "" + h) + ":" + iso[2];
  }
  const ampm = raw.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (!ampm) return "";
  let h = parseInt(ampm[1], 10) % 12;
  if (ampm[3] === "pm") h += 12;
  return (h < 10 ? "0" + h : "" + h) + ":" + ampm[2];
}

migrate((app) => {
  let recs = [];
  try { recs = app.findAllRecords("business_info"); } catch (_) { recs = []; }

  for (const r of recs) {
    if (!r) continue;
    try {
      let hours = r.get("hours");
      if (hours && typeof hours.string === "function") hours = hours.string(); // JsonRaw
      if (typeof hours === "string") hours = JSON.parse(hours || "[]");
      if (!Array.isArray(hours) || hours.length === 0) continue;

      const converted = hours.map((h) => ({
        day: h.day,
        enabled: !!h.enabled,
        open: to24(h.open),
        close: to24(h.close),
        open24: !!h.open24,
      }));

      r.set("hours", converted);
      app.save(r);
    } catch (_) { /* skip a bad row rather than abort the migration */ }
  }
}, (app) => {
  // Down: no-op — 24-hour times are a strict superset of the legacy format and
  // re-deriving am/pm display strings would be lossy, so values are left in place.
});
