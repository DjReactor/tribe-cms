import Link from 'next/link'
import Image from 'next/image'
import type { HomePageProps } from '@/types/template'
import { ContactForm } from '@/components/shared/ContactForm'
import { StarRating } from '@/components/shared/StarRating'
import { BeforeAfterSlider } from '@/components/shared/BeforeAfterSlider'

export function HomePage({ 
  businessInfo, 
  resolvedCopy, 
  services, 
  serviceAreas, 
  testimonials, 
  media, 
  beforeAfterPairs, 
  config 
}: HomePageProps) {

  // Extract a hero image from media if available, or use placeholder
  const heroMedia = media.find(m => m.category === 'hero')
  const heroImage = heroMedia?.url || '/assets/eco-yard/699164a8407057ce8dde70466b6cf90a.webp'

  return (
    <div className="w-full">
      {/* 1. Hero Section */}
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-center pt-20 pb-16">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroImage}
            alt={businessInfo.business_name || 'Hero Image'}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/40"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 text-[#B9FF24] text-sm font-medium border border-white/20">
              <span className="w-2 h-2 rounded-full bg-[#B9FF24]"></span>
              <span>Residential & Commercial Projects</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight mb-6">
              {resolvedCopy.hero_h1 || `Landscaping That Works in Every Season`}
            </h1>
            <p className="text-lg text-gray-200 mb-8 max-w-xl">
              {resolvedCopy.hero_subtitle || `We help homeowners and businesses improve their outdoor areas with practical landscaping, lawn care, and garden design.`}
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#quote-section" className="bg-[#B9FF24] hover:bg-[#a5e61e] text-gray-900 font-bold px-8 py-4 rounded-full transition-colors flex items-center">
                {resolvedCopy.cta_primary || 'Request a Quote'}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              <Link href="/services" className="bg-transparent hover:bg-white/10 text-white font-medium border border-white/30 px-8 py-4 rounded-full transition-colors flex items-center">
                View Projects
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. About Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[400px] md:h-[600px] rounded-3xl overflow-hidden shadow-xl w-full">
              <Image 
                src="/assets/eco-yard/58b034415e24578b01eba384a7a63a00.webp"
                alt={businessInfo.business_name || 'About us'}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2 text-[#0C1810] font-bold mb-4">
                <span className="w-2 h-2 rounded-full bg-[#B9FF24]"></span>
                <span className="uppercase tracking-wider text-sm">About Us</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-6 leading-tight">
                {resolvedCopy.about_heading || `We focus on building outdoor spaces that are practical, easy to maintain.`}
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {businessInfo.short_description || `From lawn care to full landscape projects, our team works with clear planning and reliable execution. We aim to ensure your outdoor areas remain in excellent condition throughout the year.`}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {[
              { title: "Planned Outdoor Design", desc: "We design layouts that match how the space will be used." },
              { title: "Skilled Installation Work", desc: "Our team handles each project step with care and proper materials." },
              { title: "Ongoing Maintenance Support", desc: "We offer regular care services to keep lawns and plants healthy." }
            ].map((feature, idx) => (
              <div key={idx} className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:border-[#B9FF24] transition-colors group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 text-[#0C1810] group-hover:bg-[#B9FF24] transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div className="max-w-2xl">
              <div className="flex items-center space-x-2 text-[#0C1810] font-bold mb-4">
                <span className="w-2 h-2 rounded-full bg-[#B9FF24]"></span>
                <span className="uppercase tracking-wider text-sm">Our Services</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 leading-tight">
                Landscaping Services for Every Outdoor Need
              </h2>
            </div>
            <div className="mt-6 md:mt-0">
              <Link href="/services" className="inline-flex items-center bg-gray-900 hover:bg-gray-800 text-white rounded-full pl-6 pr-2 py-2 transition-all">
                <span className="text-sm font-medium mr-3">View All Services</span>
                <div className="w-8 h-8 rounded-full bg-[#B9FF24] flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(services.length > 0 ? services.slice(0,3) : [
              { id: '1', name: 'Hardscape Build', slug: 'hardscape-build', short_description: 'Stone patios and walkways built for strength.', cover_image_url: '/assets/eco-yard/3f67d7672340ac662cb8d45e62b7c4e6.webp' },
              { id: '2', name: 'Landscape Design', slug: 'landscape-design', short_description: 'Planning outdoor layouts that balance space.', cover_image_url: '/assets/eco-yard/3f67d7672340ac662cb8d45e62b7c4e6.webp' },
              { id: '3', name: 'Lawn Maintenance', slug: 'lawn-maintenance', short_description: 'Regular mowing, trimming, and seasonal care.', cover_image_url: '/assets/eco-yard/3f67d7672340ac662cb8d45e62b7c4e6.webp' }
            ]).map(service => (
              <div key={service.id} className="group relative rounded-3xl overflow-hidden shadow-lg h-[400px]">
                <Image 
                  src={service.cover_image_url || '/assets/eco-yard/3f67d7672340ac662cb8d45e62b7c4e6.webp'} 
                  alt={service.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{service.name}</h3>
                  <p className="text-gray-300 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                    {service.short_description}
                  </p>
                  <Link href={`/services/${service.slug}`} className="inline-flex items-center text-[#B9FF24] font-medium group-hover:text-white transition-colors">
                    Learn More
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center space-x-2 text-[#0C1810] font-bold mb-4">
                <span className="w-2 h-2 rounded-full bg-[#B9FF24]"></span>
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
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#B9FF24] flex items-center justify-center font-bold text-gray-900 text-sm mt-1">
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

      {/* 5. Process Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <div className="inline-flex items-center justify-center space-x-2 text-[#0C1810] font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-[#B9FF24]"></span>
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
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center relative pt-12 mt-6">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-[#B9FF24] rounded-full flex items-center justify-center font-bold text-gray-900 border-4 border-gray-50">
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

      {/* 6. Testimonials Section */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-end justify-between mb-16">
              <div className="max-w-2xl">
                <div className="flex items-center space-x-2 text-[#0C1810] font-bold mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#B9FF24]"></span>
                  <span className="uppercase tracking-wider text-sm">Client Feedback</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 leading-tight">
                  What Our Clients Say About Our Work
                </h2>
              </div>
              <p className="text-gray-600 max-w-sm mt-6 md:mt-0">
                We've worked with homeowners and businesses on different types of outdoor projects. Here's what they shared.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.slice(0, 2).map((testimonial) => (
                <div key={testimonial.id} className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                  <div className="text-[#B9FF24] mb-6">
                    <svg className="w-10 h-10 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-lg italic mb-8 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-4 relative">
                        {testimonial.author_photo_url ? (
                          <Image src={testimonial.author_photo_url} alt={testimonial.author_name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#B9FF24] flex items-center justify-center font-bold text-[#0C1810]">
                            {testimonial.author_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{testimonial.author_name}</h4>
                        <div className="text-xs text-gray-500">{testimonial.author_location}</div>
                      </div>
                    </div>
                    <StarRating rating={testimonial.rating} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. CTA / Contact Form Section */}
      <section id="quote-section" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/assets/eco-yard/8da3caff9e07af4fe3aad4bea44e0275.webp" 
            alt="CTA Background" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-[2px]"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
                Ready to Improve Your Outdoor Space?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-lg">
                Tell us about your project, and we'll guide you with a clear plan, timeline, and next steps based on your needs.
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-white">
                  <svg className="w-6 h-6 text-[#B9FF24] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-bold text-xl">{businessInfo.phone}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Request a Quote</h3>
              <p className="text-gray-500 mb-8">Fill out the form below and our team will get back to you shortly.</p>
              <ContactForm source="hero_cta" ctaLabel="Get a Free Quote" />
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
