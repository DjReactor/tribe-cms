import Link from 'next/link'
import type { HeaderProps } from '@/types/template'

export function Header({ businessInfo, serviceAreas, blogEnabled, config }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50 shadow-sm">
      <nav className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-heading font-bold text-2xl text-gray-900 hover:opacity-90 transition-opacity">
          {businessInfo.business_name}
        </Link>
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
          <li>
            <Link href="/services" className="hover:text-[var(--color-accent)] transition-colors">
              Services
            </Link>
          </li>
          {serviceAreas?.length > 0 && (
            <li>
              {serviceAreas.length === 1 ? (
                <Link href={`/${serviceAreas[0].slug}`} className="hover:text-[var(--color-accent)] transition-colors">
                  Service Area
                </Link>
              ) : (
                <Link href={`/${serviceAreas[0].slug}`} className="hover:text-[var(--color-accent)] transition-colors">
                  Areas We Serve
                </Link>
              )}
            </li>
          )}
          {blogEnabled && (
            <li>
              <Link href="/blog" className="hover:text-[var(--color-accent)] transition-colors">
                Blog
              </Link>
            </li>
          )}
          <li>
            <Link href="/about" className="hover:text-[var(--color-accent)] transition-colors">
              About
            </Link>
          </li>
          <li>
            <Link href="/contact" className="hover:text-[var(--color-accent)] transition-colors">
              Contact
            </Link>
          </li>
        </ul>
        {businessInfo.phone && (
          <a
            href={`tel:${businessInfo.phone}`}
            className="hidden lg:flex items-center justify-center px-6 py-2.5 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
          >
            {businessInfo.phone}
          </a>
        )}
      </nav>
    </header>
  )
}