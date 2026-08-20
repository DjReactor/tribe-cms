import type { ServiceDetailProps } from '@/types/template';
import { styles } from './theme';
import { BlockNoteRenderer } from '@/components/shared/BlockNoteRenderer';
import { BeforeAfterSlider } from '@/components/shared/BeforeAfterSlider';
import Link from 'next/link';
import { Phone, CheckCircle2 } from 'lucide-react';

export function ServiceDetailPage({
  service,
  serviceTrail,
  childServices,
  businessInfo,
  serviceAreas,
  beforeAfterPairs,
}: ServiceDetailProps) {
  return (
    <article className="bg-[var(--tribe-surface)]">
      {/* Hero */}
      <div className="bg-[var(--tribe-bg)] text-[var(--tribe-text)] py-20 lg:py-28">
        <div className={styles.container}>
          <div className="max-w-4xl">
            {/* The trail mirrors the JSON-LD BreadcrumbList emitted by the route,
                so what a visitor sees matches what Google is told. The last
                crumb is this page, so it is rendered as plain text. */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--tribe-text-muted)]">
                <li>
                  <Link href="/services" className="hover:text-[var(--tribe-brand)] transition-colors">
                    Services
                  </Link>
                </li>
                {serviceTrail.map((crumb, i) => (
                  <li key={crumb.path} className="flex items-center gap-2">
                    <span aria-hidden="true">/</span>
                    {i === serviceTrail.length - 1 ? (
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

            <h1 className={`${styles.headingBase} text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[var(--tribe-text)]`}>
              {service.name}
            </h1>
            {service.short_description && (
              <p className="text-xl md:text-2xl text-slate-300 leading-relaxed">
                {service.short_description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-20 py-16">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            {service.cover_image_url && (
              <div className="rounded-3xl overflow-hidden mb-12 shadow-md">
                <img src={service.cover_image_url} alt={service.name} className="w-full h-auto" />
              </div>
            )}
            
            <div className="prose prose-lg prose-slate max-w-none">
              {service.page_content ? (
                <BlockNoteRenderer content={service.page_content} />
              ) : (
                <p className="lead">{service.short_description}</p>
              )}
            </div>

            {childServices.length > 0 && (
              <div className="mt-16 border-t border-[var(--tribe-border)] pt-16">
                <h2 className={`${styles.headingBase} text-3xl font-bold mb-8 text-[var(--tribe-heading)]`}>
                  {service.name} Services
                </h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {childServices.map(child => (
                    <Link
                      key={child.id}
                      href={child.path}
                      className="group p-6 rounded-2xl border border-[var(--tribe-border)] hover:border-[var(--tribe-brand)] hover:shadow-md transition-all"
                    >
                      <h3 className="font-bold text-xl text-[var(--tribe-heading)] mb-2 group-hover:text-[var(--tribe-brand)] transition-colors">
                        {child.name}
                      </h3>
                      {child.short_description && (
                        <p className="text-[var(--tribe-text)] text-sm">{child.short_description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {beforeAfterPairs && beforeAfterPairs.length > 0 && (
              <div className="mt-16 border-t border-[var(--tribe-border)] pt-16">
                <h2 className={`${styles.headingBase} text-3xl font-bold mb-8 text-[var(--tribe-heading)]`}>See Our Work</h2>
                <div className="grid gap-8">
                  {beforeAfterPairs.map(pair => (
                    <div key={pair.id} className="bg-[var(--tribe-surface)] p-6 rounded-2xl border border-[var(--tribe-border)] shadow-sm">
                      <BeforeAfterSlider 
                        beforeImage={pair.before_image_url} 
                        afterImage={pair.after_image_url} 
                      />
                      <div className="mt-6 text-center">
                        <h3 className="text-xl font-bold mb-2 text-[var(--tribe-heading)]">{pair.title}</h3>
                        {pair.description && <p className="text-[var(--tribe-text)]">{pair.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-8">
              
              {/* CTA Box */}
              <div className="bg-[var(--tribe-surface)] p-8 rounded-3xl border border-[var(--tribe-border)] text-center">
                <h3 className="font-bold text-2xl text-[var(--tribe-heading)] mb-4">Need this service?</h3>
                <p className="text-[var(--tribe-text)] mb-8">Contact us today for a free estimate and expert advice.</p>
                
                {businessInfo.phone && (
                  <a href={`tel:${businessInfo.phone}`} className={`${styles.buttonPrimary} w-full mb-4 shadow-md`}>
                    <Phone className="w-5 h-5 mr-2" />
                    Call {businessInfo.phone}
                  </a>
                )}
                
                <Link href="/contact" className={`${styles.buttonSecondary} w-full bg-[var(--tribe-surface)]`}>
                  Request a Quote
                </Link>
              </div>

              {/* Where we do this work.

                  `landingPath` is this service's landing page in that area, or
                  null when nobody wrote one. The rule is uniform and is the
                  whole point of the prop: a path is a link, a null is text.
                  Never substitute the area hub for a missing pair — pointing
                  every town at a generic page from every service page is a
                  topical mismatch, not internal linking. Writing the pair later
                  turns the text into a link with no edit here. */}
              {serviceAreas.length > 0 && (
                <div className="bg-[var(--tribe-surface)] p-8 rounded-3xl border border-[var(--tribe-border)]">
                  <h3 className="font-bold text-xl text-[var(--tribe-heading)] mb-6">
                    Where We Offer {service.name}
                  </h3>
                  <ul className="space-y-4">
                    {serviceAreas.map(area => (
                      <li key={area.id} className="flex items-center text-[var(--tribe-text)]">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-[var(--tribe-brand)] shrink-0" />
                        {area.landingPath ? (
                          <Link href={area.landingPath} className="font-medium hover:text-[var(--tribe-brand)] transition-colors">
                            {service.name} in {area.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{area.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
            </div>
          </div>

        </div>
      </div>
    </article>
  );
}
