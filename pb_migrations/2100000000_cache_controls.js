/// <reference path="../pb_data/types.d.ts" />
// Agency-controlled ISR cache settings.
//
// The public site is cached (see the rendering contract in AGENTS.md). Three
// things can refresh a cached page: a BO content save (the dashboard actions
// call revalidatePath), the framework backstop on `(public)/layout.tsx`, and
// now an agency-set interval plus a manual purge button.
//
//   settings.cache_ttl_minutes   How often the background tick purges the whole
//                                public cache. 0 / empty = rely on the
//                                framework backstop only.
//
//                                NOTE the ceiling: Next requires `revalidate`
//                                to be a statically analysable constant, so it
//                                cannot be read from this column at runtime.
//                                The layout constant (3600s) is therefore a
//                                hard upper bound — this setting can make
//                                refreshes MORE frequent than an hour, never
//                                less. Values above 60 are accepted but have no
//                                additional effect.
//
//   settings.cache_last_purged   Stamped by /api/internal/revalidate. Drives
//                                the interval check (so the schedule survives a
//                                worker restart) and is shown in the agency UI.
//
// Additive and guarded: an instance that already grew either column keeps its
// data untouched.
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

  addField("settings", {
    "help": "Minutes between automatic full-cache purges. 0 = rely on the framework backstop only. Capped in effect at 60 by the layout revalidate constant.",
    "hidden": false,
    "id": "number_settings_cache_ttl_minutes",
    "max": null,
    "min": null,
    "name": "cache_ttl_minutes",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  });

  addField("settings", {
    "hidden": false,
    "id": "date_settings_cache_last_purged",
    "max": "",
    "min": "",
    "name": "cache_last_purged",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  });
}, (app) => {
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

  dropField("settings", "cache_ttl_minutes", "number_settings_cache_ttl_minutes");
  dropField("settings", "cache_last_purged", "date_settings_cache_last_purged");

  return null;
});
