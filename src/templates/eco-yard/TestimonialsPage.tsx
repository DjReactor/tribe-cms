import Image from 'next/image'
import Link from 'next/link'
import type { TestimonialsPageProps } from '@/types/template'
import { ContactForm } from '@/components/shared/ContactForm'
import { StarRating } from '@/components/shared/StarRating'

export function TestimonialsPage({
  businessInfo,
  resolvedCopy,
  testimonials,
  media,
  config
}: TestimonialsPageProps) {

  const heroMedia = media.find(m => m.category === 'hero')
  const heroImage = heroMedia?.url || '/assets/eco-yard/e6a6a52bab91bd1e2e5691ff723d802b.webp'

  return (
    <div className="w-full">
      {/* 1. Inner Hero */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroImage}
            alt="Client Stories"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gray-900/80"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight mb-4">
              Client Stories
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-xl">
              We've worked with homeowners and businesses on outdoor projects. Here's what they shared.
            </p>
            <div className="flex items-center text-sm font-medium text-gray-400">
              <Link href="/" className="hover:text-[#B9FF24] transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-[#B9FF24]">Testimonials</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Reviews Grid */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Read feedback from buyers, sellers, and investors who have worked with our team.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 relative">
                {/* Quote Icon watermark */}
                <div className="absolute top-8 left-8 text-gray-100">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                
                <div className="relative z-10">
                  <p className="text-gray-600 mb-8 leading-relaxed pt-4">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-gray-100">
                        <Image 
                          src={testimonial.author_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.author_name)}&background=random`} 
                          alt={testimonial.author_name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{testimonial.author_name}</h4>
                        <p className="text-xs text-gray-500">{testimonial.author_title || 'Client'}</p>
                      </div>
                    </div>
                    <div>
                      <StarRating rating={testimonial.rating} className="text-gray-900" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {testimonials.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-3xl border border-gray-200 border-dashed">
                No client stories available yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. CTA Banner */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/assets/eco-yard/8da3caff9e07af4fe3aad4bea44e0275.webp" 
            alt="CTA Background" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-[2px]"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
            Ready to Improve Your Outdoor Space?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Tell us about your project, and we'll guide you with a clear plan, timeline, and next steps based on your needs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="#contact-form" className="inline-flex items-center bg-[#B9FF24] hover:bg-white text-gray-900 rounded-full px-8 py-3 font-bold transition-colors w-full sm:w-auto justify-center">
              Request a Quote
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <Link href="/contact" className="inline-flex items-center bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white rounded-full px-8 py-3 font-bold transition-colors w-full sm:w-auto justify-center">
              Contact Us
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Contact Form Section */}
      <section id="contact-form" className="py-24 bg-white border-t border-gray-100">
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
                <span className="w-2 h-2 rounded-full bg-[#B9FF24]"></span>
                <span className="uppercase tracking-wider text-sm">Get In Touch</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-6 leading-tight">
                Let's Talk About Your Project
              </h2>
              <p className="text-gray-600 mb-10 leading-relaxed">
                Tell us about your space and what you need. We'll get back with clear guidance and the next steps.
              </p>
              
              <div className="bg-gray-50 rounded-3xl p-8 shadow-sm">
                <ContactForm source="testimonials_page" ctaLabel="Send Request" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
