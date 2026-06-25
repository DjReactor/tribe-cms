import Link from 'next/link';
import type { LocationDetailPageProps } from '@/types/template';

export function LocationDetailPage({ location, businessInfo, relatedLocations }: LocationDetailPageProps) {
  return (
    <div style={{ backgroundColor: 'var(--tribe-bg)' }}>
      <section className="py-16 px-4" style={{ backgroundColor: 'var(--tribe-surface-alt)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--tribe-text-on-alt)', opacity: 0.7 }}>
            {businessInfo.business_name}
          </p>
          <h1 className="text-4xl font-bold" style={{ color: 'var(--tribe-text-on-alt)' }}>{location.area_name}</h1>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        <div className="grid gap-6 sm:grid-cols-2">
          {location.address && (
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--tribe-surface)', boxShadow: '0 2px 12px var(--tribe-shadow)' }}>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--tribe-text-muted)' }}>Address</h2>
              <p className="text-base" style={{ color: 'var(--tribe-text)' }}>{location.address}</p>
            </div>
          )}
          {location.phone && (
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--tribe-surface)', boxShadow: '0 2px 12px var(--tribe-shadow)' }}>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--tribe-text-muted)' }}>Phone</h2>
              <a href={`tel:${location.phone}`} className="text-base font-medium" style={{ color: 'var(--tribe-brand)' }}>{location.phone}</a>
            </div>
          )}
        </div>

        {relatedLocations.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--tribe-heading)' }}>Other Locations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedLocations.map((loc) => (
                <Link
                  key={loc.id}
                  href={`/locations/${loc.slug}`}
                  className="group block rounded-xl p-5"
                  style={{ backgroundColor: 'var(--tribe-surface)', boxShadow: '0 2px 8px var(--tribe-shadow)' }}
                >
                  <p className="font-semibold" style={{ color: 'var(--tribe-heading)' }}>{loc.area_name}</p>
                  {loc.address && <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--tribe-text-muted)' }}>{loc.address}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
