/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("service_areas");

  // Idempotent — field may already exist (admin UI / re-run)
  if (collection.fields.some((f) => f.name === "neighborhoods")) return;

  collection.fields.push(new Field({
    "help": "Sub-areas/neighborhoods served within this area (array of strings)",
    "hidden": false,
    "id": "json_service_areas_neighborhoods",
    "maxSize": 0,
    "name": "neighborhoods",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }));

  return app.save(collection);
}, (app) => {
  // Down: remove the neighborhoods field
  const collection = app.findCollectionByNameOrId("service_areas");
  collection.fields = collection.fields.filter((f) => f.name !== "neighborhoods");
  return app.save(collection);
});
