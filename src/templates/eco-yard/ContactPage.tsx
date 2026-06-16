import Image from 'next/image'
import Link from 'next/link'
import type { ContactPageProps } from '@/types/template'
import { resolveImage } from '@/lib/images'
import { ContactForm } from '@/components/shared/ContactForm'

export function ContactPage({
  businessInfo,
  resolvedCopy,
  serviceAreas,
  media,
  config
}: ContactPageProps) {

  const heroImage = resolveImage('hero_bg', '/assets/eco-yard/af0b4b6d544656b2ccc897aeda06fc93.webp', config)
  const contactBgImage = resolveImage('contact_bg', '/assets/eco-yard/d6af1fc2fcd9d6c0fff13aab32a6339e.webp', config)

  return (
    <div className="w-full">
      {/* 1. Inner Hero */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroImage}
            alt="Contact Us"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gray-900/80"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-[var(--tribe-text)] leading-tight mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-xl">
              Tell us about your space and what you need. We'll get back with clear guidance as soon as possible.
            </p>
            <div className="flex items-center text-sm font-medium text-gray-400">
              <Link href="/" className="hover:text-[var(--tribe-brand)] transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-[var(--tribe-brand)]">Contact Us</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Contact Form Section */}
      <section className="py-24 bg-[var(--tribe-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[700px] rounded-3xl overflow-hidden shadow-xl w-full">
              <Image 
                src={contactBgImage}
                alt="Let's Talk"
                fill
                className="object-cover"
              />
            </div>
            
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-6 leading-tight">
                Let's Talk About Your Project
              </h2>
              <p className="text-gray-600 mb-10 leading-relaxed">
                Tell us about your space and what you need. We'll get back with clear guidance and the next steps.
              </p>
              
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 shadow-sm">
                <ContactForm source="contact_page" ctaLabel="Send Request" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Local Offices / Contact Info */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <div className="inline-flex items-center justify-center space-x-2 text-[#0C1810] font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--tribe-brand)]"></span>
            <span className="uppercase tracking-wider text-sm">Contact Us</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 leading-tight max-w-2xl mx-auto">
            Visit or Contact Our Local Offices
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Find the nearest office and get in touch with our team for support, project inquiries, or service requests. We're here to help with clear and timely communication.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-4">
              {/* Primary Office */}
              <div className="bg-[var(--tribe-brand)] rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Headquarters</h3>
                  <svg className="w-5 h-5 text-gray-900 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                <div className="space-y-3 text-gray-800 text-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {businessInfo.phone}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {businessInfo.email}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {businessInfo.city}
                  </div>
                </div>
              </div>
              
              {/* Service Areas */}
              {serviceAreas.slice(0, 3).map((area, idx) => (
                <div key={idx} className="bg-[var(--tribe-surface)] border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-[var(--tribe-brand)] transition-colors cursor-pointer group">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-lg">{area.name} Office</h3>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-[var(--tribe-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-xl w-full">
              <Image 
                src="/assets/eco-yard/1a36658fd2628deae4bb36c83795ee49.webp"
                alt="Local Offices"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Map Section */}
      <section className="w-full h-[500px] relative bg-gray-200">
        <iframe 
          title="Office Location Map"
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          loading="lazy" 
          allowFullScreen 
          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyPlaceholderKeyForDemoOnly&q=${encodeURIComponent(businessInfo.city + ', ' + businessInfo.state)}`}
        ></iframe>
        {/* We use a placeholder embed since we don't have a real API key, but in production Tribe CMS maps might provide a real component. */}
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
          Map Embed: {businessInfo.city}, {businessInfo.state}
        </div>
      </section>

    </div>
  )
}
