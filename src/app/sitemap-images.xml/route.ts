import { NextResponse } from 'next/server';
import { getPocketBaseClient } from '@/lib/pocketbase';
import type { MediaItem } from '@/types';

export async function GET() {
  const pb = await getPocketBaseClient();
  const media = await pb.collection('media').getFullList<MediaItem>().catch(() => []);
  const domain = process.env.SITE_URL || 'http://localhost:3000';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${domain}</loc>`;
    
  media.forEach(m => {
    if (m.url || m.file) {
      const url = m.url || `${domain}/api/files/media/${m.id}/${m.file}`;
      xml += `
    <image:image>
      <image:loc>${url}</image:loc>
      <image:caption>${m.alt_text || ''}</image:caption>
    </image:image>`;
    }
  });

  xml += `
  </url>
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
