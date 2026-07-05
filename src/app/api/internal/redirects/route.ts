import { NextResponse } from 'next/server';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';

export const dynamic = 'force-dynamic';

/**
 * Internal feed for the middleware redirect manager. Middleware can't query
 * SQLite PocketBase directly, so it pulls the rule list from here (cached
 * in-memory for 30s) and reports hits back via POST.
 * Auth: Bearer INTERNAL_SECRET, same as /api/tribe/* and the outbox drain.
 */
function authorized(req: Request): boolean {
  const secret = process.env.INTERNAL_SECRET;
  return !!secret && req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const pb = await getAdminPocketBase();
    const records = await pb.collection('redirects').getFullList({ sort: '-id' });
    const rules = records
      .filter((r) => r.from_path && r.to_path)
      .map((r) => ({ id: r.id, from_path: r.from_path, to_path: r.to_path, type: r.type }));
    return NextResponse.json({ rules });
  } catch {
    return NextResponse.json({ rules: [] });
  }
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await req.json();
    if (typeof id !== 'string' || !id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const pb = await getAdminPocketBase();
    const rule = await pb.collection('redirects').getOne(id);
    await pb.collection('redirects').update(id, { hit_count: (rule.hit_count || 0) + 1 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
