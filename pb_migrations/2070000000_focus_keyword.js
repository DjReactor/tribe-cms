/// <reference path="../pb_data/types.d.ts" />
// `focus_keyword` on `service_areas` and `blog_posts`.
//
// Same class as `2060000000`: both forms show a "Focus Keyword" input, both
// server actions include it in their zod schema and write it, and no committed
// migration ever created either column — so PocketBase drops the value on write
// and returns undefined on read. Type a keyword, save, reload, it is gone, with
// no error anywhere.
//
// Adding the column is the smaller of the two honest fixes (the other being to
// delete the inputs). It costs nothing, and it means the field the agency can
// see now keeps what they put in it.
//
// NOTE for whoever picks this up next: nothing *reads* `focus_keyword` yet —
// there is no scoring against it in the SEO suite. Persisting it is strictly
// better than discarding it, but the input still promises more than the product
// currently delivers. Either wire it into SEO scoring or drop both inputs.
migrate((app) => {
  const addFocusKeyword = (collectionName) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId(collectionName);
    } catch (_) {
      return;   // collection absent on a bare instance — nothing to add to
    }
    if (collection.fields.some(f => f.name === "focus_keyword")) return;

    collection.fields.push(new Field({
      "autogeneratePattern": "",
      "help": "Primary keyword this page targets.",
      "hidden": false,
      "id": "text_" + collectionName + "_focus_keyword",
      "max": 0,
      "min": 0,
      "name": "focus_keyword",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }));
    app.save(collection);
  };

  addFocusKeyword("service_areas");
  addFocusKeyword("blog_posts");

  return null;
}, (app) => {
  const dropFocusKeyword = (collectionName) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId(collectionName);
    } catch (_) {
      return;
    }
    if (!collection.fields.some(f => f.name === "focus_keyword")) return;
    collection.fields.removeByName("focus_keyword");
    app.save(collection);
  };

  dropFocusKeyword("service_areas");
  dropFocusKeyword("blog_posts");

  return null;
});
