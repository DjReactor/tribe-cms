/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: refine_ai_call_logs
 *
 * Enriches the EXISTING ai_call_logs collection with the Retell "Get Call"
 * schema (§4.5): a contact link, call_type/direction/call_status selects, phone
 * numbers, agent + twilio ids, timestamps, recording/log urls, outcome flags,
 * custom_analysis_data, cost, metadata, and created/updated. Adds a UNIQUE index
 * on call_id — the dedupe key the Retell route upserts on.
 *
 * Existing fields kept: call_id, caller_number, transcript, summary, duration,
 * sentiment. Fields added via fields.push behind a has() guard (idempotent), per
 * the contacts_crm_fields idiom. Assumes existing rows have a populated, unique
 * call_id (true for Retell-written rows); created/updated backfill for old rows
 * is a Phase 6 concern.
 */
migrate((app) => {
  const coll = app.findCollectionByNameOrId("ai_call_logs");
  const contactsId = app.findCollectionByNameOrId("contacts").id;
  const has = (name) => coll.fields.some((f) => f.name === name);
  const add = (field) => { if (!has(field.name)) coll.fields.push(new Field(field)); };

  add({ id: "rel_acl_contact",        type: "relation", name: "contact", required: false, collectionId: contactsId, cascadeDelete: false, maxSelect: 1 });
  add({ id: "sel_acl_call_type",      type: "select",   name: "call_type",   maxSelect: 1, values: ["phone_call", "web_call"] });
  add({ id: "sel_acl_direction",      type: "select",   name: "direction",   maxSelect: 1, values: ["inbound", "outbound"] });
  add({ id: "text_acl_from_number",   type: "text",     name: "from_number" });
  add({ id: "text_acl_to_number",     type: "text",     name: "to_number" });
  add({ id: "text_acl_agent_id",      type: "text",     name: "agent_id" });
  add({ id: "text_acl_agent_name",    type: "text",     name: "agent_name" });
  add({ id: "text_acl_twilio_sid",    type: "text",     name: "twilio_call_sid" });
  add({ id: "sel_acl_call_status",    type: "select",   name: "call_status", maxSelect: 1, values: ["registered", "ongoing", "ended", "error"] });
  add({ id: "text_acl_disconnect",    type: "text",     name: "disconnection_reason" });
  add({ id: "date_acl_start",         type: "date",     name: "start_timestamp" });
  add({ id: "date_acl_end",           type: "date",     name: "end_timestamp" });
  add({ id: "url_acl_recording",      type: "url",      name: "recording_url" });
  add({ id: "url_acl_public_log",     type: "url",      name: "public_log_url" });
  add({ id: "bool_acl_successful",    type: "bool",     name: "call_successful" });
  add({ id: "bool_acl_voicemail",     type: "bool",     name: "in_voicemail" });
  add({ id: "json_acl_custom",        type: "json",     name: "custom_analysis_data" });
  add({ id: "num_acl_cost",           type: "number",   name: "combined_cost" });
  add({ id: "json_acl_metadata",      type: "json",     name: "metadata" });
  add({ id: "autodate_acl_created",   type: "autodate", name: "created", onCreate: true, onUpdate: false });
  add({ id: "autodate_acl_updated",   type: "autodate", name: "updated", onCreate: true, onUpdate: true });

  coll.indexes = [
    "CREATE UNIQUE INDEX `idx_ai_call_logs_call_id` ON `ai_call_logs` (`call_id`)"
  ];
  app.save(coll);
}, (app) => {
  const coll = app.findCollectionByNameOrId("ai_call_logs");
  [
    "contact", "call_type", "direction", "from_number", "to_number", "agent_id", "agent_name",
    "twilio_call_sid", "call_status", "disconnection_reason", "start_timestamp", "end_timestamp",
    "recording_url", "public_log_url", "call_successful", "in_voicemail", "custom_analysis_data",
    "combined_cost", "metadata", "created", "updated",
  ].forEach((n) => coll.fields.removeByName(n));
  coll.indexes = [];
  app.save(coll);
});
