import type { ServiceAreaProps } from '@/types/template';
import { styles } from './theme';
import { BlockNoteRenderer } from '@/components/shared/BlockNoteRenderer';
import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';

export function ServiceAreaPage({ area, businessInfo, services, resolvedCopy, config }: ServiceAreaProps) {
  return (
    <article className="bg-[var(--tribe-surface)]">
      {/* Hero */}
      <div className="bg-[var(--tribe-surface)] py-20 lg:py-28 border-b border-[var(--tribe-border)]">
        <div className={`${styles.container} text-center`}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-[var(--tribe-brand)] mb-8">
            <MapPin className="w-8 h-8" />
          </div>
          <div className="max-w-4xl mx-auto">
            <h1 className={`${styles.headingBase} text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[var(--tribe-heading)]`}>
              {resolvedCopy.h1}
            </h1>
            <p className="text-xl md:text-2xl text-[var(--tribe-text)] leading-relaxed">
              {resolvedCopy.intro}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-20 py-16">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="prose prose-lg prose-slate max-w-none">
              {area.page_content && <BlockNoteRenderer content={area.page_content} />}
            </div>

            {/* Services List for this Area */}
            {services.length > 0 && (
              <div className="mt-16">
                <h3 className="text-3xl font-bold text-[var(--tribe-heading)] mb-8">Services We Offer in {area.name}</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {services.map(service => (
                    <Link key={service.id} href={`/services/${service.slug}`} className="p-6 rounded-2xl border border-[var(--tribe-border)] hover:border-[var(--tribe-brand)] hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-2xl">{service.icon}</span>
                        <h4 className="font-bold text-lg text-[var(--tribe-heading)] group-hover:text-[var(--tribe-brand)] transition-colors">{service.name}</h4>
                      </div>
                      <p className="text-[var(--tribe-text)] text-sm">{service.short_description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-[var(--tribe-brand)] text-[var(--tribe-brand-text)] p-8 rounded-3xl shadow-xl text-center">
              <h3 className="font-bold text-2xl mb-4">Book Your Service in {area.name}</h3>
              <p className="text-[var(--tribe-text)]/80 mb-8">Fast, reliable, and local experts ready to help.</p>
              
              {businessInfo.phone && (
                <a href={`tel:${businessInfo.phone}`} className="w-full bg-[var(--tribe-surface)] text-[var(--tribe-brand)] hover:bg-[var(--tribe-surface)] transition-colors px-6 py-4 rounded-xl font-bold inline-flex items-center justify-center mb-4 shadow-md">
                  <Phone className="w-5 h-5 mr-2" />
                  {businessInfo.phone}
                </a>
              )}
              
              <Link href="/contact" className="w-full border-2 border-white/30 hover:border-white hover:bg-[var(--tribe-surface)]/10 transition-colors text-[var(--tribe-text)] px-6 py-4 rounded-xl font-bold inline-flex items-center justify-center">
                Contact Us Online
              </Link>
            </div>
          </div>

        </div>
      </div>
    </article>
  );
}
