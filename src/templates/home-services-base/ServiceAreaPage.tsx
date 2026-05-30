import Link from 'next/link'
import type { ServiceAreaProps } from '@/types/template'
import { BlockNoteRenderer } from '@/components/shared/BlockNoteRenderer'

export function ServiceAreaPage({ area, businessInfo, resolvedCopy, services, config }: ServiceAreaProps) {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-gray-900 text-white py-20 px-6 border-b-8 border-[var(--color-accent)]">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {resolvedCopy.h1}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {resolvedCopy.intro}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-3 gap-16">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            {area.page_content ? (
              <div className="prose prose-lg prose-[var(--color-accent)] max-w-none">
                <BlockNoteRenderer content={area.page_content} />
              </div>
            ) : (
              <p className="text-gray-500 italic">Information about this service area is coming soon.</p>
            )}

            {/* CTA Banner Inline */}
            <div className="mt-16 bg-[var(--color-accent)] text-white p-10 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h3 className="font-heading text-2xl font-bold mb-2">Need Service in {area.name}?</h3>
                <p className="text-white/90">Contact {businessInfo.business_name} today.</p>
              </div>
              <div className="shrink-0 flex gap-4">
                {businessInfo.phone && (
                  <a href={`tel:${businessInfo.phone}`} className="px-6 py-3 bg-white text-[var(--color-accent)] font-bold rounded-lg hover:bg-gray-100 transition-colors">
                    Call {businessInfo.phone}
                  </a>
                )}
                <Link href="/contact" className="px-6 py-3 border-2 border-white/30 text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Services Offered */}
            {services.length > 0 && (
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <h3 className="font-heading text-xl font-bold text-gray-900 mb-6">Services Offered in {area.name}</h3>
                <div className="space-y-4">
                  {services.map((service) => (
                    <Link 
                      key={service.id} 
                      href={`/services/${service.slug}`} 
                      className="group flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-[var(--color-accent)] hover:shadow-md transition-all"
                    >
                      {service.icon && (
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl text-[var(--color-accent)] shrink-0">
                          {service.icon}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-[var(--color-accent)] transition-colors">{service.name}</h4>
                        {service.short_description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.short_description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}