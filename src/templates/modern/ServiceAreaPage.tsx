import type { ServiceAreaProps } from '@/types/template';
import { styles } from './theme';
import { BlockNoteRenderer } from '@/components/shared/BlockNoteRenderer';
import { StarRating } from '@/components/shared/StarRating';
import Link from 'next/link';
import { MapPin, Phone, ArrowRight } from 'lucide-react';

export function ServiceAreaPage({
  area,
  areaTrail,
  childAreas,
  businessInfo,
  services,
  localProjects,
  localTestimonials,
  resolvedCopy,
}: ServiceAreaProps) {
  const alsoServing = (area.also_serving || []).filter(entry => entry.trim());
  const areaLabel = area.stateRecord?.code ? `${area.name}, ${area.stateRecord.code}` : area.name;

  return (
    <article className="bg-[var(--tribe-surface)]">
      {/* Hero */}
      <div className="bg-[var(--tribe-surface)] py-20 lg:py-28 border-b border-[var(--tribe-border)]">
        <div className={`${styles.container} text-center`}>
          {/* The trail mirrors the JSON-LD BreadcrumbList the route emits, so
              what a visitor sees matches what Google is told. Area URLs are
              flat, so this is the only place the hierarchy is visible. */}
          {areaTrail.length > 1 && (
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--tribe-text-muted)]">
                {areaTrail.map((crumb, i) => (
                  <li key={crumb.path} className="flex items-center gap-2">
                    {i > 0 && <span aria-hidden="true">/</span>}
                    {i === areaTrail.length - 1 ? (
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
          )}

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--tribe-brand)]/10 text-[var(--tribe-brand)] mb-8">
            <MapPin className="w-8 h-8" />
          </div>
          <div className="max-w-4xl mx-auto">
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
              {area.page_content && <BlockNoteRenderer content={area.page_content} />}
            </div>

            {/* Services in this area.

                `landingPath` is that service's landing page HERE, or null when
                nobody wrote one. A path is a link to the landing page; a null
                links the service's own page instead, which is a real page about
                that work — never a fabricated URL. */}
            {services.length > 0 && (
              <div className="mt-16">
                <h2 className={`${styles.headingBase} text-3xl font-bold text-[var(--tribe-heading)] mb-8`}>
                  Services We Offer in {area.name}
                </h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {services.map(service => (
                    <Link
                      key={service.id}
                      href={service.landingPath || service.path}
                      className="p-6 rounded-2xl border border-[var(--tribe-border)] hover:border-[var(--tribe-brand)] hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-2xl">{service.icon}</span>
                        <h3 className="font-bold text-lg text-[var(--tribe-heading)] group-hover:text-[var(--tribe-brand)] transition-colors">
                          {service.landingPath ? `${service.name} in ${area.name}` : service.name}
                        </h3>
                      </div>
                      <p className="text-[var(--tribe-text)] text-sm">{service.short_description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-pulled: work done in this area. On a site with no landing
                pages at all this is what makes the area page specific. */}
            {localProjects.length > 0 && (
              <div className="mt-16 border-t border-[var(--tribe-border)] pt-16">
                <h2 className={`${styles.headingBase} text-3xl font-bold text-[var(--tribe-heading)] mb-8`}>
                  Our Work in {area.name}
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
                  What {area.name} Says About Us
                </h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {localTestimonials.slice(0, 4).map(testimonial => (
                    <blockquote key={testimonial.id} className="p-6 rounded-2xl border border-[var(--tribe-border)] bg-[var(--tribe-surface)]">
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

            {/* Child areas — the tier below this one in the area tree. These
                have pages of their own, so they are links. */}
            {childAreas.length > 0 && (
              <div className="mt-16 border-t border-[var(--tribe-border)] pt-16">
                <h2 className={`${styles.headingBase} text-3xl font-bold text-[var(--tribe-heading)] mb-8`}>
                  Areas We Serve in {area.name}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {childAreas.map(child => (
                    <Link
                      key={child.id}
                      href={child.path}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--tribe-border)] hover:border-[var(--tribe-brand)] hover:text-[var(--tribe-brand)] transition-colors font-medium"
                    >
                      {child.name}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-8">
              <div className="bg-[var(--tribe-brand)] text-[var(--tribe-brand-text)] p-8 rounded-3xl shadow-xl text-center">
                <h2 className="font-bold text-2xl mb-4">Book Your Service in {areaLabel}</h2>
                <p className="text-[var(--tribe-brand-text)]/80 mb-8">Fast, reliable, and local experts ready to help.</p>

                {businessInfo.phone && (
                  <a href={`tel:${businessInfo.phone}`} className="w-full bg-[var(--tribe-surface)] text-[var(--tribe-brand)] hover:bg-[var(--tribe-surface)] transition-colors px-6 py-4 rounded-xl font-bold inline-flex items-center justify-center mb-4 shadow-md">
                    <Phone className="w-5 h-5 mr-2" />
                    {businessInfo.phone}
                  </a>
                )}

                <Link href="/contact" className="w-full border-2 border-[var(--tribe-brand-text)]/30 hover:border-[var(--tribe-brand-text)] transition-colors text-[var(--tribe-brand-text)] px-6 py-4 rounded-xl font-bold inline-flex items-center justify-center">
                  Contact Us Online
                </Link>
              </div>

              {/* `also_serving` is the tier BELOW the area tree: places named to
                  prove coverage and deliberately given no page. Render as plain
                  text — NEVER as links. Page-worthy means it should be its own
                  area record instead. */}
              {alsoServing.length > 0 && (
                <div className="bg-[var(--tribe-surface)] p-8 rounded-3xl border border-[var(--tribe-border)]">
                  <h2 className="font-bold text-xl text-[var(--tribe-heading)] mb-4">Also Serving Nearby</h2>
                  <p className="text-[var(--tribe-text)] leading-relaxed">
                    {alsoServing.join(' · ')}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </article>
  );
}
