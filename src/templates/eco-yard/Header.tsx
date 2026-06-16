import Link from 'next/link'
import type { HeaderProps } from '@/types/template'

export function Header({ businessInfo, serviceAreas, blogEnabled, config }: HeaderProps) {
  return (
    <header className="w-full flex flex-col">
      {/* Top Bar */}
      <div className="hidden md:flex justify-between items-center px-4 md:px-8 py-2 bg-[#0C1810] text-gray-300 text-xs">
        <div className="flex items-center space-x-2">
          <svg className="w-3 h-3 text-[var(--tribe-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Mon - Sat: 8:00 AM - 6:00 PM</span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <svg className="w-3 h-3 text-[var(--tribe-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{businessInfo.phone}</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-3 h-3 text-[var(--tribe-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{businessInfo.email}</span>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex justify-between items-center px-4 md:px-8 py-4 bg-[var(--tribe-surface)] border-b border-gray-100 relative z-50">
        <Link href="/" className="flex items-center space-x-2">
          {/* EcoYard Logo SVG Placeholder */}
          <div className="w-8 h-8 rounded-full bg-[var(--tribe-brand)] flex items-center justify-center text-[#0C1810]">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
             </svg>
          </div>
          <span className="font-heading font-bold text-xl text-gray-900 tracking-tight">
            {businessInfo.business_name}
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-700">
          <Link href="/" className="hover:text-[var(--tribe-brand)] transition-colors">Home</Link>
          <Link href="/about" className="hover:text-[var(--tribe-brand)] transition-colors">About Us</Link>
          <Link href="/services" className="hover:text-[var(--tribe-brand)] transition-colors">Service</Link>
          {blogEnabled && (
            <Link href="/blog" className="hover:text-[var(--tribe-brand)] transition-colors">Blog</Link>
          )}
          <Link href="/contact" className="hover:text-[var(--tribe-brand)] transition-colors">Contact</Link>
        </nav>

        <div className="hidden md:flex">
          <Link href="/contact" className="group flex items-center bg-gray-900 hover:bg-gray-800 text-[var(--tribe-text)] rounded-full pl-6 pr-2 py-2 transition-all">
            <span className="text-sm font-medium mr-3">Get Estimate</span>
            <div className="w-8 h-8 rounded-full bg-[var(--tribe-brand)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2 text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  )
}
