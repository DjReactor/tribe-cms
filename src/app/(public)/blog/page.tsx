import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo, getSeoSettings } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import type { BlogPost, MediaItem } from "@/types";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const seoSettings = await getSeoSettings();
  const siteUrl = process.env.SITE_URL || '';

  return {
    title: 'Blog',
    description: `Tips, guides, and news from ${businessInfo.business_name}.`,
    alternates: { canonical: `${siteUrl}/blog` },
    ...(seoSettings?.noindex_blog && { robots: { index: false, follow: true } }),
  };
}

export default async function BlogIndexPageWrapper({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const settings = await getSettings();
  if (!settings.blog_enabled) return notFound();

  const businessInfo = await getBusinessInfo();
  const pb = await getPocketBaseClient();
  
  const resolvedSearch = await searchParams;
  const page = parseInt(resolvedSearch.page || '1');
  const perPage = 12;
  
  let posts: BlogPost[] = [];
  let totalPages = 1;
  let media: MediaItem[] = [];
  
  try {
    const result = await pb.collection('blog_posts').getList<BlogPost>(page, perPage, { 
      filter: 'status = "published"',
      sort: '-published_at'
    });
    posts = result.items;
    totalPages = result.totalPages;
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch(e) {}

  const locations = await getLocations();
  const projects = await getProjects();

  const template = await loadTemplate(settings.active_template);
  const BlogIndexPageComponent = template.BlogIndexPage;

  return (
    <BlogIndexPageComponent
      posts={posts}
      businessInfo={businessInfo}
      locations={locations}
      projects={projects}
      currentPage={page}
      totalPages={totalPages}
      media={media}
      config={settings.template_config || {}}
    />
  );
}