import Link from 'next/link'
import type { AboutPageProps } from '@/types/template'
import { BusinessHours } from '@/components/shared/BusinessHours'

export function AboutPage({ businessInfo, serviceAreas, resolvedCopy, config }: AboutPageProps) {
  return (
    <div className="bg-[var(--sf-surface)]">
      <div className="bg-gray-50 py-16 px-6 border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {resolvedCopy.heading}
          </h1>
          <p className="text-xl text-[var(--sf-brand)] font-semibold">
            {businessInfo.business_name}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Left Column: About Copy */}
          <div>
            <h2 className="font-heading text-3xl font-bold mb-6 text-gray-900">Who We Are</h2>
            <div className="prose prose-lg text-gray-700">
              <p className="whitespace-pre-line leading-relaxed">{businessInfo.short_description}</p>
            </div>
            
            <div className="mt-10 grid grid-cols-2 gap-6">
              {businessInfo.year_established > 0 && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <div className="text-3xl font-bold text-[var(--sf-brand)] mb-2">{businessInfo.year_established}</div>
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Year Established</div>
                </div>
              )}
              {businessInfo.employee_count && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <div className="text-3xl font-bold text-[var(--sf-brand)] mb-2">{businessInfo.employee_count}</div>
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Team Members</div>
                </div>
              )}
            </div>

            {businessInfo.license_number && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-4">
                <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                  <h4 className="font-semibold text-blue-900">Fully Licensed</h4>
                  <p className="text-sm text-blue-700">License #{businessInfo.license_number}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Details & Hours */}
          <div className="space-y-10">
            {/* Hours */}
            <div className="bg-[var(--sf-surface)] rounded-2xl shadow-xl border border-gray-100 p-8">
              <h3 className="font-heading text-2xl font-bold text-gray-900 mb-6">Business Hours</h3>
              <BusinessHours hours={businessInfo.hours} className="text-gray-700" />
              {businessInfo.emergency_service && businessInfo.emergency_service !== 'No' && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-red-600 font-semibold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    Emergency Service: {businessInfo.emergency_service}
                  </div>
                </div>
              )}
            </div>

            {/* Service Areas */}
            {serviceAreas?.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <h3 className="font-heading text-2xl font-bold text-gray-900 mb-6">Areas We Serve</h3>
                <ul className="grid grid-cols-2 gap-3">
                  {serviceAreas?.map((area) => (
                    <li key={area.id}>
                      <Link href={`/${area.slug}`} className="text-gray-600 hover:text-[var(--sf-brand)] font-medium flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--sf-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
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