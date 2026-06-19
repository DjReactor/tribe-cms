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
  short_description: z.string().max(300, 'Max 300 characters').optional(),
  social_facebook: z.string().url('Invalid URL').optional().or(z.literal('')),
  social_instagram: z.string().url('Invalid URL').optional().or(z.literal('')),
  social_google: z.string().url('Invalid URL').optional().or(z.literal('')),
  niche_attributes: z.record(z.string(), z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

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
  const nicheAttributes = watch('niche_attributes') || {};

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = await updateBusinessInfo(data);
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
          if (currentMediaField) {
            setValue(`niche_attributes.${currentMediaField}` as any, url, { shouldDirty: true });
          }
        }}
      />
    </form>
  );
}
