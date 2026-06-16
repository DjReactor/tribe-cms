import type { HeaderProps } from '@/types/template';
import Link from 'next/link';
import { styles } from './theme';
import { Menu, Phone } from 'lucide-react';

export function Header({ businessInfo, serviceAreas, blogEnabled, config }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[var(--tribe-surface)] border-b border-[var(--tribe-border)]">
      <div className={`${styles.container} h-20 flex items-center justify-between`}>
        <div className="flex items-center gap-8">
          <Link href="/" className="font-heading font-bold text-2xl text-[var(--tribe-brand)]">
            {businessInfo.business_name || 'My Business'}
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-[var(--tribe-brand)] transition-colors">Home</Link>
            <Link href="/services" className="hover:text-[var(--tribe-brand)] transition-colors">Services</Link>
            
            {serviceAreas.length > 0 && (
              <div className="relative group">
                <span className="hover:text-[var(--tribe-brand)] transition-colors cursor-pointer flex items-center gap-1">
                  Service Areas
                </span>
                <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--tribe-surface)] border border-[var(--tribe-border)] shadow-xl rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="py-2">
                    {serviceAreas.map(area => (
                      <Link 
                        key={area.id} 
                        href={`/${area.slug}`}
                        className="block px-4 py-2 hover:bg-[var(--tribe-surface)] hover:text-[var(--tribe-brand)]"
                      >
                        {area.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <Link href="/about" className="hover:text-[var(--tribe-brand)] transition-colors">About</Link>
            {blogEnabled && <Link href="/blog" className="hover:text-[var(--tribe-brand)] transition-colors">Blog</Link>}
            <Link href="/contact" className="hover:text-[var(--tribe-brand)] transition-colors">Contact</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {businessInfo.phone && (
            <a 
              href={`tel:${businessInfo.phone}`}
              className="hidden lg:flex items-center gap-2 text-[var(--tribe-brand)] font-semibold"
            >
              <Phone className="w-4 h-4" />
              {businessInfo.phone}
            </a>
          )}
          <Link href="/contact" className={`${styles.buttonPrimary} hidden md:inline-flex`}>
            Get a Quote
          </Link>
          
          <button className="md:hidden p-2 text-[var(--tribe-text)]">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
