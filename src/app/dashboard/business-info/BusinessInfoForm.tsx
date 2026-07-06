'use client';

import { useForm } from 'react-hook-form';
import { useTransition, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateBusinessInfo } from '../actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Toggle } from '@/components/ui/Toggle';
import { MediaPickerModal } from '@/components/MediaPickerModal';
import type { BusinessHour } from '@/types';

const schema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  business_type: z.string().min(1, 'Business type is required'),
  tagline: z.string().optional(),
  logo_url: z.string().optional(),
  short_description: z.string().max(300, 'Max 300 characters').optional(),
  social_facebook: z.string().url('Invalid URL').optional().or(z.literal('')),
  social_instagram: z.string().url('Invalid URL').optional().or(z.literal('')),
  social_google: z.string().url('Invalid URL').optional().or(z.literal('')),
  niche_attributes: z.record(z.string(), z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

const DAYS: BusinessHour['day'][] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<BusinessHour['day'], string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};
type HoursStatus = 'open' | 'closed' | 'open24';

// Normalize a stored time to canonical 24-hour "HH:MM" so the <input type="time">
// accepts it even for legacy records still holding "08:00 am".
function to24(value: string): string {
  const raw = (value || '').trim().toLowerCase();
  if (!raw) return '';
  const iso = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (iso) return `${String(Math.min(23, parseInt(iso[1], 10))).padStart(2, '0')}:${iso[2]}`;
  const ampm = /^(\d{1,2}):(\d{2})\s*(am|pm)$/.exec(raw);
  if (!ampm) return '';
  let hour = parseInt(ampm[1], 10) % 12;
  if (ampm[3] === 'pm') hour += 12;
  return `${String(hour).padStart(2, '0')}:${ampm[2]}`;
}

// Build a stable, ordered 7-day array from whatever (possibly partial/legacy) data exists.
function buildHours(existing: BusinessHour[] | undefined): BusinessHour[] {
  const byDay = new Map((existing || []).map((h) => [h.day, h]));
  return DAYS.map((day) => {
    const h = byDay.get(day);
    return {
      day,
      enabled: h?.enabled ?? (day !== 'saturday' && day !== 'sunday'),
      open: to24(h?.open || '') || '09:00',
      close: to24(h?.close || '') || '17:00',
      open24: h?.open24 ?? false,
    };
  });
}

function statusOf(h: BusinessHour): HoursStatus {
  if (!h.enabled) return 'closed';
  if (h.open24) return 'open24';
  return 'open';
}

