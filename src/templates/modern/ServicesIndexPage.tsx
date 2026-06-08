import type { ServicesIndexProps } from '@/types/template';
import Link from 'next/link';
import { styles } from './theme';

export function ServicesIndexPage({ services, businessInfo, resolvedCopy, config }: ServicesIndexProps) {
  return (
    <div className="py-20 bg-[var(--sf-surface)] min-h-screen">
      <div className={styles.container}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className={`${styles.headingBase} text-4xl md:text-5xl font-bold mb-6`}>{resolvedCopy.heading}</h1>
          <p className="text-xl text-[var(--sf-text)]">{resolvedCopy.intro}</p>
        </div>

        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(service => (
              <Link 
                key={service.id} 
                href={`/services/${service.slug}`}
                className="group flex flex-col h-full bg-[var(--sf-surface)] rounded-2xl overflow-hidden border border-[var(--sf-border)] hover:border-[var(--sf-brand)] hover:shadow-xl transition-all"
              >
                {service.cover_image_url ? (
                  <div className="aspect-video w-full overflow-hidden bg-slate-100">
                    <img src={service.cover_image_url} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-slate-100 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
                    {service.icon || '✦'}
                  </div>
                )}
                <div className="p-8 flex-1 flex flex-col">
                  <h2 className={`${styles.headingBase} text-2xl font-bold mb-4 group-hover:text-[var(--sf-brand)] transition-colors`}>
                    {service.name}
                  </h2>
                  <p className="text-[var(--sf-text)] mb-6 flex-1">{service.short_description}</p>
                  <span className="font-semibold text-[var(--sf-brand)] inline-flex items-center gap-1 group-hover:translate-x-2 transition-transform">
                    Learn more <span>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[var(--sf-surface)] rounded-3xl border border-[var(--sf-border)]">
            <p className="text-[var(--sf-text-muted)] text-lg">Check back soon for our list of services.</p>
          </div>
        )}
      </div>
    </div>
  );
}
