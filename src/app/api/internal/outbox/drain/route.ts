import { NextResponse } from 'next/server';
import { drainOutbox } from '@/lib/automation';

export const dynamic = 'force-dynamic';

/**
 * Internal outbox drain — invoked on an interval by the per-instance PM2 drain
 * worker (scripts/drain-worker.js). Retries due event_outbox rows (CMS → n8n).
 * Auth: Bearer INTERNAL_SECRET (§3.4 #2), same as /api/tribe/*.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.INTERNAL_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await drainOutbox();
  return NextResponse.json(result);
}
