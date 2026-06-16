import type { HomePageProps } from '@/types/template';
import Link from 'next/link';
import { styles } from './theme';
import { StarRating } from '@/components/shared/StarRating';
import { ContactForm } from '@/components/shared/ContactForm';
import { BeforeAfterSlider } from '@/components/shared/BeforeAfterSlider';
import { User } from 'lucide-react';
import { resolveImage, getMediaFileUrl } from '@/lib/images';

export function HomePage({
  businessInfo,
  resolvedCopy,
  services,
  serviceAreas,
  testimonials,
  media,
  beforeAfterPairs,
  config,
}: HomePageProps) {
  const heroMedia = media.find(m => m.category === 'hero');
  const heroImage = resolveImage('hero_bg', getMediaFileUrl(heroMedia), config);
  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-28 md:py-40 bg-[var(--tribe-bg)] text-[var(--tribe-text)] overflow-hidden">
        {heroImage && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-[var(--tribe-bg)]/70" />
        <div className={`${styles.container} relative z-10`}>
          <div className="max-w-3xl">
            <h1 className={`${styles.headingBase} text-5xl md:text-6xl font-bold mb-6 text-[var(--tribe-text)]`}>
              {resolvedCopy.hero_h1}
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-slate-200">
              {resolvedCopy.hero_subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact" className={styles.buttonPrimary}>
                {resolvedCopy.cta_primary}
              </Link>
              <a href={`tel:${businessInfo.phone}`} className="bg-[var(--tribe-surface)]/10 hover:bg-[var(--tribe-surface)]/20 text-[var(--tribe-text)] px-6 py-3 rounded-lg font-medium inline-flex items-center justify-center transition-colors">
                {resolvedCopy.cta_secondary}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      {services.length > 0 && (
        <section className="py-24 bg-[var(--tribe-surface)]">
          <div className={styles.container}>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className={`${styles.headingBase} text-3xl md:text-4xl font-bold mb-4`}>Our Services</h2>
              <p className="text-lg text-[var(--tribe-text)]">Professional solutions tailored to your needs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map(service => (
                <Link key={service.id} href={`/services/${service.slug}`} className="group block p-8 rounded-2xl bg-[var(--tribe-surface)] hover:bg-[var(--tribe-surface)] hover:shadow-xl border border-[var(--tribe-border)] hover:border-[var(--tribe-border)] transition-all">
                  <div className="w-12 h-12 bg-[var(--tribe-surface)] rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm group-hover:scale-110 transition-transform text-[var(--tribe-brand)]">
                    {service.icon || '✦'}
                  </div>
                  <h3 className={`${styles.headingBase} text-xl font-bold mb-3 group-hover:text-[var(--tribe-brand)] transition-colors`}>{service.name}</h3>
                  <p className="text-[var(--tribe-text)]">{service.short_description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Snippet */}
      <section className="py-24 bg-[var(--tribe-surface)] border-y border-[var(--tribe-border)]">
        <div className={`${styles.container} grid md:grid-cols-2 gap-12 items-center`}>
          <div>
            <h2 className={`${styles.headingBase} text-3xl md:text-4xl font-bold mb-6`}>{resolvedCopy.about_heading}</h2>
            <p className="text-lg text-[var(--tribe-text)] mb-8 leading-relaxed">{businessInfo.short_description}</p>
            {businessInfo.year_established > 0 && (
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-[var(--tribe-surface)] rounded-lg border border-[var(--tribe-border)] font-medium text-[var(--tribe-brand)] shadow-sm">
                <span>🏆</span>
                Serving {businessInfo.city} since {businessInfo.year_established}
              </div>
            )}
          </div>
          <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 relative">
            {/* If there is a gallery image, use it, otherwise placeholder */}
            {media.find(m => m.category === 'gallery')?.file ? (
              <img src={getMediaFileUrl(media.find(m => m.category === 'gallery'))} alt="About Us" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-[var(--tribe-text-muted)]">Image Placeholder</div>
            )}
          </div>
        </div>
      </section>

      {/* Niche Details */}
      {businessInfo.niche_attributes && Object.keys(businessInfo.niche_attributes).length > 0 && (
        <section className="py-16 bg-[var(--tribe-surface)] border-b border-[var(--tribe-border)]">
          <div className={styles.container}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {Object.entries(businessInfo.niche_attributes).map(([key, value]) => {
                if (!value || typeof value !== 'string' || value.startsWith('http') || value.startsWith('/api')) return null;
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return (
                  <div key={key} className="bg-[var(--tribe-surface)] rounded-xl p-6 border border-[var(--tribe-border)] flex flex-col justify-center">
                    <h4 className="text-sm font-medium text-[var(--tribe-text-muted)] uppercase tracking-wider mb-2">{label}</h4>
                    <p className="text-xl font-bold text-[var(--tribe-heading)]">{value === 'true' ? 'Yes' : value === 'false' ? 'No' : value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Before/After Portfolio */}
      {beforeAfterPairs && beforeAfterPairs.length > 0 && (
        <section className="py-24 bg-[var(--tribe-surface)] border-b border-[var(--tribe-border)]">
          <div className={styles.container}>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className={`${styles.headingBase} text-3xl md:text-4xl font-bold mb-4`}>Our Work</h2>
              <p className="text-lg text-[var(--tribe-text)]">See the difference we make with our before and after gallery.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {beforeAfterPairs.map(pair => (
                <div key={pair.id} className="bg-[var(--tribe-surface)] p-6 rounded-2xl border border-[var(--tribe-border)] shadow-sm">
                  <BeforeAfterSlider 
                    beforeImage={pair.before_image_url} 
                    afterImage={pair.after_image_url} 
                  />
                  <div className="mt-6 text-center">
                    <h3 className={`${styles.headingBase} text-xl font-bold mb-2 text-[var(--tribe-heading)]`}>{pair.title}</h3>
                    {pair.description && <p className="text-[var(--tribe-text)] text-sm">{pair.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-24 bg-[var(--tribe-surface)]">
          <div className={styles.container}>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className={`${styles.headingBase} text-3xl md:text-4xl font-bold mb-4`}>What Our Clients Say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map(testimonial => (
                <div key={testimonial.id} className="p-8 rounded-2xl bg-[var(--tribe-surface)] border border-[var(--tribe-border)] shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <StarRating rating={testimonial.rating} />
                    {testimonial.source !== 'manual' && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider">
                        {testimonial.source}
                      </span>
                    )}
                  </div>
                  
                  {testimonial.title && (
                    <h3 className="font-bold text-lg text-[var(--tribe-heading)] mb-2">{testimonial.title}</h3>
                  )}
                  
                  <p className="text-[var(--tribe-text)] italic flex-1">"{testimonial.content}"</p>
                  
                  <div className="mt-8 pt-6 border-t border-[var(--tribe-border)] flex items-center gap-4">
                    {testimonial.author_photo_url ? (
                      <img src={testimonial.author_photo_url} alt={testimonial.author_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[var(--tribe-text-muted)]">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-[var(--tribe-heading)] leading-tight">{testimonial.author_name}</p>
                      {testimonial.author_location && <p className="text-sm text-[var(--tribe-text-muted)] mt-1">{testimonial.author_location}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Service Areas */}
      {serviceAreas.length > 0 && (
        <section className="py-24 bg-[var(--tribe-bg)] text-[var(--tribe-text)]">
          <div className={styles.container}>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className={`${styles.headingBase} text-[var(--tribe-text)] text-3xl md:text-4xl font-bold mb-4`}>Areas We Serve</h2>
              <p className="text-[var(--tribe-text-muted)] text-lg">Providing top-quality service across the region.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {serviceAreas.map(area => (
                <Link key={area.id} href={`/${area.slug}`} className="px-6 py-3 rounded-full bg-[var(--tribe-surface-alt)] hover:bg-slate-700 border border-[var(--tribe-border)] transition-colors font-medium">
                  {area.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="py-24 bg-[var(--tribe-surface)]">
        <div className={`${styles.container} max-w-4xl`}>
          <div className="bg-[var(--tribe-surface)] rounded-3xl p-8 md:p-12 border border-[var(--tribe-border)] shadow-xl">
            <div className="text-center mb-10">
              <h2 className={`${styles.headingBase} text-3xl md:text-4xl font-bold mb-4`}>Ready to Get Started?</h2>
              <p className="text-[var(--tribe-text)] text-lg">Contact us today for a free estimate or consultation.</p>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
