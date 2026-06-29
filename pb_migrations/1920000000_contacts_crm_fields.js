/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: contacts_crm_fields
 *
 * Adds CRM capture fields to `contacts` and converts the legacy free-text
 * `source` into a relation to the managed `lead_sources` picklist.
 *
 * JSVM notes (verified against the installed PocketBase):
 *   - a live Field's `name` is a string PROPERTY, but its `type` is a METHOD
 *     (`f.type()`), so type checks must call it;
 *   - FieldsList exposes native methods (`push`, `getByName`, `removeByName`);
 *     do NOT rely on `collection.fields = filter(...)` reassignment.
 *
 * Conversion is capture -> swap -> backfill: capture every contact's current
 * `source` text in memory, drop the text field, add a `source_text_legacy` text
 * field (preserves the raw value for Phase 6) plus a new `source` relation, then
 * backfill both — resolving each value to a `lead_sources` row (auto-creating +
 * flagging `needs_review` on a miss).
 *
 * Numbered after create_lead_sources so the relation target exists.
 */
migrate((app) => {
  const contacts = app.findCollectionByNameOrId("contacts");
  const usersId = app.findCollectionByNameOrId("users").id;
  const leadSources = app.findCollectionByNameOrId("lead_sources");

  const has = (name) => contacts.fields.some((f) => f.name === name);
  const sourceField = contacts.fields.getByName("source");
  const sourceIsText = !!sourceField && sourceField.type() === "text";

  // ── 1. Capture legacy `source` text BEFORE altering the schema ──────────
  const legacyById = {};
  if (sourceIsText) {
    let recs = [];
    try { recs = app.findAllRecords("contacts"); } catch (_) { recs = []; }
    for (const r of recs) { if (r) legacyById[r.id] = r.getString("source"); }
  }

  // ── 2. Add new CRM capture fields (idempotent, explicit ids per locations idiom) ──
  if (!has("lifecycle_status")) {
    contacts.fields.push(new Field({
      id: "select_contacts_lifecycle", type: "select", name: "lifecycle_status",
      required: false, maxSelect: 1, values: ["lead", "customer", "inactive"]
    }));
  }
  if (!has("tags")) {
    contacts.fields.push(new Field({ id: "json_contacts_tags", type: "json", name: "tags" }));
  }
  if (!has("assigned_to")) {
    contacts.fields.push(new Field({
      id: "rel_contacts_assigned_to", type: "relation", name: "assigned_to",
      required: false, collectionId: usersId, cascadeDelete: false, maxSelect: 1
    }));
  }
  if (!has("last_contacted_at")) {
    contacts.fields.push(new Field({ id: "date_contacts_last_contacted", type: "date", name: "last_contacted_at" }));
  }
  if (!has("created")) {
    contacts.fields.push(new Field({ id: "autodate_contacts_created", type: "autodate", name: "created", onCreate: true, onUpdate: false }));
  }
  if (!has("updated")) {
    contacts.fields.push(new Field({ id: "autodate_contacts_updated", type: "autodate", name: "updated", onCreate: true, onUpdate: true }));
  }

  // ── 3. Swap the text `source` for a relation (only if still text) ───────
  if (sourceIsText) {
    if (!has("source_text_legacy")) {
      contacts.fields.push(new Field({ id: "text_contacts_source_legacy", type: "text", name: "source_text_legacy" }));
    }
    contacts.fields.removeByName("source");
    contacts.fields.push(new Field({
      id: "rel_contacts_source", type: "relation", name: "source",
      required: false, collectionId: leadSources.id, cascadeDelete: false, maxSelect: 1
    }));
  }

  app.save(contacts);

  // ── 4. Backfill legacy text + the `source` relation ─────────────────────
  const normalize = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, "_");
  const labelOf = (slug) =>
    slug.split("_").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
  const resolveSource = (slug) => {
    try {
      return app.findFirstRecordByData("lead_sources", "slug", slug);
    } catch (_) {
      const row = new Record(leadSources, {
        slug, label: labelOf(slug), is_active: true, needs_review: true, sort_order: 99
      });
      app.save(row);
      return row;
    }
  };

  let contactRecords = [];
  try { contactRecords = app.findAllRecords("contacts"); } catch (_) { contactRecords = []; }
  for (const r of contactRecords) {
    if (!r) continue;
    try {
      const legacyText = legacyById[r.id] || "";
      if (!r.getString("source_text_legacy")) r.set("source_text_legacy", legacyText);
      if (!r.getString("source")) {
        const slug = normalize(legacyText) || "website";
        r.set("source", resolveSource(slug).id);
      }
      app.save(r);
    } catch (_) { /* skip a bad row rather than abort the whole migration */ }
  }
}, (app) => {
  // Down: restore `source` as a plain text field with its original values.
  const contacts = app.findCollectionByNameOrId("contacts");

  const legacyById = {};
  if (contacts.fields.some((f) => f.name === "source_text_legacy")) {
    let recs = [];
    try { recs = app.findAllRecords("contacts"); } catch (_) { recs = []; }
    for (const r of recs) { if (r) legacyById[r.id] = r.getString("source_text_legacy"); }
  }

  ["lifecycle_status", "tags", "assigned_to", "last_contacted_at", "created", "updated", "source", "source_text_legacy"]
    .forEach((n) => contacts.fields.removeByName(n));
  contacts.fields.push(new Field({ id: "text_contacts_source_restored", type: "text", name: "source" }));
  app.save(contacts);

  let recs = [];
  try { recs = app.findAllRecords("contacts"); } catch (_) { recs = []; }
  for (const r of recs) {
    if (!r) continue;
    try { r.set("source", legacyById[r.id] || ""); app.save(r); } catch (_) { /* skip */ }
  }
});
