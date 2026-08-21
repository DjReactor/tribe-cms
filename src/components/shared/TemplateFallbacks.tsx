import Link from 'next/link';
import { BlockNoteRenderer } from './BlockNoteRenderer';
import { ContactForm } from './ContactForm';
import type {
  BusinessInfo,
  BlogPost,
  Pair,
  Service,
  ServiceArea,
  ServiceNode,
  ServiceAreaNode,
  AreaWithLanding,
  ServiceWithLanding,
} from '@/types';

/**
 * What the platform renders when a template omits an optional page component.
 *
 * THE RULE: if the sitemap advertises a URL, that URL must render something.
 * Every page here is one the sitemap emits unconditionally, so a `notFound()`
 * would mean submitting a 404 to Google and losing content the client wrote —
 * silently, because the record is fine and only the template is incomplete.
 *
 * The routes that deliberately keep `notFound()` are the ones the sitemap does
 * NOT list: `/service-areas` (also behind a settings switch), `/testimonials`,
 * `/privacy-policy` and `/terms-of-service`. Nothing points at those but the
 * template's own navigation, so a template that omits the component is simply
 * choosing not to have the page.
 *
 * These are deliberately plain. They are a floor, not a design: enough markup
 * to be readable, indexable and navigable, with the same contracts the real
 * templates must honour —
 *
 *  - one `<h1>` per page,
 *  - links come from a node's precomputed `path`, never assembled from slugs,
 *  - `landingPath` is linked when set and rendered as text when null,
 *  - `also_serving` entries are never linked.
 */

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">{children}</div>;
}

