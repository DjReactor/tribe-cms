import type { ServiceAreasIndexPageProps } from '@/types/template';
import type { ServiceAreaNode } from '@/types';
import { styles } from './theme';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

/**
 * The area tree, grouped by tier: State › County › City › Neighborhood.
 *
 * Every area's URL is FLAT whatever its tier (`/santa-rosa`, never
 * `/california/sonoma-county/santa-rosa`), so this page is the main place the
 * geography is actually visible to a visitor. Each node carries its own `path`
 * — nothing here assembles a URL from slugs.
 */
function AreaBranch({ area, level }: { area: ServiceAreaNode; level: number }) {
  return (
    <li>
      <Link
        href={area.path}
        className={`inline-flex items-center gap-2 hover:text-[var(--tribe-brand)] transition-colors ${
          level === 0 ? 'font-bold text-lg text-[var(--tribe-heading)]' : 'text-[var(--tribe-text)]'
        }`}
      >
        {level === 0 && <MapPin className="w-4 h-4 text-[var(--tribe-brand)]" />}
        {area.name}
      </Link>
      {area.children.length > 0 && (
        <ul className="mt-3 ml-5 space-y-2 border-l border-[var(--tribe-border)] pl-5">
          {area.children.map(child => (
            <AreaBranch key={child.id} area={child} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ServiceAreasIndexPage({
  serviceAreas,
  areaTree,
  businessInfo,
  resolvedCopy,
}: ServiceAreasIndexPageProps) {
  return (
    <article className="bg-[var(--tribe-surface)]">
      <div className="bg-[var(--tribe-bg)] py-20 lg:py-28 border-b border-[var(--tribe-border)]">
        <div className={`${styles.container} text-center max-w-3xl mx-auto`}>
          <h1 className={`${styles.headingBase} text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[var(--tribe-heading)]`}>
            {resolvedCopy.service_areas_heading || 'Where We Work'}
          </h1>
          <p className="text-xl text-[var(--tribe-text)] leading-relaxed">
            {resolvedCopy.service_areas_intro
              || `Areas served by ${businessInfo.business_name}.`}
          </p>
        </div>
      </div>

      <div className={`${styles.container} py-16`}>
        {areaTree.length > 0 ? (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {areaTree.map(root => (
              <div key={root.id} className="p-8 rounded-3xl border border-[var(--tribe-border)]">
                <ul className="space-y-3">
                  <AreaBranch area={root} level={0} />
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-[var(--tribe-text-muted)]">
            Service areas are coming soon.
          </p>
        )}

        {serviceAreas.length > 0 && (
          <p className="mt-16 text-center text-[var(--tribe-text-muted)]">
            {serviceAreas.length} area{serviceAreas.length === 1 ? '' : 's'} served.
          </p>
        )}
      </div>
    </article>
  );
}
