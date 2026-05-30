import Link from 'next/link'
import Image from 'next/image'
import type { HomePageProps } from '@/types/template'
import { ContactForm } from '@/components/shared/ContactForm'
import { StarRating } from '@/components/shared/StarRating'

export function HomePage({ businessInfo, resolvedCopy, services, serviceAreas, testimonials, media, config }: HomePageProps) {
  const showTestimonials = (config['show_testimonials_on_homepage'] as boolean) ?? true
  const showAreas = (config['show_service_areas_on_homepage'] as boolean) ?? true
  const heroStyle = (config['hero_style'] as string) ?? 'fullwidth'

  const heroMedia = media?.find(m => m.category === 'hero')

  return (
    <div>
      {/* Hero */}
      <section className={`relative ${heroStyle === 'fullwidth' && heroMedia?.url ? 'py-32' : 'py-20'} bg-gray-50 flex items-center`}>
        {heroStyle === 'fullwidth' && heroMedia?.url && (
          <div className="absolute inset-0 z-0">
            <Image src={heroMedia.url} alt={heroMedia.alt_text || 'Hero background'} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gray-900/70" />
          </div>
        )}
        <div className={`relative z-10 max-w-6xl mx-auto px-6 ${heroStyle === 'centered' ? 'text-center' : ''} ${heroStyle === 'fullwidth' && heroMedia?.url ? 'text-white' : 'text-gray-900'}`}>
          <div className={`${heroStyle === 'split' ? 'grid md:grid-cols-2 gap-12 items-center' : ''}`}>
            <div>
              <h1 className={`font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight ${heroStyle === 'centered' ? 'mx-auto max-w-3xl' : ''}`}>
                {resolvedCopy.hero_h1}
              </h1>
              <p className={`mt-6 text-lg md:text-xl ${heroStyle === 'fullwidth' && heroMedia?.url ? 'text-gray-200' : 'text-gray-600'} ${heroStyle === 'centered' ? 'mx-auto max-w-2xl' : ''}`}>
                {resolvedCopy.hero_subtitle}
              </p>
              <div className={`mt-8 flex flex-wrap gap-4 ${heroStyle === 'centered' ? 'justify-center' : ''}`}>
                <Link href="/contact" className="px-8 py-3.5 bg-[var(--color-accent)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
                  {resolvedCopy.cta_primary}
                </Link>
                {businessInfo.phone && (
                  <a href={`tel:${businessInfo.phone}`} className={`px-8 py-3.5 border-2 border-[var(--color-accent)] font-semibold rounded-lg transition-colors ${heroStyle === 'fullwidth' && heroMedia?.url ? 'text-white hover:bg-[var(--color-accent)]' : 'text-[var(--color-accent)] hover:bg-gray-50'}`}>
                    {resolvedCopy.cta_secondary}
                  </a>
                )}
              </div>
            </div>
            {heroStyle === 'split' && heroMedia?.url && (
              <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-xl">
                <Image src={heroMedia.url} alt={heroMedia.alt_text || 'Hero image'} fill className="object-cover" priority />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      {services?.length > 0 && (
        <section className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900">Our Services</h2>
              <p className="mt-4 text-gray-600">Professional solutions for your home and business.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services?.map(s => (
                <Link key={s.id} href={`/services/${s.slug}`} className="group flex flex-col h-full bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl hover:border-gray-200 transition-all duration-300">
                  {s.icon && (
                    <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center text-2xl mb-6 text-[var(--color-accent)]">
                      {s.icon}
                    </div>
                  )}
                  <h3 className="font-heading font-bold text-xl text-gray-900 mb-3">{s.name}</h3>
                  {s.short_description && <p className="text-gray-600 mb-6 flex-1">{s.short_description}</p>}
                  <div className="mt-auto font-semibold text-[var(--color-accent)] group-hover:underline">
                    Learn more &rarr;
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Snippet */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-6">{resolvedCopy.about_heading}</h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">{businessInfo.short_description}</p>
          {businessInfo.year_established > 0 && (
            <p className="inline-block px-4 py-2 bg-white rounded-full text-sm font-semibold text-gray-800 shadow-sm border border-gray-100">
              Proudly serving since {businessInfo.year_established}
            </p>
          )}
        </div>
      </section>

      {/* Testimonials */}
      {showTestimonials && testimonials?.length > 0 && (
        <section className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">What Our Customers Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials?.map(t => (
                <div key={t.id} className="bg-gray-50 rounded-2xl p-8">
                  <StarRating rating={t.rating} size="sm" />
                  <p className="mt-6 text-gray-700 italic">"{t.content}"</p>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="font-semibold text-gray-900">{t.author_name}</p>
                    {t.author_location && <p className="text-sm text-gray-500">{t.author_location}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Service Areas */}
      {showAreas && serviceAreas?.length > 0 && (
        <section className="py-24 px-6 bg-gray-50 border-y border-gray-200">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-12">Areas We Serve</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {serviceAreas?.map(a => (
                <Link key={a.id} href={`/${a.slug}`} className="px-6 py-3 bg-white border border-gray-200 rounded-full font-medium text-gray-700 hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:shadow-md transition-all duration-200">
                  {a.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Form CTA */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-gray-600">Contact us today for a free estimate or to schedule service.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  )
}