export default function BusinessInfoForm({ initialData, nicheSchema }: { initialData: any, nicheSchema?: any }) {
  const { addToast } = useToast();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      business_name: initialData?.business_name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      zip: initialData?.zip || '',
      business_type: initialData?.business_type || '',
      tagline: initialData?.tagline || '',
      logo_url: initialData?.logo_url || '',
      short_description: initialData?.short_description || '',
      social_facebook: initialData?.social_facebook || '',
      social_instagram: initialData?.social_instagram || '',
      social_google: initialData?.social_google || '',
      niche_attributes: initialData?.niche_attributes || {},
    }
  });

  const [isPending, startTransition] = useTransition();
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [currentMediaField, setCurrentMediaField] = useState<string | null>(null);
  const [hours, setHours] = useState<BusinessHour[]>(() => buildHours(initialData?.hours));
  const nicheAttributes = watch('niche_attributes') || {};
  const logoUrl = watch('logo_url') || '';

  const setDayStatus = (day: BusinessHour['day'], status: HoursStatus) => {
    setHours((prev) => prev.map((h) => h.day === day
      ? { ...h, enabled: status !== 'closed', open24: status === 'open24' }
      : h));
  };
  const setDayTime = (day: BusinessHour['day'], field: 'open' | 'close', value: string) => {
    setHours((prev) => prev.map((h) => h.day === day ? { ...h, [field]: value } : h));
  };

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = await updateBusinessInfo({ ...data, hours });
      if (res.success) {
        addToast({
          title: 'Changes saved',
          description: 'Your business information has been updated successfully.',
          type: 'success'
        });
      } else {
        addToast({
          title: 'Error saving changes',
          description: res.error,
          type: 'error'
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Core Identity</CardTitle>
          <CardDescription>The main details about your business.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Business Name" error={errors.business_name?.message} {...register('business_name')} />
          <Input label="Business Type (e.g. Plumber, HVAC)" error={errors.business_type?.message} {...register('business_type')} />
          <Input label="Tagline (Optional)" error={errors.tagline?.message} {...register('tagline')} className="md:col-span-2" />
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-900">Business Logo</label>
            <div className="flex items-center gap-4">
              {logoUrl && <img src={logoUrl} alt="Business logo" className="h-16 w-16 object-contain rounded border bg-white p-1" />}
              <button type="button" onClick={() => {
                setCurrentMediaField('logo_url');
                setMediaPickerOpen(true);
              }} className="px-3 py-2 bg-white border shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 rounded">
                {logoUrl ? 'Change Logo' : 'Select Logo'}
              </button>
              {logoUrl && <button type="button" onClick={() => setValue('logo_url', '', { shouldDirty: true })} className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium">Clear</button>}
            </div>
          </div>
          <Textarea label="Short Description (Max 300 chars)" error={errors.short_description?.message} {...register('short_description')} className="md:col-span-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact & Location</CardTitle>
          <CardDescription>Where and how customers can reach you.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Email Address" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Phone Number" type="tel" error={errors.phone?.message} {...register('phone')} />
          <Input label="Street Address" error={errors.address?.message} {...register('address')} className="md:col-span-2" />
          <div className="grid grid-cols-3 gap-4 md:col-span-2">
            <Input label="City" error={errors.city?.message} {...register('city')} className="col-span-1" />
            <Input label="State" error={errors.state?.message} {...register('state')} className="col-span-1" />
            <Input label="ZIP Code" error={errors.zip?.message} {...register('zip')} className="col-span-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
          <CardDescription>Shown on your site and published as structured data for Google.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hours.map((h) => {
            const status = statusOf(h);
            return (
              <div key={h.day} className="grid grid-cols-1 sm:grid-cols-[7rem_9rem_1fr] gap-3 sm:items-center">
                <span className="text-sm font-medium text-slate-900">{DAY_LABELS[h.day]}</span>
                <select
                  value={status}
                  onChange={(e) => setDayStatus(h.day, e.target.value as HoursStatus)}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="open24">Open 24 hours</option>
                </select>
                {status === 'open' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => setDayTime(h.day, 'open', e.target.value)}
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                    />
                    <span className="text-slate-400">–</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => setDayTime(h.day, 'close', e.target.value)}
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">{status === 'open24' ? 'Open all day' : 'Closed all day'}</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Profiles</CardTitle>
          <CardDescription>Links to your social media accounts.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Facebook URL" type="url" placeholder="https://facebook.com/..." error={errors.social_facebook?.message} {...register('social_facebook')} />
          <Input label="Instagram URL" type="url" placeholder="https://instagram.com/..." error={errors.social_instagram?.message} {...register('social_instagram')} />
          <Input label="Google Maps / GBP URL" type="url" placeholder="https://goo.gl/maps/..." error={errors.social_google?.message} {...register('social_google')} className="md:col-span-2" />
        </CardContent>
      </Card>

      {nicheSchema?.custom_attributes && nicheSchema.custom_attributes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{nicheSchema.niche_name} Details</CardTitle>
            <CardDescription>Specific settings and features for your business type.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nicheSchema.custom_attributes.map((attr: any) => {
              const value = nicheAttributes[attr.key] || '';
              if (attr.type === 'textarea') {
                return <Textarea key={attr.key} label={attr.label} {...register(`niche_attributes.${attr.key}` as any)} className="md:col-span-2" />;
              }
              if (attr.type === 'boolean') {
                return (
                  <Toggle 
                    key={attr.key} 
                    label={attr.label} 
                    checked={value === 'true'} 
                    onChange={(e) => setValue(`niche_attributes.${attr.key}` as any, e.target.checked ? 'true' : 'false', { shouldDirty: true })} 
                  />
                );
              }
              if (attr.type === 'image') {
                return (
                  <div key={attr.key} className="flex flex-col gap-2">
                     <label className="text-sm font-medium text-slate-900">{attr.label}</label>
                     <div className="flex items-center gap-4">
                       {value && <img src={value} alt="" className="h-16 w-16 object-cover rounded border" />}
                       <button type="button" onClick={() => {
                         setCurrentMediaField(attr.key);
                         setMediaPickerOpen(true);
                       }} className="px-3 py-2 bg-white border shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 rounded">
                         {value ? 'Change Image' : 'Select Image'}
                       </button>
                       {value && <button type="button" onClick={() => setValue(`niche_attributes.${attr.key}` as any, '', { shouldDirty: true })} className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium">Clear</button>}
                     </div>
                  </div>
                );
              }
              return <Input key={attr.key} label={attr.label} {...register(`niche_attributes.${attr.key}` as any)} />;
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-4 pb-8">
        <Button type="submit" isLoading={isPending} size="lg">
          Save Changes
        </Button>
      </div>

      <MediaPickerModal 
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => {
          if (currentMediaField === 'logo_url') {
            setValue('logo_url', url, { shouldDirty: true });
          } else if (currentMediaField) {
            setValue(`niche_attributes.${currentMediaField}` as any, url, { shouldDirty: true });
          }
        }}
      />
    </form>
  );
}
