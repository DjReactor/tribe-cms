/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const businessInfo = app.findCollectionByNameOrId("business_info");
  businessInfo.fields.add({
    "hidden": false,
    "id": "json_niche_attributes",
    "name": "niche_attributes",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json",
    "maxSize": 0
  });
  app.save(businessInfo);

  const settings = app.findCollectionByNameOrId("settings");
  settings.fields.add({
    "hidden": false,
    "id": "json_niche_schema",
    "name": "niche_schema",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json",
    "maxSize": 0
  });
  app.save(settings);
}, (app) => {
  const businessInfo = app.findCollectionByNameOrId("business_info");
  businessInfo.fields.removeById("json_niche_attributes");
  app.save(businessInfo);

  const settings = app.findCollectionByNameOrId("settings");
  settings.fields.removeById("json_niche_schema");
  app.save(settings);
});
