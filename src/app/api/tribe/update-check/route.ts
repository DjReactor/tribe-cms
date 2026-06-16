import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.INTERNAL_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lockPath = path.join(process.cwd(), '.tribe-update-lock');
  const updatesEnabled = !fs.existsSync(lockPath);

  return NextResponse.json({
    updates_enabled: updatesEnabled
  });
}
