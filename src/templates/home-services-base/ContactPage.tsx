import type { ContactPageProps } from '@/types/template'
import { ContactForm } from '@/components/shared/ContactForm'
import { BusinessHours } from '@/components/shared/BusinessHours'

export function ContactPage({ businessInfo, resolvedCopy, config }: ContactPageProps) {
  
  // Safe helper to convert a share URL to an embed URL if possible, or fallback to an external link
  const getEmbedUrl = (url: string) => {
    if (!url) return null
    if (url.includes('pb=!1m18')) return url // Already an embed URL
    return null // We will just show a link if we can't reliably embed it
  }
  
  const embedUrl = getEmbedUrl(businessInfo.google_maps_url)

  return (
    <div className="bg-[var(--tribe-surface)]">
      {/* Header */}
      <div className="bg-gray-50 py-16 px-6 border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {resolvedCopy.contact_heading}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {resolvedCopy.subheading}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Left Column: Contact Form */}
          <div>
            <div className="bg-[var(--tribe-surface)] rounded-2xl shadow-xl border border-gray-100 p-8">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8">Send Us a Message</h2>
              <ContactForm source="contact_page" />
            </div>
          </div>

          {/* Right Column: Contact Info & Map */}
          <div className="space-y-10">
            {/* Direct Contact Info */}
            <div className="grid sm:grid-cols-2 gap-6">
              {businessInfo.phone && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <div className="w-12 h-12 bg-[var(--tribe-surface)] rounded-full flex items-center justify-center text-[var(--tribe-brand)] mb-4 shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                  <a href={`tel:${businessInfo.phone}`} className="text-lg text-[var(--tribe-brand)] hover:underline font-medium">
                    {businessInfo.phone}
                  </a>
                </div>
              )}
              {businessInfo.email && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <div className="w-12 h-12 bg-[var(--tribe-surface)] rounded-full flex items-center justify-center text-[var(--tribe-brand)] mb-4 shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <a href={`mailto:${businessInfo.email}`} className="text-lg text-[var(--tribe-brand)] hover:underline font-medium break-words">
                    {businessInfo.email}
                  </a>
                </div>
              )}
            </div>

            {/* Address & Map */}
            {businessInfo.address && (
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <h3 className="font-heading text-2xl font-bold text-gray-900 mb-4">Location</h3>
                <p className="text-gray-700 text-lg mb-6 flex items-start gap-3">
                  <svg className="w-6 h-6 text-[var(--tribe-brand)] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  {businessInfo.address}
                </p>
                {embedUrl ? (
                  <div className="rounded-xl overflow-hidden shadow-sm h-64 relative">
                    <iframe 
                      src={embedUrl} 
                      className="absolute inset-0 w-full h-full border-0" 
                      allowFullScreen 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : businessInfo.google_maps_url ? (
                  <a href={businessInfo.google_maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--tribe-surface)] border border-gray-200 rounded-lg text-[var(--tribe-brand)] font-semibold hover:bg-gray-50 transition-colors">
                    View on Google Maps
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>
                ) : null}
              </div>
            )}

            {/* Hours */}
            <div className="bg-[var(--tribe-surface)] p-8 rounded-2xl border border-gray-200">
              <h3 className="font-heading text-2xl font-bold text-gray-900 mb-6">Business Hours</h3>
              <BusinessHours hours={businessInfo.hours} className="text-gray-700" />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}