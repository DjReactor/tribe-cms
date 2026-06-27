import type { BusinessInfo, SeoSettings, Service, ServiceArea, BlogPost, Testimonial } from '@/types';

export function buildLocalBusinessSchema(
  businessInfo: BusinessInfo,
  seoSettings: SeoSettings | null,
  testimonials: Testimonial[] = [],
  services: Service[] = [],
  serviceAreas: ServiceArea[] = [],
  siteUrl: string = ''
) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": seoSettings?.schema_business_type || "LocalBusiness",
    "name": businessInfo.business_name,
    "telephone": businessInfo.phone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": businessInfo.address,
      "addressLocality": businessInfo.city,
      "addressRegion": businessInfo.state || '',
      "postalCode": businessInfo.zip || '',
      "addressCountry": "US"
    }
  };

  if (siteUrl) {
    schema["url"] = siteUrl;
  }

  if (businessInfo.email) {
    schema["email"] = businessInfo.email;
  }

  if (seoSettings?.schema_price_range) {
    schema["priceRange"] = seoSettings.schema_price_range;
  }

  // Social profiles
  const sameAs = [];
  if (businessInfo.social_facebook) sameAs.push(businessInfo.social_facebook);
  if (businessInfo.social_instagram) sameAs.push(businessInfo.social_instagram);
  if (businessInfo.social_yelp) sameAs.push(businessInfo.social_yelp);
  if (businessInfo.social_google) sameAs.push(businessInfo.social_google);
  if (sameAs.length > 0) {
    schema["sameAs"] = sameAs;
  }

  if (businessInfo.year_established) {
    schema["foundingYear"] = businessInfo.year_established.toString();
  }

  // Opening hours from business hours
  if (businessInfo.hours?.length > 0) {
    const enabledHours = businessInfo.hours.filter(h => h.enabled);
    if (enabledHours.length > 0) {
      schema["openingHoursSpecification"] = enabledHours.map(h => ({
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": h.day.charAt(0).toUpperCase() + h.day.slice(1),
        "opens": h.open,
        "closes": h.close
      }));
    }
  }

  // Service Areas
  if (serviceAreas.length > 0) {
    schema["areaServed"] = serviceAreas.map(area => ({
      "@type": "City",
      "name": area.name
    }));
  }

  // Aggregate Rating (from visible testimonials)
  if (seoSettings?.enable_aggregate_rating !== false && testimonials.length >= 3) {
    const totalRating = testimonials.reduce((acc, t) => acc + t.rating, 0);
    const avgRating = totalRating / testimonials.length;
    schema["aggregateRating"] = {
      "@type": "AggregateRating",
      "ratingValue": avgRating.toFixed(1),
      "reviewCount": testimonials.length.toString()
    };
  }

  return schema;
}

export function buildServiceSchema(service: Service, businessInfo: BusinessInfo, siteUrl: string = '') {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name,
    "description": service.short_description || service.seo_description,
    "provider": {
      "@type": "LocalBusiness",
      "name": businessInfo.business_name
    }
  };

  if (siteUrl && service.slug) {
    schema["url"] = `${siteUrl}/services/${service.slug}`;
  }

  if (service.cover_image_url) {
    schema["image"] = service.cover_image_url;
  }

  return schema;
}

export function buildBlogPostingSchema(post: BlogPost, businessInfo: BusinessInfo, siteUrl: string) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "datePublished": post.published_at,
    "dateModified": post.updated || post.published_at,
    "author": {
      "@type": "Organization",
      "name": businessInfo.business_name
    },
    "publisher": {
      "@type": "Organization",
      "name": businessInfo.business_name,
      ...(businessInfo.logo_url ? {
        "logo": {
          "@type": "ImageObject",
          "url": businessInfo.logo_url
        }
      } : {})
    }
  };

  if (post.excerpt) {
    schema["description"] = post.excerpt;
  }

  if (post.cover_image_url) {
    schema["image"] = [post.cover_image_url];
  }

  if (siteUrl && post.slug) {
    schema["mainEntityOfPage"] = {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`
    };
  }

  return schema;
}

export function buildBreadcrumbSchema(items: { name: string, item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.item
    }))
  };
}

export function generateMetaTitle(pageTitle: string, seoSettings: SeoSettings | null, businessName: string) {
  const separator = seoSettings?.title_separator || '|';
  return `${pageTitle} ${separator} ${businessName}`;
}
