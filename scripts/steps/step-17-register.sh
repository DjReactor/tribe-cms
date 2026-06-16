#!/bin/bash
. /opt/tribe-instances/scripts/steps/shared.sh
SLUG=$1; [ -z "$SLUG" ] && exit_fail "Usage: $0 SLUG"
mark_step_running "$SLUG" "17_register"

STATE=$(read_state "$SLUG")
DOMAIN=$(echo "$STATE" | jq -r '.input.domain')
BUSINESS_NAME=$(echo "$STATE" | jq -r '.input.business_name' | tr -d '\n')
NEXTJS_PORT=$(echo "$STATE" | jq -r '.ports.nextjs_port')
PB_PORT=$(echo "$STATE" | jq -r '.ports.pb_port')
NICHE=$(echo "$STATE" | jq -r '.input.niche // ""')

SA_DB="/opt/tribe-superadmin/data/instances.db"

if [ ! -f "$SA_DB" ]; then
  mark_step_failed "$SLUG" "17_register" "SuperAdmin instances.db not found at $SA_DB"
  exit_fail "SuperAdmin SQLite DB not found: $SA_DB"
fi

# Use node to upsert into SuperAdmin SQLite registry
RECORD_ID=$(node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(process.argv[1]);
db.exec(\`CREATE TABLE IF NOT EXISTS instances (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT NOT NULL,
  port TEXT DEFAULT '0',
  niche TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  currentStep INTEGER DEFAULT 18,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  businessName TEXT,
  nextjs_port INTEGER,
  pb_port INTEGER
)\`);
const slug = process.argv[2];
const domain = process.argv[3];
const nextjsPort = parseInt(process.argv[4]);
const pbPort = parseInt(process.argv[5]);
const niche = process.argv[6];
const businessName = process.argv[7];
const existing = db.prepare('SELECT id FROM instances WHERE slug = ?').get(slug);
if (existing) {
  db.prepare('UPDATE instances SET domain=?,nextjs_port=?,pb_port=?,status=?,currentStep=?,niche=?,businessName=? WHERE slug=?')
    .run(domain, nextjsPort, pbPort, 'active', 18, niche, businessName, slug);
  process.stdout.write(existing.id);
} else {
  const id = require('crypto').randomUUID();
  db.prepare('INSERT INTO instances (id,slug,domain,port,nextjs_port,pb_port,niche,businessName,status,currentStep) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, slug, domain, '0', nextjsPort, pbPort, niche, businessName, 'active', 18);
  process.stdout.write(id);
}
" "$SA_DB" "$SLUG" "$DOMAIN" "$NEXTJS_PORT" "$PB_PORT" "$NICHE" "$BUSINESS_NAME" 2>/dev/null)

if [ -z "$RECORD_ID" ]; then
  mark_step_failed "$SLUG" "17_register" "Failed to write to SuperAdmin SQLite registry"
  exit_fail "Registry write failed — could not insert/update instances.db"
fi

set_state "$SLUG" ".runtime.superadmin_record_id = \"$RECORD_ID\""
mark_step_ok "$SLUG" "17_register"
ok "Instance registered in SuperAdmin SQLite registry (ID: $RECORD_ID)"
