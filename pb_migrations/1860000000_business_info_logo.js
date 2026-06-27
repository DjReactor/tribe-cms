/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("business_info");

  // Idempotent — field may already exist (admin UI / re-run)
  if (collection.fields.some((f) => f.name === "logo_url")) return;

  collection.fields.push(new Field({
    "autogeneratePattern": "",
    "help": "URL of the business logo image (picked from the media library)",
    "hidden": false,
    "id": "text_business_info_logo_url",
    "max": 0,
    "min": 0,
    "name": "logo_url",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  return app.save(collection);
}, (app) => {
  // Down: remove the logo_url field
  const collection = app.findCollectionByNameOrId("business_info");
  collection.fields = collection.fields.filter((f) => f.name !== "logo_url");
  return app.save(collection);
});
