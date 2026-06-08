import type { AboutPageProps } from '@/types/template';
import { styles } from './theme';
import { BusinessHours } from '@/components/shared/BusinessHours';
import Link from 'next/link';

export function AboutPage({ businessInfo, serviceAreas, resolvedCopy, config }: AboutPageProps) {
  return (
    <div className="py-20 bg-[var(--sf-surface)]">
      <div className={styles.container}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className={`${styles.headingBase} text-4xl md:text-5xl font-bold mb-6`}>{resolvedCopy.heading}</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <div className="prose prose-lg text-[var(--sf-text)]">
              <p className="lead text-xl text-[var(--sf-text)]">{businessInfo.short_description}</p>
              <p>We are a professional {businessInfo.business_type} serving the {businessInfo.city} area. Our commitment to quality and customer satisfaction sets us apart in the industry.</p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-[var(--sf-border)]">
              {businessInfo.year_established > 0 && (
                <div>
                  <p className="text-[var(--sf-text-muted)] text-sm mb-1">Established</p>
                  <p className="font-bold text-xl text-[var(--sf-heading)]">{businessInfo.year_established}</p>
                </div>
              )}
              {businessInfo.employee_count && (
                <div>
                  <p className="text-[var(--sf-text-muted)] text-sm mb-1">Team Size</p>
                  <p className="font-bold text-xl text-[var(--sf-heading)]">{businessInfo.employee_count} Employees</p>
                </div>
              )}
              {businessInfo.license_number && (
                <div>
                  <p className="text-[var(--sf-text-muted)] text-sm mb-1">License</p>
                  <p className="font-bold text-xl text-[var(--sf-heading)]">#{businessInfo.license_number}</p>
                </div>
              )}
            </div>

            {serviceAreas.length > 0 && (
              <div className="pt-8 border-t border-[var(--sf-border)]">
                <h3 className="font-bold text-lg mb-4 text-[var(--sf-heading)]">Service Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {serviceAreas.map(area => (
                    <Link key={area.id} href={`/${area.slug}`} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-medium transition-colors">
                      {area.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-[var(--sf-surface)] p-8 rounded-2xl border border-[var(--sf-border)] shadow-sm space-y-8">
            <div>
              <h3 className="font-bold text-xl mb-4 text-[var(--sf-heading)]">Business Hours</h3>
              <BusinessHours hours={businessInfo.hours} className="text-base" />
            </div>
            
            {businessInfo.emergency_service !== 'No' && businessInfo.emergency_service && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 font-medium">
                🚨 Emergency Service: {businessInfo.emergency_service}
              </div>
            )}

            <div className="pt-8 border-t border-[var(--sf-border)]">
              <h3 className="font-bold text-xl mb-4 text-[var(--sf-heading)]">Contact Us</h3>
              <div className="space-y-3 font-medium">
                {businessInfo.phone && <a href={`tel:${businessInfo.phone}`} className="block text-[var(--sf-brand)] hover:underline">{businessInfo.phone}</a>}
                {businessInfo.email && <a href={`mailto:${businessInfo.email}`} className="block text-[var(--sf-brand)] hover:underline">{businessInfo.email}</a>}
                {businessInfo.address && <p className="text-[var(--sf-text)]">{businessInfo.address}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
