import Image from 'next/image'
import Link from 'next/link'
import type { ServicesIndexProps } from '@/types/template'
import { getMediaFileUrl } from '@/lib/images'
import { ContactForm } from '@/components/shared/ContactForm'
import { StarRating } from '@/components/shared/StarRating'

export function ServicesIndexPage({
  businessInfo,
  resolvedCopy,
  services,
  testimonials,
  media,
  config
}: ServicesIndexProps) {

  const heroMedia = media.find(m => m.category === 'hero')
  const heroImage = getMediaFileUrl(heroMedia) || '/assets/eco-yard/5557a887ad078898907b6171e78e3f19.webp'

  return (
    <div className="w-full">
      {/* 1. Inner Hero */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroImage}
            alt="Our Services"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gray-900/80"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-[var(--tribe-text)] leading-tight mb-4">
              Our Services
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-xl">
              We offer services designed to improve outdoor spaces with practical and reliable solutions.
            </p>
            <div className="flex items-center text-sm font-medium text-gray-400">
              <Link href="/" className="hover:text-[var(--tribe-brand)] transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-[var(--tribe-brand)]">Service</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Services Grid */}
      <section className="py-20 bg-[var(--tribe-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 leading-tight mb-4">
                Landscaping Services for Every Outdoor Need
              </h2>
            </div>
            <div className="max-w-md">
              <p className="text-gray-600 mb-6">
                We offer a range of outdoor services designed to improve function, appearance, and long-term maintenance of your space.
              </p>
              <Link href="/contact" className="inline-flex items-center bg-gray-900 hover:bg-gray-800 text-[var(--tribe-text)] rounded-full pl-6 pr-2 py-2 transition-all">
                <span className="text-sm font-medium mr-3">Get a Quote</span>
                <div className="w-8 h-8 rounded-full bg-[var(--tribe-brand)] flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(service => (
              <div key={service.id} className="group relative rounded-3xl overflow-hidden shadow-lg h-[400px]">
                <Image 
                  src={service.cover_image_url || '/assets/eco-yard/3f67d7672340ac662cb8d45e62b7c4e6.webp'} 
                  alt={service.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-2xl font-bold text-[var(--tribe-text)] mb-2">{service.name}</h3>
                  <p className="text-gray-300 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                    {service.short_description}
                  </p>
                  <Link href={`/services/${service.slug}`} className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--tribe-brand)] text-gray-900 hover:bg-[var(--tribe-surface)] transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </Link>
                </div>
              </div>
            ))}
            
            {/* Fallback if no services are provided */}
            {services.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
                No services available yet. Add services to see them displayed here.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Pricing Plans Placeholder (Static UI representing the design) */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center space-x-2 text-[#0C1810] font-bold mb-4">
              <span className="w-2 h-2 rounded-full bg-[var(--tribe-brand)]"></span>
              <span className="uppercase tracking-wider text-sm">Our Pricing</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 leading-tight mb-4 max-w-2xl mx-auto">
              Simple Plans for Outdoor Work
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              We offer flexible pricing based on your needs, space, and project scope. Here are general starting points.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Basic */}
            <div className="bg-[var(--tribe-surface)] rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col h-full">
              <h3 className="font-bold text-gray-900 mb-2">Basic Care</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-heading font-bold text-gray-900">$120</span>
                <span className="text-gray-500 ml-2">/ visit</span>
              </div>
              <p className="text-sm text-gray-600 mb-8 border-b border-gray-100 pb-8">
                Essential maintenance for keeping your outdoor space clean and well-managed.
              </p>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Lawn mowing and edging",
                  "Hedge trimming and shaping",
                  "Leaf and debris cleanup",
                  "Weed control and removal",
                  "Basic garden maintenance"
                ].map((item, idx) => (
                  <li key={idx} className="flex text-sm text-gray-600">
                    <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="bg-gray-900 text-[var(--tribe-text)] hover:bg-gray-800 text-center py-3 rounded-full font-medium transition-colors w-full">Book Service</Link>
            </div>
            
            {/* Standard (Featured) */}
            <div className="bg-[#0A1A12] rounded-3xl p-8 shadow-xl flex flex-col h-full transform md:-translate-y-4 border border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--tribe-brand)] rounded-full filter blur-[80px] opacity-20"></div>
              <div className="inline-block bg-[var(--tribe-brand)] text-gray-900 text-xs font-bold px-3 py-1 rounded-full w-max mb-4">Most Popular</div>
              <h3 className="font-bold text-[var(--tribe-text)] mb-2">Standard Service</h3>
              <div className="flex items-baseline mb-4 text-[var(--tribe-text)]">
                <span className="text-4xl font-heading font-bold">$320</span>
                <span className="text-gray-400 ml-2">/ project</span>
              </div>
              <p className="text-sm text-gray-300 mb-8 border-b border-gray-800 pb-8">
                A balanced service for regular care, planting, and ongoing outdoor improvements.
              </p>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Lawn care and garden maintenance",
                  "Planting and soil preparation",
                  "Seasonal cleanup and adjustments",
                  "Shrub and plant care",
                  "Minor landscape improvements",
                  "Ongoing maintenance support"
                ].map((item, idx) => (
                  <li key={idx} className="flex text-sm text-gray-300">
                    <svg className="w-5 h-5 text-[var(--tribe-brand)] mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="bg-[var(--tribe-brand)] text-gray-900 hover:bg-[var(--tribe-surface)] text-center py-3 rounded-full font-bold transition-colors w-full">Get Started</Link>
            </div>
            
            {/* Full Project */}
            <div className="bg-[var(--tribe-surface)] rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col h-full">
              <h3 className="font-bold text-gray-900 mb-2">Full Project</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-heading font-bold text-gray-900">Custom</span>
              </div>
              <p className="text-sm text-gray-600 mb-8 border-b border-gray-100 pb-8">
                Complete landscaping solutions designed for full outdoor transformation and long-term use.
              </p>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Full landscape design planning",
                  "Hardscape and installation work",
                  "Irrigation system setup",
                  "Plant selection and placement",
                  "Complete outdoor transformation",
                  "End-to-end project management"
                ].map((item, idx) => (
                  <li key={idx} className="flex text-sm text-gray-600">
                    <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="bg-gray-900 text-[var(--tribe-text)] hover:bg-gray-800 text-center py-3 rounded-full font-medium transition-colors w-full">Book Service</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us Section */}
      <section className="py-20 bg-[var(--tribe-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center space-x-2 text-[#0C1810] font-bold mb-4">
                <span className="w-2 h-2 rounded-full bg-[var(--tribe-brand)]"></span>
                <span className="uppercase tracking-wider text-sm">Why Choose Us</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-6 leading-tight">
                Focused on Quality, Not Shortcuts
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We approach every project with clear planning, practical solutions, and consistent execution. Our goal is to deliver outdoor spaces that are easy to maintain and built for long-term use.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Clear Planning from the Start", desc: "We take time to understand your space and requirements before starting any work." },
                  { title: "Practical Landscaping Solutions", desc: "We focus on designs that are easy to maintain and suitable for everyday use." },
                  { title: "Reliable Project Timelines", desc: "Work is scheduled and completed within agreed timeframes without unnecessary delays." },
                  { title: "Support After Completion", desc: "We remain available for maintenance and follow-up support when needed." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--tribe-brand)] flex items-center justify-center font-bold text-gray-900 text-sm mt-1">
                      {idx + 1}
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-6">
              <div className="relative h-[300px] rounded-3xl overflow-hidden shadow-lg w-[90%] ml-auto">
                 <Image src="/assets/eco-yard/784b169a2d14e99d7c105a9433dc6a0e.webp" alt="Quality work" fill className="object-cover" />
               </div>
               <div className="relative h-48 rounded-3xl overflow-hidden shadow-lg mt-8">
                 <Image src="/assets/eco-yard/5557a887ad078898907b6171e78e3f19.webp" alt="Lawn maintenance" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Contact Form Section */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-xl w-full">
              <Image 
                src="/assets/eco-yard/51738e065bea09eb000f9801e7d4219a.webp"
                alt="Let's Talk"
                fill
                className="object-cover"
              />
            </div>
            
            <div>
              <div className="flex items-center space-x-2 text-[#0C1810] font-bold mb-4">
                <span className="w-2 h-2 rounded-full bg-[var(--tribe-brand)]"></span>
                <span className="uppercase tracking-wider text-sm">Get In Touch</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-6 leading-tight">
                Let's Talk About Your Project
              </h2>
              <p className="text-gray-600 mb-10 leading-relaxed">
                Tell us about your space and what you need. We'll get back with clear guidance and the next steps.
              </p>
              
              <div className="bg-[var(--tribe-surface)] rounded-3xl p-8 shadow-sm">
                <ContactForm source="services_index" ctaLabel="Send Request" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
