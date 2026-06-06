import Image from 'next/image'
import Link from 'next/link'
import type { ServiceAreaPageProps } from '@/types/template'
import { ContactForm } from '@/components/shared/ContactForm'

export function ServiceAreaPage({
  businessInfo,
  resolvedCopy,
  serviceAreas,
  media,
  config
}: ServiceAreaPageProps) {

  const heroMedia = media.find(m => m.category === 'hero')
  const heroImage = heroMedia?.url || '/assets/eco-yard/8f8fad3186d80ad51fcac9d62bdb5a61.webp'

  return (
    <div className="w-full">
      {/* Inner Hero */}
      <section className="relative w-full h-[40vh] min-h-[350px] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroImage}
            alt="Service Areas"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gray-900/80"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight mb-4">
              Areas We Serve
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-xl">
              Delivering high-quality landscaping and outdoor services to communities across our region.
            </p>
            <div className="flex items-center text-sm font-medium text-gray-400">
              <Link href="/" className="hover:text-[#B9FF24] transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-[#B9FF24]">Service Areas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            <div>
              <div className="flex items-center space-x-2 text-[#0C1810] font-bold mb-4">
                <span className="w-2 h-2 rounded-full bg-[#B9FF24]"></span>
                <span className="uppercase tracking-wider text-sm">Local Expertise</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-6 leading-tight">
                Proudly Serving {businessInfo.city} & Surrounding Areas
              </h2>
              <p className="text-gray-600 mb-10 leading-relaxed">
                Our team is familiar with the local climate, soil types, and environmental factors that affect landscaping in our service areas. This local expertise allows us to provide practical solutions that thrive year-round.
              </p>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Primary Service Areas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                {serviceAreas && serviceAreas.length > 0 ? (
                  serviceAreas.map((area, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center shadow-sm">
                      <svg className="w-5 h-5 text-[#B9FF24] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span className="font-medium text-gray-800">{area.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-gray-500 italic">Service areas will be populated here.</div>
                )}
              </div>
              
              <div className="bg-[#0A1A12] rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#B9FF24] rounded-full filter blur-[60px] opacity-20"></div>
                <h3 className="text-xl font-bold mb-3 relative z-10">Don't see your area listed?</h3>
                <p className="text-gray-400 mb-6 relative z-10 text-sm">
                  Contact us to see if we can accommodate your location. We often take on special projects just outside our standard boundaries.
                </p>
                <div className="relative z-10 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-[#B9FF24] flex items-center justify-center mr-4 text-gray-900">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div className="font-bold text-lg">{businessInfo.phone}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-xl w-full">
                <iframe 
                  title="Service Areas Map"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  loading="lazy" 
                  allowFullScreen 
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyPlaceholderKeyForDemoOnly&q=${encodeURIComponent(businessInfo.city + ', ' + businessInfo.state)}`}
                ></iframe>
                {/* Fallback overlay since we don't have a real API key */}
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500 font-medium pointer-events-none">
                  Map Embed: Serving {businessInfo.city} & Surrounding Regions
                </div>
              </div>
              
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Request Service in Your Area</h3>
                <ContactForm source="service_area_page" ctaLabel="Check Availability" />
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
