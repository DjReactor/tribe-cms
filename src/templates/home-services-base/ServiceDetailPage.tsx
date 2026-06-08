import Link from 'next/link'
import Image from 'next/image'
import type { ServiceDetailProps } from '@/types/template'
import { BlockNoteRenderer } from '@/components/shared/BlockNoteRenderer'
import { ContactForm } from '@/components/shared/ContactForm'

export function ServiceDetailPage({ service, businessInfo, serviceAreas, config }: ServiceDetailProps) {
  return (
    <div className="bg-[var(--sf-surface)]">
      {/* Hero Section */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--sf-brand)] hover:text-gray-900 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to All Services
              </Link>
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {service.icon && <span className="mr-4 text-[var(--sf-brand)] inline-block">{service.icon}</span>}
                {service.name}
              </h1>
              {service.short_description && (
                <p className="text-xl text-gray-600 leading-relaxed mb-8">
                  {service.short_description}
                </p>
              )}
              <div className="flex flex-wrap gap-4">
                <Link href="/contact" className="px-8 py-4 bg-[var(--sf-brand)] text-[var(--sf-brand-text)] font-bold rounded-lg hover:opacity-90 transition-opacity">
                  Get a Quote
                </Link>
                {businessInfo.phone && (
                  <a href={`tel:${businessInfo.phone}`} className="px-8 py-4 bg-[var(--sf-surface)] border border-gray-200 text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition-colors">
                    Call {businessInfo.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Cover Image */}
            {service.cover_image_url && (
              <div className="w-full md:w-1/2 lg:w-5/12 shrink-0">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-xl border border-gray-100">
                  <Image 
                    src={service.cover_image_url} 
                    alt={service.name} 
                    fill 
                    className="object-cover" 
                    priority 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-3 gap-16">
          
          <div className="lg:col-span-2">
            {service.page_content ? (
              <div className="prose prose-lg prose-[var(--sf-brand)] max-w-none">
                <BlockNoteRenderer content={service.page_content} />
              </div>
            ) : (
              <p className="text-gray-500 italic">Detailed information coming soon.</p>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-4">Request a Quote</h3>
              <p className="text-gray-600 mb-6">
                Get in touch with {businessInfo.business_name} for a free estimate on {service.name}.
              </p>
              <ContactForm source="service_cta" ctaLabel="Request a Quote" />
            </div>

            {serviceAreas?.length > 0 && (
              <div className="bg-[var(--sf-surface)] p-8 rounded-2xl border border-gray-200">
                <h3 className="font-heading text-xl font-bold text-gray-900 mb-4">Areas We Serve</h3>
                <ul className="space-y-3">
                  {serviceAreas.map((area) => (
                    <li key={area.id}>
                      <Link href={`/${area.slug}`} className="flex items-center gap-2 text-gray-600 hover:text-[var(--sf-brand)] transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        {area.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}