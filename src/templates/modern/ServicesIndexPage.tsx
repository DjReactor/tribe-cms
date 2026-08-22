import type { ServicesIndexProps } from '@/types/template';
import type { ServiceNode } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { styles } from './theme';

/**
 * Services can be nested up to three tiers. `servicesDisplayMode` arrives
 * already resolved ('auto' has been decided upstream), so this page only has to
 * honour two layouts:
 *
 *   flat — every service, any tier, in one grid.
 *   tree — a section per top-level service, its children as cards beneath, and
 *          any third-tier services as links inside their parent's card.
 *
 * Each node carries a ready-made `path`, so nothing here builds a URL.
 */
function ServiceCard({ service }: { service: ServiceNode }) {
  return (
    <div className="group flex flex-col h-full bg-[var(--tribe-surface)] rounded-2xl overflow-hidden border border-[var(--tribe-border)] hover:border-[var(--tribe-brand)] hover:shadow-xl transition-all">
      <Link href={service.path} className="flex flex-col flex-1">
        {service.cover_image_url ? (
          <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
            <Image src={service.cover_image_url} alt={service.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        ) : (
          <div className="aspect-video w-full bg-slate-100 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
            {service.icon || '✦'}
          </div>
        )}
        <div className="p-8 flex-1 flex flex-col">
          <h3 className={`${styles.headingBase} text-2xl font-bold mb-4 group-hover:text-[var(--tribe-brand)] transition-colors`}>
            {service.name}
          </h3>
          <p className="text-[var(--tribe-text)] mb-6 flex-1">{service.short_description}</p>
          <span className="font-semibold text-[var(--tribe-brand)] inline-flex items-center gap-1 group-hover:translate-x-2 transition-transform">
            Learn more <span>→</span>
          </span>
        </div>
      </Link>

      {/* Third tier: listed inside the parent card rather than given a section
          of their own, which would bury the top-level services. */}
      {service.children.length > 0 && (
        <div className="px-8 pb-8 -mt-2">
          <ul className="border-t border-[var(--tribe-border)] pt-4 space-y-2">
            {service.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={child.path}
                  className="text-sm text-[var(--tribe-text)] hover:text-[var(--tribe-brand)] transition-colors inline-flex items-center gap-2"
                >
                  <span className="text-[var(--tribe-brand)]">›</span>
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ServicesIndexPage({
  services,
  serviceTree,
  servicesDisplayMode,
  resolvedCopy,
}: ServicesIndexProps) {
  const isEmpty = services.length === 0;

  return (
    <div className="py-20 bg-[var(--tribe-surface)] min-h-screen">
      <div className={styles.container}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className={`${styles.headingBase} text-4xl md:text-5xl font-bold mb-6`}>{resolvedCopy.services_heading}</h1>
          <p className="text-xl text-[var(--tribe-text)]">{resolvedCopy.intro}</p>
        </div>

        {isEmpty && (
          <div className="text-center py-20 bg-[var(--tribe-surface)] rounded-3xl border border-[var(--tribe-border)]">
            <p className="text-[var(--tribe-text-muted)] text-lg">Check back soon for our list of services.</p>
          </div>
        )}

        {!isEmpty && servicesDisplayMode === 'flat' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Link
                key={service.id}
                href={service.path}
                className="group flex flex-col h-full bg-[var(--tribe-surface)] rounded-2xl overflow-hidden border border-[var(--tribe-border)] hover:border-[var(--tribe-brand)] hover:shadow-xl transition-all"
              >
                {service.cover_image_url ? (
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <Image src={service.cover_image_url} alt={service.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-slate-100 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
                    {service.icon || '✦'}
                  </div>
                )}
                <div className="p-8 flex-1 flex flex-col">
                  <h2 className={`${styles.headingBase} text-2xl font-bold mb-4 group-hover:text-[var(--tribe-brand)] transition-colors`}>
                    {service.name}
                  </h2>
                  <p className="text-[var(--tribe-text)] mb-6 flex-1">{service.short_description}</p>
                  <span className="font-semibold text-[var(--tribe-brand)] inline-flex items-center gap-1 group-hover:translate-x-2 transition-transform">
                    Learn more <span>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isEmpty && servicesDisplayMode === 'tree' && (
          <div className="space-y-20">
            {serviceTree.map((root) => (
              <section key={root.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8 pb-4 border-b border-[var(--tribe-border)]">
                  <h2 className={`${styles.headingBase} text-3xl font-bold`}>
                    <Link href={root.path} className="hover:text-[var(--tribe-brand)] transition-colors">
                      {root.name}
                    </Link>
                  </h2>
                  <Link
                    href={root.path}
                    className="font-semibold text-[var(--tribe-brand)] inline-flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    View {root.name} <span>→</span>
                  </Link>
                </div>

                {root.short_description && (
                  <p className="text-lg text-[var(--tribe-text)] mb-8 max-w-3xl">{root.short_description}</p>
                )}

                {/* A top-level service with no children still deserves a card,
                    otherwise it would render as a bare heading. */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(root.children.length > 0 ? root.children : [root]).map((child) => (
                    <ServiceCard key={child.id} service={child} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
