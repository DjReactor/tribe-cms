import Image from 'next/image'
import Link from 'next/link'
import type { ServiceDetailProps } from '@/types/template'
import { getMediaFileUrl } from '@/lib/images'
import { ContactForm } from '@/components/shared/ContactForm'

export function ServiceDetailPage({
  businessInfo,
  resolvedCopy,
  service,
  otherServices,
  media,
  config
}: ServiceDetailProps) {

  const heroMedia = media.find(m => m.category === 'hero')
  const heroImage = getMediaFileUrl(heroMedia) || '/assets/eco-yard/1a36658fd2628deae4bb36c83795ee49.webp'

  return (
    <div className="w-full">
      {/* 1. Inner Hero */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroImage}
            alt="Service Details"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gray-900/80"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-[var(--tribe-text)] leading-tight mb-4">
              Service Details
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-xl">
              We deliver simple and reliable services designed to improve outdoor spaces with lasting results.
            </p>
            <div className="flex items-center text-sm font-medium text-gray-400">
              <Link href="/" className="hover:text-[var(--tribe-brand)] transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-[var(--tribe-brand)]">Service Details</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[var(--tribe-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-16">
              
              {/* Service Overview */}
              <div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-6 leading-tight">
                  {service.name}
                </h2>
                <div 
                  className="prose prose-lg prose-gray max-w-none mb-10 text-gray-600"
                  dangerouslySetInnerHTML={{ __html: service.long_description || service.short_description || '' }}
                />
                
                <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-lg w-full mb-12">
                  <Image 
                    src={service.cover_image_url || '/assets/eco-yard/3f67d7672340ac662cb8d45e62b7c4e6.webp'}
                    alt={service.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Features / What's Included */}
                {service.features && service.features.length > 0 && (
                  <div className="mb-16">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">What's Included in Our Service</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-gray-600">
                          <svg className="w-5 h-5 text-[var(--tribe-brand)] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Our Process Placeholder (Using static design from template if no dynamic data) */}
              <div className="mb-16">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Our Process</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    {[
                      { title: "1. Understanding Your Space", desc: "We review your area, needs, and how you plan to use the space." },
                      { title: "2. Planning the Layout", desc: "We create a clear structure that balances design and function." },
                      { title: "3. Final Design Direction", desc: "We refine the layout and prepare it for installation or next steps." }
                    ].map((step, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-2">{step.title}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-lg w-full">
                    <Image 
                      src="/assets/eco-yard/8f8fad3186d80ad51fcac9d62bdb5a61.webp"
                      alt="Our Process"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Benefits / Why Choose Us */}
              {service.benefits && service.benefits.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                  <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-lg w-full">
                    <Image 
                      src="/assets/eco-yard/8da3caff9e07af4fe3aad4bea44e0275.webp"
                      alt="Why Choose Us"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 leading-tight">
                      Why Choose Our {service.name}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      We focus on delivering high-quality, practical results tailored to your specific needs.
                    </p>
                    <div className="space-y-4 mb-8">
                      {service.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start text-gray-600">
                          <svg className="w-5 h-5 text-[var(--tribe-brand)] mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                    <Link href="#book-service" className="inline-flex items-center bg-gray-900 hover:bg-gray-800 text-[var(--tribe-text)] rounded-full pl-6 pr-2 py-2 transition-all">
                      <span className="text-sm font-medium mr-3">Get Started</span>
                      <div className="w-8 h-8 rounded-full bg-[var(--tribe-brand)] flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-10">
              
              {/* Other Services */}
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Other Services</h3>
                <div className="space-y-3">
                  {otherServices.slice(0, 6).map((other) => (
                    <Link 
                      key={other.id} 
                      href={`/services/${other.slug}`}
                      className="flex items-center justify-between p-4 bg-[var(--tribe-surface)] rounded-xl border border-gray-100 hover:border-[var(--tribe-brand)] hover:bg-[var(--tribe-brand)]/5 transition-all group"
                    >
                      <span className="font-medium text-gray-700 group-hover:text-gray-900">{other.name}</span>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-[var(--tribe-brand)] transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Book This Service Form */}
              <div id="book-service" className="bg-[var(--tribe-surface)] rounded-3xl p-8 border border-gray-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--tribe-brand)] rounded-full filter blur-[60px] opacity-20"></div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">Book This Service</h3>
                <p className="text-gray-500 text-sm mb-6 relative z-10">
                  Tell us about your space and what you need. We'll review your request and get back with clear next steps.
                </p>
                <div className="relative z-10">
                  <ContactForm source={`service_${service.id}`} ctaLabel="Book Service" />
                </div>
              </div>

              {/* Contact Info Box */}
              <div className="bg-[#0A1A12] rounded-3xl p-8 shadow-lg text-[var(--tribe-text)]">
                <h3 className="text-xl font-bold mb-6">Contact Info</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-[var(--tribe-surface)]/10 flex items-center justify-center mr-4 text-[var(--tribe-brand)]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <div>
                      <div className="font-medium">{businessInfo.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-[var(--tribe-surface)]/10 flex items-center justify-center mr-4 text-[var(--tribe-brand)]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <div className="font-medium">{businessInfo.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-[var(--tribe-surface)]/10 flex items-center justify-center mr-4 text-[var(--tribe-brand)]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div>
                      <div className="font-medium">{businessInfo.city}, {businessInfo.state}</div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