function Trail({ crumbs }: { crumbs: { name: string; path: string }[] }) {
  if (crumbs.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        {crumbs.map((crumb, i) => (
          <li key={crumb.path} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === crumbs.length - 1
              ? <span aria-current="page" className="text-slate-700">{crumb.name}</span>
              : <Link href={crumb.path} className="hover:underline">{crumb.name}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** `/about` */
export function AboutFallback({ businessInfo, heading }: { businessInfo: BusinessInfo; heading?: string }) {
  return (
    <Shell>
      <h1 className="text-4xl font-bold">{heading || `About ${businessInfo.business_name}`}</h1>
      {businessInfo.short_description && (
        <p className="text-lg text-slate-600">{businessInfo.short_description}</p>
      )}
      {businessInfo.year_established > 0 && (
        <p className="text-slate-600">Serving since {businessInfo.year_established}.</p>
      )}
      {businessInfo.license_number && (
        <p className="text-sm text-slate-500">License {businessInfo.license_number}</p>
      )}
    </Shell>
  );
}

/** `/contact` — a contact page with no way to make contact is not a page. */
export function ContactFallback({ businessInfo, heading }: { businessInfo: BusinessInfo; heading?: string }) {
  return (
    <Shell>
      <h1 className="text-4xl font-bold">{heading || `Contact ${businessInfo.business_name}`}</h1>
      <ul className="space-y-1 text-slate-600">
        {businessInfo.phone && <li><a href={`tel:${businessInfo.phone}`} className="hover:underline">{businessInfo.phone}</a></li>}
        {businessInfo.email && <li><a href={`mailto:${businessInfo.email}`} className="hover:underline">{businessInfo.email}</a></li>}
        {businessInfo.address && <li>{businessInfo.address}</li>}
      </ul>
      <ContactForm source="contact_page" />
    </Shell>
  );
}

/** `/services` — every tier, indented by depth. */
export function ServicesIndexFallback({ services, heading }: { services: ServiceNode[]; heading?: string }) {
  return (
    <Shell>
      <h1 className="text-4xl font-bold">{heading || 'Our Services'}</h1>
      <ul className="space-y-3">
        {services.map((service) => (
          <li key={service.id} style={{ paddingLeft: `${(service.depth - 1) * 1.25}rem` }}>
            <Link href={service.path} className="font-medium hover:underline">{service.name}</Link>
            {service.short_description && (
              <p className="text-sm text-slate-500">{service.short_description}</p>
            )}
          </li>
        ))}
      </ul>
      {services.length === 0 && <p className="text-slate-500">No services yet.</p>}
    </Shell>
  );
}

/** `/services/<slug>` */
export function ServiceDetailFallback({
  service, serviceTrail, childServices, serviceAreas,
}: {
  service: Service;
  serviceTrail: { name: string; path: string }[];
  childServices: ServiceNode[];
  serviceAreas: AreaWithLanding[];
}) {
  return (
    <Shell>
      <Trail crumbs={[{ name: 'Services', path: '/services' }, ...serviceTrail]} />
      <h1 className="text-4xl font-bold">{service.name}</h1>
      {service.short_description && <p className="text-lg text-slate-600">{service.short_description}</p>}
      {service.cover_image_url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={service.cover_image_url} alt={service.name} className="w-full rounded-xl" />
      )}
      {Array.isArray(service.page_content) && service.page_content.length > 0 && (
        <BlockNoteRenderer content={service.page_content} />
      )}

      {childServices.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mt-8 mb-3">{service.name} Services</h2>
          <ul className="space-y-2">
            {childServices.map((child) => (
              <li key={child.id}>
                <Link href={child.path} className="hover:underline">{child.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {serviceAreas.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mt-8 mb-3">Where We Offer {service.name}</h2>
          {/* A path is a link; a null is TEXT. Never the area hub — see the
              link-or-text rule in tribe-cms/AGENTS.md. */}
          <ul className="space-y-2 text-slate-700">
            {serviceAreas.map((area) => (
              <li key={area.id}>
                {area.landingPath
                  ? <Link href={area.landingPath} className="hover:underline">{service.name} in {area.name}</Link>
                  : <span>{area.name}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}

/** `/<area-slug>` */
export function ServiceAreaFallback({
  area, areaTrail, childAreas, services, h1, intro,
}: {
  area: ServiceArea;
  areaTrail: { name: string; path: string }[];
  childAreas: ServiceAreaNode[];
  services: ServiceWithLanding[];
  h1: string;
  intro: string;
}) {
  const alsoServing = (area.also_serving || []).filter((entry) => entry.trim());

  return (
    <Shell>
      <Trail crumbs={areaTrail} />
      <h1 className="text-4xl font-bold">{h1}</h1>
      {intro && <p className="text-lg text-slate-600">{intro}</p>}
      {Array.isArray(area.page_content) && area.page_content.length > 0 && (
        <BlockNoteRenderer content={area.page_content} />
      )}

      {services.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mt-8 mb-3">Services We Offer in {area.name}</h2>
          {/* The landing page when one exists, otherwise the service's own
              page — a real page either way, never a fabricated URL. */}
          <ul className="space-y-2">
            {services.map((service) => (
              <li key={service.id} style={{ paddingLeft: `${(service.depth - 1) * 1.25}rem` }}>
                <Link href={service.landingPath || service.path} className="hover:underline">
                  {service.landingPath ? `${service.name} in ${area.name}` : service.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {childAreas.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mt-8 mb-3">Areas We Serve in {area.name}</h2>
          <ul className="space-y-2">
            {childAreas.map((child) => (
              <li key={child.id}>
                <Link href={child.path} className="hover:underline">{child.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {alsoServing.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mt-8 mb-3">Also Serving Nearby</h2>
          {/* Named to prove coverage, deliberately never linked. */}
          <p className="text-slate-600">{alsoServing.join(' · ')}</p>
        </section>
      )}
    </Shell>
  );
}

/** `/<area-slug>/<pair-slug>` — a landing page. Its body is mandatory to publish. */
export function PairFallback({
  pair, service, area, servicePath, trail, h1, intro,
}: {
  pair: Pair;
  service: Service;
  area: ServiceArea;
  servicePath: string;
  trail: { name: string; path: string }[];
  h1: string;
  intro: string;
}) {
  const alsoServing = (area.also_serving || []).filter((entry) => entry.trim());

  return (
    <Shell>
      <Trail crumbs={[{ name: 'Home', path: '/' }, ...trail]} />
      <h1 className="text-4xl font-bold">{h1}</h1>
      {intro && <p className="text-lg text-slate-600">{intro}</p>}
      {Array.isArray(pair.body) && pair.body.length > 0 && (
        <BlockNoteRenderer content={pair.body} />
      )}
      <p className="text-sm">
        <Link href={servicePath} className="hover:underline">More about {service.name}</Link>
        {' · '}
        <Link href={trail[0].path} className="hover:underline">Everything we do in {area.name}</Link>
      </p>
      {alsoServing.length > 0 && (
        <p className="text-sm text-slate-500">Also serving {alsoServing.join(' · ')}</p>
      )}
    </Shell>
  );
}

/** `/blog` */
export function BlogIndexFallback({ posts }: { posts: BlogPost[] }) {
  return (
    <Shell>
      <h1 className="text-4xl font-bold">Blog</h1>
      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="text-xl font-semibold hover:underline">
              {post.title}
            </Link>
            {post.excerpt && <p className="text-slate-600 mt-1">{post.excerpt}</p>}
          </li>
        ))}
      </ul>
      {posts.length === 0 && <p className="text-slate-500">No posts yet.</p>}
    </Shell>
  );
}

/** `/blog/<slug>` */
export function BlogPostFallback({ post }: { post: BlogPost }) {
  return (
    <Shell>
      <Trail crumbs={[{ name: 'Blog', path: '/blog' }, { name: post.title, path: `/blog/${post.slug}` }]} />
      <h1 className="text-4xl font-bold">{post.title}</h1>
      {post.excerpt && <p className="text-lg text-slate-600">{post.excerpt}</p>}
      {post.cover_image_url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={post.cover_image_url} alt={post.title} className="w-full rounded-xl" />
      )}
      {Array.isArray(post.content) && post.content.length > 0 && (
        <BlockNoteRenderer content={post.content} />
      )}
    </Shell>
  );
}
