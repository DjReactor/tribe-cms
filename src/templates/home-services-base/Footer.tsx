import Link from 'next/link'
import type { FooterProps } from '@/types/template'

export function Footer({ businessInfo, services, serviceAreas, settings, config }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-[var(--sf-text)] pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* Column 1: Business Info */}
        <div>
          <Link href="/" className="font-heading font-bold text-2xl mb-6 block">
            {businessInfo.business_name}
          </Link>
          <div className="space-y-3 text-sm text-gray-400">
            {businessInfo.address && <p>{businessInfo.address}</p>}
            {businessInfo.phone && (
              <p>
                <a href={`tel:${businessInfo.phone}`} className="hover:text-[var(--sf-text)] transition-colors">
                  {businessInfo.phone}
                </a>
              </p>
            )}
            {businessInfo.email && (
              <p>
                <a href={`mailto:${businessInfo.email}`} className="hover:text-[var(--sf-text)] transition-colors">
                  {businessInfo.email}
                </a>
              </p>
            )}
            {businessInfo.license_number && (
              <p className="pt-2 text-xs text-gray-500">License #{businessInfo.license_number}</p>
            )}
          </div>
        </div>

        {/* Column 2: Services */}
        {services?.length > 0 && (
          <div>
            <h3 className="font-bold text-lg mb-6">Our Services</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              {services?.map((service) => (
                <li key={service.id}>
                  <Link href={`/services/${service.slug}`} className="hover:text-[var(--sf-text)] transition-colors">
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Column 3: Service Areas */}
        {serviceAreas?.length > 0 && (
          <div>
            <h3 className="font-bold text-lg mb-6">Areas We Serve</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              {serviceAreas?.map((area) => (
                <li key={area.id}>
                  <Link href={`/${area.slug}`} className="hover:text-[var(--sf-text)] transition-colors">
                    {area.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Column 4: Follow Us & Legal */}
        <div>
          <h3 className="font-bold text-lg mb-6">Connect</h3>
          <div className="flex gap-4 mb-8">
            {businessInfo.social_facebook && (
              <a href={businessInfo.social_facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--sf-text)] transition-colors">
                Facebook
              </a>
            )}
            {businessInfo.social_instagram && (
              <a href={businessInfo.social_instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--sf-text)] transition-colors">
                Instagram
              </a>
            )}
            {businessInfo.social_google && (
              <a href={businessInfo.social_google} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--sf-text)] transition-colors">
                Google
              </a>
            )}
            {businessInfo.social_yelp && (
              <a href={businessInfo.social_yelp} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--sf-text)] transition-colors">
                Yelp
              </a>
            )}
            {businessInfo.social_other && (
              <a href={businessInfo.social_other} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--sf-text)] transition-colors">
                Other
              </a>
            )}
          </div>
          <div className="space-y-3 text-sm text-gray-400 flex flex-col">
            <Link href="/privacy-policy" className="hover:text-[var(--sf-text)] transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-[var(--sf-text)] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
        <p>© {new Date().getFullYear()} {businessInfo.business_name}. All rights reserved.</p>
        {settings.show_powered_by && (
          <p className="mt-4 md:mt-0">Powered by SuccessForce</p>
        )}
      </div>
    </footer>
  )
}