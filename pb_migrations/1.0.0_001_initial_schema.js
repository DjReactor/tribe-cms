migrate((db) => {
  const schema = require("../pb_schema/schema.json");
  schema.forEach((c) => {
    try {
      let collection = db.findCollectionByNameOrId(c.name);
      if (!collection) {
        collection = new Collection(c);
        db.save(collection);
      }
    } catch(e) {
      const collection = new Collection(c);
      db.save(collection);
    }
  });
}, (db) => {
  // down
});
