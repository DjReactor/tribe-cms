/// <reference path="../pb_data/types.d.ts" />
// Make the vestigial `redirects.source` / `.destination` columns optional.
//
// Migration 1960000000 moved the meaning of this collection onto `from_path` /
// `to_path` and backfilled both out of `source` / `destination` — but it left
// the originals in place and still flagged `required: true`. Nothing has
// written them since, so EVERY redirect row created by the app has failed
// validation with "source: Cannot be blank":
//
//   - the manual redirects UI (dashboard/seo → createRedirect) reported
//     "Creation failed" for every rule anybody tried to add;
//   - the automatic rule written when a service slug changes failed silently,
//     because that call site treats a missing redirect as non-fatal and
//     swallows the error.
//
// The columns are not dropped. They hold the pre-1960000000 values, dropping is
// destructive and irreversible, and the committed snapshot is known not to
// reproduce every instance's schema exactly. Making them optional is the whole
// fix and it costs nothing to carry them.
migrate((app) => {
  const redirects = app.findCollectionByNameOrId("redirects");
  let changed = false;

  for (const name of ["source", "destination"]) {
    const field = redirects.fields.find((f) => f.name === name);
    if (field && field.required) {
      field.required = false;
      changed = true;
    }
  }

  if (changed) app.save(redirects);
  return null;
}, (app) => {
  // ── Down ──────────────────────────────────────────────────────────────────
  // Only restorable while every row still has values in both columns. Any rule
  // created after the up path ran has them blank, and marking a field required
  // underneath blank rows leaves records that cannot be saved again.
  const redirects = app.findCollectionByNameOrId("redirects");

  let blanks = 0;
  try {
    const row = new DynamicModel({ n: 0 });
    app.db()
      .newQuery("SELECT COUNT(*) AS n FROM redirects WHERE " +
                "source IS NULL OR source = '' OR destination IS NULL OR destination = ''")
      .one(row);
    blanks = row.n;
  } catch (_) { /* columns absent — nothing to restore */ }

  if (blanks > 0) {
    console.log(
      "[2050000000] SKIPPED restoring required on redirects.source/destination — " +
      blanks + " row(s) have them blank. Backfill them first if you really want this."
    );
    return null;
  }

  let changed = false;
  for (const name of ["source", "destination"]) {
    const field = redirects.fields.find((f) => f.name === name);
    if (field && !field.required) {
      field.required = true;
      changed = true;
    }
  }
  if (changed) app.save(redirects);
  return null;
});
