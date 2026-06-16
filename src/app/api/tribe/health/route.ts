import { NextResponse } from 'next/server';
import { getPocketBaseClient } from '@/lib/pocketbase';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.INTERNAL_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const versionPath = path.join(process.cwd(), '.tribe-version');
  const fileVersion = fs.existsSync(versionPath) ? fs.readFileSync(versionPath, 'utf8').trim() : null;
  const version = fileVersion || process.env.NEXT_PUBLIC_VERSION || '1.0.0';
  
  const lockPath = path.join(process.cwd(), '.tribe-update-lock');
  const updatesEnabled = !fs.existsSync(lockPath);

  try {
    const pb = await getPocketBaseClient();
    // Verify DB connection
    try {
      await pb.collection('settings').getFirstListItem('');
    } catch (e: any) {
      // 404 is fine (empty collection), anything else means PB is unreachable
      if (e.status !== 404) throw e;
    }

    return NextResponse.json({
      status: 'ok',
      version,
      instance_slug: process.env.INSTANCE_SLUG || 'unknown',
      channel: 'stable',
      updates_enabled: updatesEnabled,
      pb_connected: true,
      uptime_seconds: process.uptime()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'degraded',
      version,
      instance_slug: process.env.INSTANCE_SLUG || 'unknown',
      channel: 'stable',
      updates_enabled: updatesEnabled,
      pb_connected: false,
      uptime_seconds: process.uptime(),
      error: error.message
    }, { status: 503 });
  }
}
