import type { ContactPageProps } from '@/types/template';
import { styles } from './theme';
import { ContactForm } from '@/components/shared/ContactForm';
import { BusinessHours } from '@/components/shared/BusinessHours';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export function ContactPage({ businessInfo, resolvedCopy, config }: ContactPageProps) {
  // Convert map share URL to embed URL if needed
  let embedUrl = '';
  if (businessInfo.google_maps_url) {
    if (businessInfo.google_maps_url.includes('/maps/embed?')) {
      embedUrl = businessInfo.google_maps_url;
    } else if (businessInfo.google_maps_url.includes('/maps?')) {
      embedUrl = businessInfo.google_maps_url.replace('/maps?', '/maps/embed?') + '&output=embed';
    }
  }

  return (
    <div className="py-20 bg-[var(--tribe-surface)]">
      <div className={styles.container}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className={`${styles.headingBase} text-4xl md:text-5xl font-bold mb-6`}>{resolvedCopy.contact_heading}</h1>
          <p className="text-xl text-[var(--tribe-text)]">{resolvedCopy.subheading}</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          <div className="lg:col-span-3 bg-[var(--tribe-surface)] p-8 md:p-12 rounded-3xl border border-[var(--tribe-border)] shadow-lg">
            <ContactForm />
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[var(--tribe-surface)] p-8 rounded-2xl border border-[var(--tribe-border)] shadow-sm space-y-6">
              <h3 className="font-bold text-xl text-[var(--tribe-heading)] border-b border-[var(--tribe-border)] pb-4">Contact Info</h3>
              
              {businessInfo.phone && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[var(--tribe-brand)] shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--tribe-text-muted)] font-medium">Phone</p>
                    <a href={`tel:${businessInfo.phone}`} className="font-semibold text-lg hover:text-[var(--tribe-brand)] transition-colors">{businessInfo.phone}</a>
                  </div>
                </div>
              )}
              
              {businessInfo.email && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[var(--tribe-brand)] shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--tribe-text-muted)] font-medium">Email</p>
                    <a href={`mailto:${businessInfo.email}`} className="font-semibold text-lg hover:text-[var(--tribe-brand)] transition-colors">{businessInfo.email}</a>
                  </div>
                </div>
              )}

              {businessInfo.address && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[var(--tribe-brand)] shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--tribe-text-muted)] font-medium">Location</p>
                    <p className="font-semibold text-lg">{businessInfo.address}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[var(--tribe-bg)] text-[var(--tribe-text)] p-8 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                <Clock className="w-6 h-6 text-blue-400" />
                <h3 className="font-bold text-xl">Business Hours</h3>
              </div>
              <BusinessHours hours={businessInfo.hours} className="text-slate-300" />
            </div>

          </div>
        </div>

        {/* Map Embed */}
        {businessInfo.google_maps_url && (
          <div className="mt-20">
            {embedUrl ? (
              <div className="w-full h-96 rounded-2xl overflow-hidden shadow-sm border border-[var(--tribe-border)]">
                <iframe 
                  src={embedUrl}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="text-center">
                <a href={businessInfo.google_maps_url} target="_blank" rel="noopener noreferrer" className={styles.buttonSecondary}>
                  View on Google Maps
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
