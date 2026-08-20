import type { PairPageProps } from '@/types/template';
import { styles } from './theme';
import { BlockNoteRenderer } from '@/components/shared/BlockNoteRenderer';
import { StarRating } from '@/components/shared/StarRating';
import Link from 'next/link';
import { Phone, MapPin } from 'lucide-react';

/**
 * A landing page for one service in one area, at `/{area.slug}/{pair.slug}`.
 *
 * The body is the reason the page exists — these records cannot be published
 * without one — so it leads, and everything else on the page is proof around
 * it: work done here, reviews from here, the places nearby this area covers.
 */
export function PairPage({
  pair,
  service,
  area,
  servicePath,
  trail,
  businessInfo,
  resolvedCopy,
  localProjects,
  localTestimonials,
  services,
}: PairPageProps) {
  const alsoServing = (area.also_serving || []).filter(entry => entry.trim());
  const areaLabel = area.stateRecord?.code ? `${area.name}, ${area.stateRecord.code}` : area.name;
  // Other landing pages in this same area — real pages only, never a
  // fabricated URL for a combination nobody wrote.
  const siblingPages = services.filter(s => s.landingPath && s.id !== service.id);

  return (
    <article className="bg-[var(--tribe-surface)]">
      {/* Hero */}
      <div className="bg-[var(--tribe-bg)] py-20 lg:py-28 border-b border-[var(--tribe-border)]">
        <div className={styles.container}>
          {/* Home › Area › this page — the same list the route emits as
              BreadcrumbList JSON-LD. */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--tribe-text-muted)]">
              <li>
                <Link href="/" className="hover:text-[var(--tribe-brand)] transition-colors">Home</Link>
              </li>
              {trail.map((crumb, i) => (
                <li key={crumb.path} className="flex items-center gap-2">
                  <span aria-hidden="true">/</span>
                  {i === trail.length - 1 ? (
                    <span aria-current="page" className="text-[var(--tribe-text)]">{crumb.name}</span>
                  ) : (
                    <Link href={crumb.path} className="hover:text-[var(--tribe-brand)] transition-colors">
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--tribe-brand)] mb-4">
              <MapPin className="w-4 h-4" />
              {areaLabel}
            </div>
            <h1 className={`${styles.headingBase} text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[var(--tribe-heading)]`}>
              {resolvedCopy.h1}
            </h1>
            <p className="text-xl md:text-2xl text-[var(--tribe-text)] leading-relaxed">
              {resolvedCopy.intro}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-20 py-16">

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="prose prose-lg prose-slate max-w-none">
              {pair.body && <BlockNoteRenderer content={pair.body} />}
            </div>

            {/* Auto-pulled: work matching BOTH this service and this area. */}
            {localProjects.length > 0 && (
              <div className="mt-16 border-t border-[var(--tribe-border)] pt-16">
                <h2 className={`${styles.headingBase} text-3xl font-bold text-[var(--tribe-heading)] mb-8`}>
                  {service.name} We&rsquo;ve Done in {area.name}
                </h2>
                <div className="grid sm:grid-cols-2 gap-8">
                  {localProjects.slice(0, 4).map(project => (
                    <Link key={project.id} href={`/projects/${project.slug}`} className="group block rounded-2xl overflow-hidden border border-[var(--tribe-border)] hover:shadow-lg transition-all">
                      {project.cover_image_url && (
                        <img src={project.cover_image_url} alt={project.title} className="w-full h-48 object-cover" />
                      )}
                      <div className="p-6">
                        <h3 className="font-bold text-lg text-[var(--tribe-heading)] mb-2 group-hover:text-[var(--tribe-brand)] transition-colors">
                          {project.title}
                        </h3>
                        {project.summary && <p className="text-[var(--tribe-text)] text-sm">{project.summary}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-pulled: reviews whose location names this area. */}
            {localTestimonials.length > 0 && (
              <div className="mt-16 border-t border-[var(--tribe-border)] pt-16">
                <h2 className={`${styles.headingBase} text-3xl font-bold text-[var(--tribe-heading)] mb-8`}>
                  Reviews from {area.name}
                </h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {localTestimonials.slice(0, 4).map(testimonial => (
                    <blockquote key={testimonial.id} className="p-6 rounded-2xl border border-[var(--tribe-border)]">
                      {testimonial.rating > 0 && <StarRating rating={testimonial.rating} />}
                      <p className="text-[var(--tribe-text)] my-4">{testimonial.content}</p>
                      <footer className="text-sm font-medium text-[var(--tribe-heading)]">
                        {testimonial.author_name}
                        {testimonial.author_location && (
                          <span className="text-[var(--tribe-text-muted)] font-normal"> — {testimonial.author_location}</span>
                        )}
                      </footer>
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-8">

              <div className="bg-[var(--tribe-brand)] text-[var(--tribe-brand-text)] p-8 rounded-3xl shadow-xl text-center">
                <h2 className="font-bold text-2xl mb-4">{service.name} in {area.name}</h2>
                <p className="text-[var(--tribe-text)]/80 mb-8">Talk to a local team that has done this work here.</p>

                {businessInfo.phone && (
                  <a href={`tel:${businessInfo.phone}`} className="w-full bg-[var(--tribe-surface)] text-[var(--tribe-brand)] transition-colors px-6 py-4 rounded-xl font-bold inline-flex items-center justify-center mb-4 shadow-md">
                    <Phone className="w-5 h-5 mr-2" />
                    {businessInfo.phone}
                  </a>
                )}

                <Link href="/contact" className="w-full border-2 border-white/30 hover:border-white transition-colors text-[var(--tribe-text)] px-6 py-4 rounded-xl font-bold inline-flex items-center justify-center">
                  Request a Quote
                </Link>
              </div>

              {/* Up to the two pages this one sits between: the service
                  everywhere, and everything we do in this area. Both are real
                  pages, so both are plain links. */}
              <div className="bg-[var(--tribe-surface)] p-8 rounded-3xl border border-[var(--tribe-border)]">
                <h2 className="font-bold text-xl text-[var(--tribe-heading)] mb-4">More Detail</h2>
                <ul className="space-y-3 text-[var(--tribe-text)]">
                  <li>
                    <Link href={servicePath} className="hover:text-[var(--tribe-brand)] transition-colors">
                      All about {service.name}
                    </Link>
                  </li>
                  <li>
                    <Link href={trail[0].path} className="hover:text-[var(--tribe-brand)] transition-colors">
                      Everything we do in {area.name}
                    </Link>
                  </li>
                </ul>
              </div>

              {siblingPages.length > 0 && (
                <div className="bg-[var(--tribe-surface)] p-8 rounded-3xl border border-[var(--tribe-border)]">
                  <h2 className="font-bold text-xl text-[var(--tribe-heading)] mb-4">Other Services in {area.name}</h2>
                  <ul className="space-y-3 text-[var(--tribe-text)]">
                    {siblingPages.map(sibling => (
                      <li key={sibling.id}>
                        <Link href={sibling.landingPath!} className="hover:text-[var(--tribe-brand)] transition-colors">
                          {sibling.name} in {area.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Named to prove coverage, deliberately never linked — these
                  places have no page, and giving them one is a decision the
                  agency makes by creating an area record. */}
              {alsoServing.length > 0 && (
                <div className="bg-[var(--tribe-surface)] p-8 rounded-3xl border border-[var(--tribe-border)]">
                  <h2 className="font-bold text-xl text-[var(--tribe-heading)] mb-4">Also Serving Nearby</h2>
                  <p className="text-[var(--tribe-text)] leading-relaxed">{alsoServing.join(' · ')}</p>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </article>
  );
}
