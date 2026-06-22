/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("services");

  // Skip if field already exists (idempotent — may have been added via admin UI)
  const existingNames = collection.fields.map(f => f.name);
  if (existingNames.includes("noindex")) return;

  collection.fields.push(new Field({
    "help": "Per-service: emit robots noindex and exclude from sitemap when true",
    "hidden": false,
    "id": "bool_services_noindex",
    "name": "noindex",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }));

  return app.save(collection);
}, (app) => {
  // Down: remove the noindex field
  const collection = app.findCollectionByNameOrId("services");
  collection.fields = collection.fields.filter(f => f.name !== "noindex");
  return app.save(collection);
});
