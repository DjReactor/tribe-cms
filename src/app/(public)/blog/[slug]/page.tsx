import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo, getSeoSettings } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import { buildBlogPostingSchema, buildBreadcrumbSchema } from "@/lib/seo";
import type { BlogPost, MediaItem } from "@/types";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const seoSettings = await getSeoSettings();
  const siteUrl = process.env.SITE_URL || '';

  let post: BlogPost | null = null;
  try {
    const pb = await getPocketBaseClient();
    const { slug } = await params;
    post = await pb.collection('blog_posts').getFirstListItem<BlogPost>(`slug="${slug}" && status="published"`);
  } catch {}

  if (!post) return {};

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || '';
  const canonicalUrl = post.canonical_url || `${siteUrl}/blog/${post.slug}`;
  const shouldNoindex = post.noindex || seoSettings?.noindex_blog;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    ...(shouldNoindex && { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.published_at,
      ...(post.cover_image_url && {
        images: [{ url: post.cover_image_url }],
      }),
    },
  };
}

export default async function BlogPostPageWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const settings = await getSettings();
  const businessInfo = await getBusinessInfo();
  const seoSettings = await getSeoSettings();
  const pb = await getPocketBaseClient();
  const siteUrl = process.env.SITE_URL || '';

  if (!settings.blog_enabled) return notFound();

  let post: BlogPost;
  let relatedPosts: BlogPost[] = [];
  let media: MediaItem[] = [];

  try {
    const resolvedParams = await params;
    const record = await pb.collection('blog_posts').getFirstListItem<BlogPost>(`slug="${resolvedParams.slug}" && status="published"`);
    post = record;

    const related = await pb.collection('blog_posts').getList<BlogPost>(1, 3, {
      filter: `status="published" && id != "${post.id}"`,
      sort: '-published_at'
    });
    relatedPosts = related.items;
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch(e) {
    return notFound();
  }

  const locations = await getLocations();
  const projects = await getProjects();

  const template = await loadTemplate(settings.active_template);
  const BlogPostPageComponent = template.BlogPostPage;

  const blogSchema = buildBlogPostingSchema(post, businessInfo, siteUrl);
  const breadcrumbSchema = seoSettings?.enable_breadcrumbs !== false
    ? buildBreadcrumbSchema([
        { name: 'Blog', item: `${siteUrl}/blog` },
        { name: post.title, item: `${siteUrl}/blog/${post.slug}` },
      ])
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <BlogPostPageComponent
        post={post}
        businessInfo={businessInfo}
        locations={locations}
        projects={projects}
        relatedPosts={relatedPosts}
        media={media}
        config={settings.template_config || {}}
      />
    </>
  );
}
