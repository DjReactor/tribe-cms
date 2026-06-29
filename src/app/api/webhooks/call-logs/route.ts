import { NextResponse } from 'next/server';

/**
 * DEPRECATED endpoint.
 *
 * This route previously wrote to `call_logs` and `leads` collections that do
 * not exist in the schema (it would always 500). AI call ingestion is handled
 * by the Retell webhook at `/api/webhooks/retell`, which writes to the live
 * `ai_call_logs` collection. This stub returns 410 Gone so any stale caller
 * gets a clear, intentional signal instead of a silent failure.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Gone. AI call ingestion moved to /api/webhooks/retell.' },
    { status: 410 },
  );
}
