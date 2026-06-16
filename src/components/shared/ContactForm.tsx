'use client';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

// ─── US States ───────────────────────────────────────────────────────────────
const US_STATES: [string, string][] = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],
  ['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],
  ['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],
  ['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],
  ['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],
  ['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],
  ['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],
  ['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],
  ['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],
  ['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],
  ['WI','Wisconsin'],['WY','Wyoming'],
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface AddressData {
  street: string;
  city:   string;
  state:  string;
  zip:    string;
  full:   string;
}

interface ContactFormProps {
  source?:          string;  // 'contact_page' | 'hero_cta' | 'service_cta'
  ctaLabel?:        string;  // Button label override
  successHeading?:  string;  // Success state heading (default: "Message Sent!")
  successMessage?:  string;  // Success state paragraph (default: "Thank you for reaching out...")
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ContactForm({
  source          = 'website',
  ctaLabel        = 'Send Message',
  successHeading  = 'Message Sent!',
  successMessage  = 'Thank you for reaching out. We will get back to you shortly.',
}: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Address mode — 'google' if API key is present, else always 'manual'
  const hasGoogleKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY);
  const [addressMode, setAddressMode] = useState<'google' | 'manual'>(
    hasGoogleKey ? 'google' : 'manual'
  );
  const [googleAddress, setGoogleAddress] = useState<AddressData>({
    street: '', city: '', state: '', zip: '', full: '',
  });

  const googleInputRef = useRef<HTMLInputElement>(null);

  // ── Load Google Places script when in google mode ─────────────────────────
  useEffect(() => {
    if (addressMode !== 'google' || !hasGoogleKey) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!;
    const scriptId = 'google-places-script';

    const initAutocomplete = () => {
      if (!googleInputRef.current || !(window as any).google?.maps?.places) return;
      const ac = new (window as any).google.maps.places.Autocomplete(
        googleInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'formatted_address'],
        }
      );
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.address_components) return;
        const parsed = parseGoogleComponents(place.address_components);
        setGoogleAddress({
          ...parsed,
          full: place.formatted_address || '',
        });
      });
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id    = scriptId;
      script.src   = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
    } else if ((window as any).google?.maps?.places) {
      initAutocomplete();
    }
  }, [addressMode, hasGoogleKey]);

  // ── Parse Google Places address_components ────────────────────────────────
  function parseGoogleComponents(components: any[]): Omit<AddressData, 'full'> {
    const get = (type: string) =>
      components.find((c: any) => c.types.includes(type))?.short_name || '';
    return {
      street: [get('street_number'), get('route')].filter(Boolean).join(' '),
      city:   get('locality') || get('sublocality'),
      state:  get('administrative_area_level_1'),
      zip:    get('postal_code'),
    };
  }

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    // Build address fields — from Google result or manual inputs
    const addrStreet = addressMode === 'manual'
      ? String(data.address_street || '')
      : googleAddress.street;
    const addrCity   = addressMode === 'manual'
      ? String(data.address_city   || '')
      : googleAddress.city;
    const addrState  = addressMode === 'manual'
      ? String(data.address_state  || '')
      : googleAddress.state;
    const addrZip    = addressMode === 'manual'
      ? String(data.address_zip    || '')
      : googleAddress.zip;
    const addrFull   = addressMode === 'manual'
      ? [addrStreet, addrCity, addrState, addrZip].filter(Boolean).join(', ')
      : googleAddress.full;

    const body = {
      name:           data.name,
      email:          data.email,
      phone:          data.phone,
      message:        data.message || '',
      source,
      address_street: addrStreet,
      address_city:   addrCity,
      address_state:  addrState,
      address_zip:    addrZip,
      address_full:   addrFull,
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="bg-[color-mix(in_srgb,var(--tribe-success)_10%,transparent)] border border-[color-mix(in_srgb,var(--tribe-success)_30%,transparent)] text-[var(--tribe-text)] p-6 rounded-xl text-center">
        <h3 className="font-semibold text-lg mb-2">{successHeading}</h3>
        <p>{successMessage}</p>
        <Button variant="outline" className="mt-4" onClick={() => setStatus('idle')}>
          Send Another Message
        </Button>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">

      {/* Core fields */}
      <Input label="Name" name="name" required placeholder="John Doe" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Email" name="email" type="email" required placeholder="john@example.com" />
        <Input label="Phone" name="phone" type="tel" required placeholder="(555) 555-5555" />
      </div>
      <Textarea label="Message" name="message" rows={3} placeholder="How can we help you?" />

      {/* Address section */}
      <div className="space-y-2">
        {/* Label row + mode toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--tribe-text)]">Address</span>
          {hasGoogleKey && (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setAddressMode('google')}
                className={`px-2.5 py-1 rounded-full border transition-colors ${
                  addressMode === 'google'
                    ? 'bg-[var(--tribe-brand)] text-[var(--tribe-brand-text)] border-[var(--tribe-brand)]'
                    : 'border-[var(--tribe-border)] text-[var(--tribe-text-muted)] hover:border-[var(--tribe-accent)]'
                }`}
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setAddressMode('manual')}
                className={`px-2.5 py-1 rounded-full border transition-colors ${
                  addressMode === 'manual'
                    ? 'bg-[var(--tribe-brand)] text-[var(--tribe-brand-text)] border-[var(--tribe-brand)]'
                    : 'border-[var(--tribe-border)] text-[var(--tribe-text-muted)] hover:border-[var(--tribe-accent)]'
                }`}
              >
                Enter manually
              </button>
            </div>
          )}
        </div>

        {/* Google Places input */}
        {addressMode === 'google' && hasGoogleKey && (
          <div>
            <input
              ref={googleInputRef}
              type="text"
              placeholder="Start typing your address..."
              className="w-full rounded-lg border border-[var(--tribe-input-border)] bg-[var(--tribe-input-bg)] text-[var(--tribe-text)] px-4 py-2.5 text-sm placeholder:text-[var(--tribe-text-muted)] outline-none focus:border-[var(--tribe-border-focus)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tribe-border-focus)_30%,transparent)] transition-colors"
            />
            {googleAddress.full && (
              <p className="mt-1.5 text-xs text-[var(--tribe-success)] font-medium">
                ✓ {googleAddress.full}
              </p>
            )}
          </div>
        )}

        {/* Manual address fields */}
        {addressMode === 'manual' && (
          <div className="space-y-3">
            <input
              name="address_street"
              type="text"
              placeholder="Street address"
              className="w-full rounded-lg border border-[var(--tribe-input-border)] bg-[var(--tribe-input-bg)] text-[var(--tribe-text)] px-4 py-2.5 text-sm placeholder:text-[var(--tribe-text-muted)] outline-none focus:border-[var(--tribe-border-focus)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tribe-border-focus)_30%,transparent)] transition-colors"
            />
            <div className="grid grid-cols-5 gap-3">
              <input
                name="address_city"
                type="text"
                placeholder="City"
                className="col-span-2 w-full rounded-lg border border-[var(--tribe-input-border)] bg-[var(--tribe-input-bg)] text-[var(--tribe-text)] px-4 py-2.5 text-sm placeholder:text-[var(--tribe-text-muted)] outline-none focus:border-[var(--tribe-border-focus)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tribe-border-focus)_30%,transparent)] transition-colors"
              />
              <select
                name="address_state"
                className="col-span-2 w-full rounded-lg border border-[var(--tribe-input-border)] bg-[var(--tribe-input-bg)] px-3 py-2.5 text-sm text-[var(--tribe-text)] outline-none focus:border-[var(--tribe-border-focus)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tribe-border-focus)_30%,transparent)] transition-colors"
              >
                <option value="">State</option>
                {US_STATES.map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
              <input
                name="address_zip"
                type="text"
                placeholder="ZIP"
                maxLength={5}
                className="col-span-1 w-full rounded-lg border border-[var(--tribe-input-border)] bg-[var(--tribe-input-bg)] text-[var(--tribe-text)] px-4 py-2.5 text-sm placeholder:text-[var(--tribe-text-muted)] outline-none focus:border-[var(--tribe-border-focus)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tribe-border-focus)_30%,transparent)] transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {status === 'error' && (
        <div className="text-[var(--tribe-error)] text-sm font-medium p-3 bg-[color-mix(in_srgb,var(--tribe-error)_10%,transparent)] rounded-lg">
          {errorMessage}
        </div>
      )}

      <Button type="submit" isLoading={status === 'loading'} className="w-full">
        {ctaLabel}
      </Button>
    </form>
  );
}
