/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    id: "pbc_api_keys_col",
    name: "api_keys",
    type: "base",
    system: false,
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        autogeneratePattern: "[a-z0-9]{15}",
        hidden: false,
        id: "text3208210256",
        max: 15,
        min: 15,
        name: "id",
        pattern: "^[a-z0-9]+$",
        presentable: false,
        primaryKey: true,
        required: true,
        system: true,
        type: "text"
      },
      {
        hidden: false,
        id: "autodate2990389176",
        name: "created",
        onCreate: true,
        onUpdate: false,
        presentable: false,
        system: true,
        type: "autodate"
      },
      {
        hidden: false,
        id: "autodate3332085495",
        name: "updated",
        onCreate: true,
        onUpdate: true,
        presentable: false,
        system: true,
        type: "autodate"
      },
      {
        hidden: false,
        id: "text_title_api_key",
        max: 255,
        min: 1,
        name: "title",
        pattern: "",
        presentable: true,
        primaryKey: false,
        required: true,
        system: false,
        type: "text"
      },
      {
        hidden: false,
        id: "text_key_api_key",
        max: 255,
        min: 1,
        name: "key",
        pattern: "",
        presentable: false,
        primaryKey: false,
        required: true,
        system: false,
        type: "text"
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_api_keys_key` ON `api_keys` (`key`)"
    ]
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("api_keys");
  return app.delete(collection);
});
