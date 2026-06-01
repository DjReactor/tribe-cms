import { NextResponse } from 'next/server';
import { getPocketBaseClient } from '@/lib/pocketbase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const version = process.env.NEXT_PUBLIC_VERSION || '1.0.0';

  try {
    const pb = await getPocketBaseClient();
    // Verify DB connection
    await pb.collection('settings').getFirstListItem('');

    return NextResponse.json({
      status: 'ok',
      pb_connected: true,
      version,
      instance_slug: process.env.INSTANCE_SLUG || '',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'degraded',
      pb_connected: false,
      version,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
