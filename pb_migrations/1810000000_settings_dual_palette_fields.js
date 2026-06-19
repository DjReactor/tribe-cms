/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("settings");

  // Skip if fields already exist (idempotent)
  const existingNames = collection.fields.map(f => f.name);
  if (existingNames.includes("palette_source")) return;

  collection.fields.push(new Field({
    "help": "Which palette source is active: 'template' or 'cms'",
    "hidden": false,
    "id": "text_palette_source",
    "max": 20,
    "min": 0,
    "name": "palette_source",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text",
    "autogeneratePattern": ""
  }));

  collection.fields.push(new Field({
    "help": "Per-slot user overrides applied on top of the template's defaultPalette",
    "hidden": false,
    "id": "json_template_palette_overrides",
    "maxSize": 65536,
    "name": "template_palette_overrides",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }));

  collection.fields.push(new Field({
    "help": "The one custom CMS palette (ColorPaletteColors object or null)",
    "hidden": false,
    "id": "json_cms_palette",
    "maxSize": 65536,
    "name": "cms_palette",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }));

  return app.save(collection);
}, (app) => {
  // Down: remove the three fields
  const collection = app.findCollectionByNameOrId("settings");
  collection.fields = collection.fields.filter(
    f => !["palette_source", "template_palette_overrides", "cms_palette"].includes(f.name)
  );
  return app.save(collection);
});
