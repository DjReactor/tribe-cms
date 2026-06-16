import { NextResponse } from 'next/server';
import { getPocketBaseClient } from '@/lib/pocketbase';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.INTERNAL_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { enabled, reason } = await req.json();
    const lockPath = path.join(process.cwd(), '.tribe-update-lock');

    try {
      const pb = await getPocketBaseClient();
      const settingsList = await pb.collection('settings').getFullList();
      if (settingsList.length > 0) {
        await pb.collection('settings').update(settingsList[0].id, {
          updates_enabled: enabled,
          update_lock_reason: enabled ? '' : (reason || 'Manual lock via API')
        });
      }
    } catch (e: any) {
      console.error("PB update failed:", e.message);
      // Even if PB fails, we proceed with lockfile toggle to ensure the primary lock is set
    }

    if (enabled === false) {
      const lockContent = `locked_at=${new Date().toISOString()}\nlocked_by=api\nreason=${reason || 'Manual lock'}\n`;
      fs.writeFileSync(lockPath, lockContent);
    } else {
      if (fs.existsSync(lockPath)) {
        fs.unlinkSync(lockPath);
      }
    }

    return NextResponse.json({ success: true, updates_enabled: enabled });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
