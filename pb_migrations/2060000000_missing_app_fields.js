/// <reference path="../pb_data/types.d.ts" />
// Four fields the app has always read and written, that no committed migration
// ever created.
//
// This is the documented schema drift, caught by standing a fresh instance up
// from these migrations alone and driving the landing-page routes against it.
// On such an instance the columns are simply absent: PocketBase drops the
// values on write and returns undefined on read, so the feature looks wired end
// to end and silently does nothing. Existing instances that grew the columns by
// hand are untouched — every branch here is guarded on the field's absence, so
// no value is ever overwritten.
//
//   settings.projects_enabled            gates getProjects() — without it the
//                                        global `projects` prop is always [],
//                                        so /projects, /projects/[slug] and the
//                                        landing-page auto-pull all render
//                                        empty whatever the toggle says.
//   service_areas.geo_latitude/longitude written by the Service Areas form and
//                                        read into GeoCoordinates on landing
//                                        pages.
//   service_areas.noindex                read by the area route's metadata; the
//                                        per-area switch was inert without it.
//
// `settings.service_areas_index_enabled` belongs to the same family and is
// created here too: the agency settings form wrote it, `/service-areas` gated
// on it, and no migration made it — so the index page 404'd however the toggle
// was set. Its other half (getSettings() never mapping the field, which broke
// the page even where the column did exist) is fixed in `src/lib/settings.ts`.
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
    "help": "Show the Projects section and its public routes.",
    "hidden": false,
    "id": "bool_settings_projects_enabled",
    "name": "projects_enabled",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  });

  addField("settings", {
    "help": "Show the /service-areas index page listing every area.",
    "hidden": false,
    "id": "bool_settings_service_areas_index_enabled",
    "name": "service_areas_index_enabled",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  });

  // Text rather than number: the form collects them as strings and they are
  // emitted verbatim into schema.org GeoCoordinates, where "38.4404" and
  // 38.4404 are equally valid but the string cannot lose trailing precision.
  addField("service_areas", {
    "autogeneratePattern": "",
    "help": "Latitude, for GeoCoordinates on landing pages.",
    "hidden": false,
    "id": "text_service_areas_geo_latitude",
    "max": 0,
    "min": 0,
    "name": "geo_latitude",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  });

  addField("service_areas", {
    "autogeneratePattern": "",
    "help": "Longitude, for GeoCoordinates on landing pages.",
    "hidden": false,
    "id": "text_service_areas_geo_longitude",
    "max": 0,
    "min": 0,
    "name": "geo_longitude",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  });

  addField("service_areas", {
    "help": "Keep this area page out of search results.",
    "hidden": false,
    "id": "bool_service_areas_noindex",
    "name": "noindex",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  });

  return null;
}, (app) => {
  const dropField = (collectionName, fieldName) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId(collectionName);
    } catch (_) {
      return;
    }
    if (!collection.fields.some(f => f.name === fieldName)) return;
    collection.fields.removeByName(fieldName);
    app.save(collection);
  };

  dropField("settings", "projects_enabled");
  dropField("settings", "service_areas_index_enabled");
  dropField("service_areas", "geo_latitude");
  dropField("service_areas", "geo_longitude");
  dropField("service_areas", "noindex");

  return null;
});
