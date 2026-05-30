import Link from 'next/link'
import type { ServicesIndexProps } from '@/types/template'

export function ServicesIndexPage({ services, businessInfo, resolvedCopy, config }: ServicesIndexProps) {
  return (
    <div className="bg-white pb-24">
      {/* Header */}
      <div className="bg-gray-50 py-16 px-6 border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {resolvedCopy.heading}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {resolvedCopy.intro}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20">
        {!services || services.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Services Listed Yet</h2>
            <p className="text-gray-600">Please check back soon for our full list of services.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Link 
                key={service.id} 
                href={`/services/${service.slug}`} 
                className="group flex flex-col h-full bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                {service.icon && (
                  <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center text-3xl mb-8 text-[var(--color-accent)] group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                )}
                <h2 className="font-heading font-bold text-2xl text-gray-900 mb-4">{service.name}</h2>
                {service.short_description && (
                  <p className="text-gray-600 mb-8 flex-1 leading-relaxed">
                    {service.short_description}
                  </p>
                )}
                <div className="mt-auto flex items-center gap-2 font-semibold text-[var(--color-accent)] group-hover:gap-3 transition-all duration-300">
                  View Service Details
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6">
        <div className="bg-[var(--color-accent)] rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">Need a custom solution?</h2>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Contact us today to discuss your specific needs and receive a free, no-obligation estimate.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="px-8 py-4 bg-white text-[var(--color-accent)] font-bold rounded-lg hover:bg-gray-50 transition-colors">
              Get a Free Estimate
            </Link>
            {businessInfo.phone && (
              <a href={`tel:${businessInfo.phone}`} className="px-8 py-4 border-2 border-white/30 font-bold rounded-lg hover:bg-white/10 transition-colors">
                Call {businessInfo.phone}
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}