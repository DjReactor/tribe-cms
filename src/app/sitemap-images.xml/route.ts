import { getPublicPocketBase } from '@/lib/pocketbase-public';
import type { MediaItem, BlogPost, Service } from '@/types';
import { getMediaFileUrl } from '@/lib/images';
import { getServices, indexServices, getServicePath } from '@/lib/services';
import { NextResponse } from 'next/server';

// Explicit: this handler no longer inherits a `force-dynamic` from the root
// layout (removed when ISR was enabled), and its output tracks live data.
export const dynamic = 'force-dynamic';

export async function GET() {
  const pb = await getPublicPocketBase();
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  try {
    // Add gallery/hero media
    const media = await pb.collection('media').getFullList<MediaItem>();
    media.forEach(item => {
      const fileUrl = getMediaFileUrl(item);
      if (fileUrl) {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}</loc>\n`;
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${fileUrl}</image:loc>\n`;
        if (item.alt_text) xml += `      <image:title>${item.alt_text}</image:title>\n`;
        xml += `    </image:image>\n`;
        xml += `  </url>\n`;
      }
    });

    // Add Service Cover Images
    const services = await getServices();
    const servicesById = indexServices(services);
    services.forEach(service => {
      if (service.cover_image_url) {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}${getServicePath(service, servicesById)}</loc>\n`;
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${service.cover_image_url}</image:loc>\n`;
        xml += `      <image:title>${service.name}</image:title>\n`;
        xml += `    </image:image>\n`;
        xml += `  </url>\n`;
      }
    });

    // Add Blog Cover Images
    const settings = await pb.collection('settings').getFirstListItem('');
    if (settings.blog_enabled) {
      const posts = await pb.collection('blog_posts').getFullList<BlogPost>({ filter: 'status = "published"' });
      posts.forEach(post => {
        if (post.cover_image_url) {
          xml += `  <url>\n`;
          xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${post.cover_image_url}</image:loc>\n`;
          xml += `      <image:title>${post.title}</image:title>\n`;
          xml += `    </image:image>\n`;
          xml += `  </url>\n`;
        }
      });
    }
  } catch (error) {
    console.error('Error generating image sitemap:', error);
  }

  xml += `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
