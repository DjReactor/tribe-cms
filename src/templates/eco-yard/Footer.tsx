import Link from 'next/link'
import type { FooterProps } from '@/types/template'

export function Footer({ businessInfo, services, serviceAreas, settings, config }: FooterProps) {
  return (
    <footer className="w-full bg-[#050B07] text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Top Section - Subscription & Footer Branding */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#B9FF24] flex items-center justify-center text-[#0C1810]">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                 </svg>
              </div>
              <span className="font-heading font-bold text-2xl text-white tracking-tight">
                {businessInfo.business_name}
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              We provide landscaping and outdoor services focused on practical design, reliable execution, and long-term maintenance.
            </p>
          </div>
          
          <div className="lg:col-span-2">
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="hover:text-[#B9FF24] transition-colors">About</Link></li>
              <li><Link href="/services" className="hover:text-[#B9FF24] transition-colors">Services</Link></li>
              {settings.blog_enabled && (
                <li><Link href="/blog" className="hover:text-[#B9FF24] transition-colors">Blog</Link></li>
              )}
              <li><Link href="/contact" className="hover:text-[#B9FF24] transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div className="lg:col-span-3">
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-3 text-sm">
              {services.slice(0, 5).map(service => (
                <li key={service.id}>
                  <Link href={`/services/${service.slug}`} className="hover:text-[#B9FF24] transition-colors">
                    {service.name}
                  </Link>
                </li>
              ))}
              {services.length === 0 && (
                <>
                  <li><Link href="/services" className="hover:text-[#B9FF24] transition-colors">Landscape Design</Link></li>
                  <li><Link href="/services" className="hover:text-[#B9FF24] transition-colors">Lawn Maintenance</Link></li>
                  <li><Link href="/services" className="hover:text-[#B9FF24] transition-colors">Garden Installation</Link></li>
                  <li><Link href="/services" className="hover:text-[#B9FF24] transition-colors">Hardscape Installation</Link></li>
                </>
              )}
            </ul>
          </div>
          
          <div className="lg:col-span-3">
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Social Media</h4>
            <ul className="space-y-3 text-sm">
              {businessInfo.social_instagram && <li><a href={businessInfo.social_instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#B9FF24] transition-colors">Instagram</a></li>}
              {businessInfo.social_facebook && <li><a href={businessInfo.social_facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#B9FF24] transition-colors">Facebook</a></li>}
              {/* Fallbacks if empty for visual parity */}
              {!businessInfo.social_instagram && !businessInfo.social_facebook && (
                <>
                  <li><a href="#" className="hover:text-[#B9FF24] transition-colors">Instagram</a></li>
                  <li><a href="#" className="hover:text-[#B9FF24] transition-colors">Facebook</a></li>
                  <li><a href="#" className="hover:text-[#B9FF24] transition-colors">Twitter</a></li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-gray-800 py-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="text-2xl font-heading font-bold text-white mb-2">Get Seasonal Lawn &<br/><span className="text-[#B9FF24]">Garden Tips</span></h3>
          </div>
          <div className="w-full md:w-auto flex">
            <input type="email" placeholder="Enter your email" className="bg-white text-gray-900 rounded-l-full px-6 py-3 w-full md:w-72 outline-none" />
            <button className="bg-[#B9FF24] text-gray-900 font-bold px-6 py-3 rounded-r-full hover:bg-[#a5e61e] transition-colors flex items-center">
              Subscribe
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-white font-bold text-sm uppercase tracking-wider">Contact Us</div>
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <svg className="w-4 h-4 text-[#B9FF24]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href={`tel:${businessInfo.phone}`}>{businessInfo.phone}</a>
            </div>
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <svg className="w-4 h-4 text-[#B9FF24]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href={`mailto:${businessInfo.email}`}>{businessInfo.email}</a>
            </div>
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <svg className="w-4 h-4 text-[#B9FF24]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{businessInfo.city} & Nearby Areas</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-center md:text-right">
            <span>© {new Date().getFullYear()} {businessInfo.business_name}. All rights reserved.</span>
            {settings.show_powered_by && (
              <span>Powered by SuccessForce</span>
            )}
            <div className="flex items-center gap-3">
              <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
