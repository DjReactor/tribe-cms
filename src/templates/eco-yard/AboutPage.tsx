import Image from 'next/image'
import Link from 'next/link'
import type { AboutPageProps } from '@/types/template'
import { resolveImage } from '@/lib/images'
import { BusinessHours } from '@/components/shared/BusinessHours'
import { StarRating } from '@/components/shared/StarRating'
import { ContactForm } from '@/components/shared/ContactForm'

export function AboutPage({
  businessInfo,
  resolvedCopy,
  services,
  serviceAreas,
  testimonials,
  media,
  config
}: AboutPageProps) {

  const heroImage = resolveImage('hero_bg', '/assets/eco-yard/c48972a4d96a33438459f173b9e864fd.webp', config)
  const aboutImage = resolveImage('about_us_main', '/assets/eco-yard/51738e065bea09eb000f9801e7d4219a.webp', config)
  const contactBgImage = resolveImage('contact_bg', '/assets/eco-yard/8da3caff9e07af4fe3aad4bea44e0275.webp', config)

  return (
    <div className="w-full">
      {/* 1. Inner Hero */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroImage}
            alt="About Us"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gray-900/80"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-[var(--sf-text)] leading-tight mb-4">
              About Us
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-xl">
              We help homeowners and businesses improve their outdoor areas with practical landscaping.
            </p>
            <div className="flex items-center text-sm font-medium text-gray-400">
              <Link href="/" className="hover:text-[var(--sf-brand)] transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-[var(--sf-brand)]">About</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Introduction Section (Same as Home) */}
      <section className="py-20 bg-[var(--sf-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-xl">
              <Image 
                src={aboutImage}
                alt="About us"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2 text-[#0C1810] font-bold mb-4">
                <span className="w-2 h-2 rounded-full bg-[var(--sf-brand)]"></span>
                <span className="uppercase tracking-wider text-sm">About Us</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-6 leading-tight">
                {resolvedCopy.about_heading || `We focus on building outdoor spaces that are practical, easy to maintain.`}
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {businessInfo.full_description || businessInfo.short_description || `From lawn care to full landscape projects, our team works with clear planning and reliable execution. We aim to ensure your outdoor areas remain in excellent condition throughout the year.`}
              </p>
              
              <div className="grid grid-cols-3 gap-6 mb-8 border-t border-gray-100 pt-8">
                <div>
                  <div className="text-4xl font-heading font-bold text-gray-900 mb-1">{businessInfo.year_established ? new Date().getFullYear() - businessInfo.year_established : '12'}</div>
                  <div className="text-sm text-gray-500">Years of Experience</div>
                </div>
                <div>
                  <div className="text-4xl font-heading font-bold text-gray-900 mb-1">500+</div>
                  <div className="text-sm text-gray-500">Projects Completed</div>
                </div>
                <div>
                  <div className="text-4xl font-heading font-bold text-gray-900 mb-1">4.9/5</div>
                  <div className="text-sm text-gray-500">Client Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Foundation / Values */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center space-x-2 text-[#0C1810] font-bold mb-4">
                <span className="w-2 h-2 rounded-full bg-[var(--sf-brand)]"></span>
                <span className="uppercase tracking-wider text-sm">Our Foundation</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-8 leading-tight">
                Built on Care, Quality, and Practical Service
              </h2>
              <div className="flex space-x-8 border-b border-gray-200 mb-6">
                <button className="pb-4 border-b-2 border-[var(--sf-brand)] text-gray-900 font-bold text-lg">Our Values</button>
                <button className="pb-4 text-gray-500 font-medium text-lg hover:text-gray-900 transition-colors">Our Commitment</button>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                We focus on practical landscaping that improves how outdoor spaces look and function. Every project is handled with care, from planning to final setup, ensuring results that feel natural and easy to maintain.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We believe in clear communication, honest work, and solutions that fit each space without unnecessary complexity.
              </p>
              <Link href="/services" className="inline-flex items-center text-gray-900 font-bold hover:text-[var(--sf-brand)] transition-colors">
                View Services
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
            
            <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-lg w-full">
              <Image 
                src="/assets/eco-yard/8eb2c0b4d494606ad8c4bddf745f144b.webp"
                alt="Our Foundation"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Business Hours / Contact Info */}
      <section className="py-20 bg-[var(--sf-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="bg-gray-900 rounded-3xl p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--sf-brand)] rounded-full filter blur-[100px] opacity-20"></div>
             
             <div className="lg:w-1/2 relative z-10 text-[var(--sf-text)]">
                <h2 className="text-3xl font-heading font-bold mb-6">Visit Us</h2>
                <p className="text-gray-400 mb-8 max-w-md">We are always ready to answer your questions and assist you with your landscaping needs. Reach out during our operating hours.</p>
                <div className="space-y-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--sf-surface)]/10 flex items-center justify-center mr-4 text-[var(--sf-brand)]">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Location</div>
                      <div className="font-bold text-lg">{businessInfo.city}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--sf-surface)]/10 flex items-center justify-center mr-4 text-[var(--sf-brand)]">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Phone</div>
                      <div className="font-bold text-lg">{businessInfo.phone}</div>
                    </div>
                  </div>
                </div>
             </div>
             
             <div className="lg:w-1/2 w-full relative z-10">
                <div className="bg-[var(--sf-surface)] rounded-2xl p-8 shadow-xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <svg className="w-5 h-5 text-[var(--sf-brand)] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Business Hours
                  </h3>
                  <BusinessHours hours={businessInfo.hours} className="text-gray-600" />
                </div>
             </div>
           </div>
        </div>
      </section>

      {/* 5. Process Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <div className="inline-flex items-center justify-center space-x-2 text-[#0C1810] font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--sf-brand)]"></span>
            <span className="uppercase tracking-wider text-sm">Our Process</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 leading-tight max-w-2xl mx-auto">
            A Clear Process from Start to Finish
          </h2>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Consultation & Planning', desc: 'We understand your space, discuss your needs, and prepare a clear plan with materials and timelines.' },
              { step: '02', title: 'Project Execution', desc: 'Our team completes the work with proper tools and methods, ensuring everything is built to last.' },
              { step: '03', title: 'Final Setup & Care', desc: 'We review the finished work and provide guidance or maintenance support to keep everything in good condition.' },
            ].map((process, idx) => (
              <div key={idx} className="bg-[var(--sf-surface)] p-8 rounded-3xl shadow-sm border border-gray-100 text-center relative pt-12 mt-6">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-[var(--sf-brand)] rounded-full flex items-center justify-center font-bold text-gray-900 border-4 border-gray-50">
                  {idx + 1}
                </div>
                <div className="text-3xl font-heading font-black text-gray-100 mb-4 tracking-widest">STEP {process.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{process.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{process.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA / Contact Form Section */}
      <section id="quote-section" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src={contactBgImage}
            alt="CTA Background" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-[2px]"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-[var(--sf-text)] mb-6 leading-tight">
                Ready to Improve Your Outdoor Space?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-lg">
                Tell us about your project, and we'll guide you with a clear plan, timeline, and next steps based on your needs.
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-[var(--sf-text)]">
                  <svg className="w-6 h-6 text-[var(--sf-brand)] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-bold text-xl">{businessInfo.phone}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-[var(--sf-surface)] rounded-3xl p-8 md:p-10 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Request a Quote</h3>
              <p className="text-gray-500 mb-8">Fill out the form below and our team will get back to you shortly.</p>
              <ContactForm source="about_page_cta" ctaLabel="Get a Free Quote" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
