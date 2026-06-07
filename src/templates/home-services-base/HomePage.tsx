import Link from 'next/link'
import type { HomePageProps } from '@/types/template'
import { ContactForm } from '@/components/shared/ContactForm'
import { StarRating } from '@/components/shared/StarRating'
import { resolveImage, getMediaFileUrl } from '@/lib/images'

export function HomePage({ businessInfo, resolvedCopy, services, serviceAreas, testimonials, media, config }: HomePageProps) {
  const heroMedia = media?.find(m => m.category === 'hero');
  const heroImage = resolveImage('hero_bg', getMediaFileUrl(heroMedia), config);

  return (
    <div>
      {/* Hero */}
      <section className="relative py-28 md:py-40 bg-gray-900 text-white overflow-hidden">
        {heroImage && (
          <>
            <div className="absolute inset-0 z-0">
              <img
                src={heroImage}
                alt="Hero background"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gray-900/70" />
          </>
        )}
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            {resolvedCopy.hero_h1}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-200 max-w-2xl">
            {resolvedCopy.hero_subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/contact" className="px-8 py-3.5 bg-[#2D6A4F] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
              {resolvedCopy.cta_primary}
            </Link>
            {businessInfo.phone && (
              <a href={`tel:${businessInfo.phone}`} className="px-8 py-3.5 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                {resolvedCopy.cta_secondary}
              </a>
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
                    <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center text-2xl mb-6 text-[#2D6A4F]">
                      {s.icon}
                    </div>
                  )}
                  <h3 className="font-heading font-bold text-xl text-gray-900 mb-3">{s.name}</h3>
                  {s.short_description && <p className="text-gray-600 mb-6 flex-1">{s.short_description}</p>}
                  <div className="mt-auto font-semibold text-[#2D6A4F] group-hover:underline">
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

      {/* Niche Details */}
      {businessInfo.niche_attributes && Object.keys(businessInfo.niche_attributes).length > 0 && (
        <section className="py-16 px-6 bg-white border-y border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Object.entries(businessInfo.niche_attributes).map(([key, value]) => {
                if (!value || typeof value !== 'string' || value.startsWith('http') || value.startsWith('/api')) return null;
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return (
                  <div key={key} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
                    <p className="text-xl font-bold text-gray-900">{value === 'true' ? 'Yes' : value === 'false' ? 'No' : value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials?.length > 0 && (
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
      {serviceAreas?.length > 0 && (
        <section className="py-24 px-6 bg-gray-50 border-y border-gray-200">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-12">Areas We Serve</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {serviceAreas?.map(a => (
                <Link key={a.id} href={`/${a.slug}`} className="px-6 py-3 bg-white border border-gray-200 rounded-full font-medium text-gray-700 hover:text-[#2D6A4F] hover:border-[#2D6A4F] hover:shadow-md transition-all duration-200">
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
            <ContactForm source="hero_cta" ctaLabel="Get a Free Quote" />
          </div>
        </div>
      </section>
    </div>
  )
}