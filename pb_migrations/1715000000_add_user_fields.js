migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  
  collection.fields.add(new Field({
    name: "role",
    type: "text",
    required: true
  }));
  collection.fields.add(new Field({
    name: "display_name",
    type: "text"
  }));
  collection.fields.add(new Field({
    name: "must_change_password",
    type: "bool"
  }));
  
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("role");
  collection.fields.removeByName("display_name");
  collection.fields.removeByName("must_change_password");
  app.save(collection);
});
