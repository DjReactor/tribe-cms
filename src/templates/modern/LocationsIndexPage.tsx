import Link from 'next/link';
import type { LocationsIndexPageProps } from '@/types/template';
import type { Location } from '@/types';

function LocationCard({ location }: { location: Location }) {
  return (
    <Link
      href={`/locations/${location.slug}`}
      className="group block rounded-2xl p-6"
      style={{ backgroundColor: 'var(--tribe-surface)', boxShadow: '0 2px 12px var(--tribe-shadow)' }}
    >
      <h2 className="text-lg font-bold leading-snug mb-2" style={{ color: 'var(--tribe-heading)' }}>{location.area_name}</h2>
      {location.address && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--tribe-text-muted)' }}>{location.address}</p>
      )}
      {location.phone && (
        <p className="text-sm mt-2 font-medium" style={{ color: 'var(--tribe-brand)' }}>{location.phone}</p>
      )}
    </Link>
  );
}

export function LocationsIndexPage({ locations, businessInfo }: LocationsIndexPageProps) {
  return (
    <div style={{ backgroundColor: 'var(--tribe-bg)' }}>
      <section className="py-16 px-4" style={{ backgroundColor: 'var(--tribe-surface-alt)' }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--tribe-text-on-alt)' }}>Our Locations</h1>
          <p className="text-lg" style={{ color: 'var(--tribe-text-on-alt)', opacity: 0.8 }}>
            Find {businessInfo.business_name} near you.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {locations.length === 0 ? (
            <p style={{ color: 'var(--tribe-text-muted)' }}>No locations yet — check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {locations.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
