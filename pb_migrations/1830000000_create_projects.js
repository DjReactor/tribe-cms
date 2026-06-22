/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Idempotent: skip if a `projects` collection already exists (some instances
  // had it hand-created via the Admin UI). Never clobber an existing collection.
  let existing = null;
  try { existing = app.findCollectionByNameOrId("projects"); } catch (_) { existing = null; }
  if (existing) return;

  // Relation targets — resolve by name so this works regardless of per-instance ids.
  const servicesId = app.findCollectionByNameOrId("services").id;
  const mediaId = app.findCollectionByNameOrId("media").id;

  const collection = new Collection({
    type: "base",
    name: "projects",
    // Public read (public /projects pages); writes require an authenticated BO.
    listRule: "",
    viewRule: "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      { type: "text", name: "title", required: true },
      { type: "text", name: "slug", required: true },
      { type: "text", name: "summary" },
      { type: "select", name: "status", maxSelect: 1, values: ["planned", "in_progress", "completed"] },
      { type: "bool", name: "featured" },
      { type: "bool", name: "is_active" },
      { type: "number", name: "sort_order" },
      { type: "relation", name: "services", collectionId: servicesId, cascadeDelete: false, minSelect: 0, maxSelect: 999 },
      { type: "text", name: "location_city" },
      { type: "text", name: "location_state" },
      { type: "text", name: "completed_at" },
      { type: "text", name: "cover_image_url" },
      { type: "relation", name: "gallery_media", collectionId: mediaId, cascadeDelete: false, minSelect: 0, maxSelect: 999 },
      { type: "text", name: "content_problem" },
      { type: "text", name: "content_solution" },
      { type: "text", name: "content_process" },
      { type: "text", name: "content_outcome" },
      { type: "text", name: "testimonial_quote" },
      { type: "text", name: "testimonial_client" },
      { type: "text", name: "testimonial_client_info" },
      { type: "number", name: "testimonial_rating" },
      { type: "text", name: "testimonial_client_image_url" },
      { type: "text", name: "seo_title" },
      { type: "text", name: "seo_description" },
      { type: "text", name: "canonical_url" },
      { type: "text", name: "og_image_url" },
      { type: "bool", name: "noindex" },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true }
    ]
  });

  return app.save(collection);
}, (app) => {
  // Down: remove the projects collection if present.
  let existing = null;
  try { existing = app.findCollectionByNameOrId("projects"); } catch (_) { existing = null; }
  if (existing) return app.delete(existing);
  return null;
});
