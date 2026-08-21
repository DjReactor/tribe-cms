/// <reference path="../pb_data/types.d.ts" />
// Columns the app reads and writes that no committed migration ever created.
//
// Found by a per-collection audit rather than by tripping over them one at a
// time: every collection's committed field list was diffed against the field
// names the app actually uses (zod form schemas, write payloads, TS record
// types, filter/sort clauses). `2060000000` and `2070000000` closed the same
// class of gap; these are the ones that sweep missed because it matched field
// names globally instead of per collection.
//
//   business_info.state    Collected by the Business Info form and emitted into
//   business_info.zip      LocalBusiness JSON-LD as `addressRegion` and
//                          `postalCode` (see lib/seo.ts). Without the columns
//                          both keys are always the empty string, so every
//                          site ships structured data with no region and no
//                          postal code — the two fields local search leans on
//                          hardest.
//
//   blog_posts.noindex     The Blog form shows both, the server action writes
//   blog_posts.canonical_url  both, and the public post route reads both
//                          (`post.noindex`, `post.canonical_url`). Absent the
//                          columns, the per-post noindex switch does nothing in
//                          the page metadata AND nothing in the sitemap, which
//                          keeps listing the post; the per-post canonical URL
//                          silently always falls back to the default.
//
//   blog_posts.created     Every other collection the sitemap reads for
//   blog_posts.updated     `lastModified` has them; blog_posts alone does not,
//                          so the route falls back to `post.published_at`. When
//                          that is empty — a post published by editing the
//                          record directly rather than through the dashboard —
//                          `new Date(undefined)` is an Invalid Date and
//                          serializing the sitemap throws, taking out
//                          /sitemap.xml entirely rather than one entry.
//
// Additive and guarded throughout: an instance that already grew a column by
// hand keeps its data untouched.
migrate((app) => {
  const addField = (collectionName, definition) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId(collectionName);
    } catch (_) {
      return;   // collection absent on a bare instance — nothing to add to
    }
    if (collection.fields.some(f => f.name === definition.name)) return;
    collection.fields.push(new Field(definition));
    app.save(collection);
  };

  const text = (collectionName, name, help) => addField(collectionName, {
    "autogeneratePattern": "",
    "help": help,
    "hidden": false,
    "id": "text_" + collectionName + "_" + name,
    "max": 0,
    "min": 0,
    "name": name,
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  });

  // Text, not a `select` of state codes: the form is a free-text input and the
  // value goes verbatim into JSON-LD, where "CA" and "California" are both
  // legal. Constraining it here would reject data the form still accepts.
  text("business_info", "state", "State or region, for LocalBusiness addressRegion.");
  text("business_info", "zip", "Postal code, for LocalBusiness postalCode.");

  // Plain text rather than a url-typed field: the zod schema already allows the
  // empty string for "no override", and a url-typed PocketBase field rejects it.
  text("blog_posts", "canonical_url", "Canonical URL override for this post.");

  addField("blog_posts", {
    "help": "Keep this post out of search results and the sitemap.",
    "hidden": false,
    "id": "bool_blog_posts_noindex",
    "name": "noindex",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  });

  // `created`/`updated` for the three collections whose TS record type and the
  // template creator guide both promise them ("PocketBase auto-populated") and
  // that never had the columns. A template author reading `area.updated` got
  // undefined; blog_posts additionally breaks the sitemap, per the note above.
  const timestamps = (collectionName) => {
    addField(collectionName, {
      "hidden": false,
      "id": "autodate_" + collectionName + "_created",
      "name": "created",
      "onCreate": true,
      "onUpdate": false,
      "presentable": false,
      "system": false,
      "type": "autodate"
    });
    addField(collectionName, {
      "hidden": false,
      "id": "autodate_" + collectionName + "_updated",
      "name": "updated",
      "onCreate": true,
      "onUpdate": true,
      "presentable": false,
      "system": false,
      "type": "autodate"
    });
  };

  timestamps("blog_posts");
  timestamps("services");
  timestamps("service_areas");

  return null;
}, (app) => {
  // Drops only fields carrying the id this migration assigns, so `down` can
  // only ever remove what `up` added. Matching on name alone would be
  // destructive here: an instance that already had `created`/`updated` (the
  // PocketBase Admin UI adds them to any collection made through the UI, which
  // is how much of the live schema was built) keeps them under PocketBase's own
  // shared id, and a name-matched drop would delete timestamps that predate
  // this work. `up` skips those instances; `down` has to skip them too.
  const dropField = (collectionName, fieldName, expectedId) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId(collectionName);
    } catch (_) {
      return;
    }
    const field = collection.fields.find(f => f.name === fieldName);
    if (!field || field.id !== expectedId) return;
    collection.fields.removeByName(fieldName);
    app.save(collection);
  };

  dropField("business_info", "state", "text_business_info_state");
  dropField("business_info", "zip", "text_business_info_zip");
  dropField("blog_posts", "canonical_url", "text_blog_posts_canonical_url");
  dropField("blog_posts", "noindex", "bool_blog_posts_noindex");

  for (const name of ["blog_posts", "services", "service_areas"]) {
    dropField(name, "created", "autodate_" + name + "_created");
    dropField(name, "updated", "autodate_" + name + "_updated");
  }

  return null;
});
