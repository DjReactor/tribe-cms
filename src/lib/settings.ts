import { getPocketBaseClient } from './pocketbase';
import type { TemplateSettings, BusinessInfo, SeoSettings } from '@/types/index';
import { cache } from 'react';

export const getSettings = cache(async (): Promise<TemplateSettings & { id: string; template_config: any }> => {
  try {
    const pb = await getPocketBaseClient();
    const record = await pb.collection('settings').getFirstListItem('');
    if (record) {
      return {
        id: record.id,
        blog_enabled: record.blog_enabled ?? false,
        projects_enabled: record.projects_enabled ?? false,
        crm_enabled: record.crm_enabled ?? false,
        retell_enabled: record.retell_enabled ?? false,
        reviews_enabled: record.reviews_enabled ?? false,
        show_powered_by: record.show_powered_by ?? false,
        active_template: record.active_template || 'modern',
        active_palette_id: record.active_palette_id || '',
        palette_source: (record.palette_source as 'template' | 'cms') || 'template',
        template_palette_overrides: record.template_palette_overrides || {},
        cms_palette: record.cms_palette || null,
        template_config: record.template_config || {},
        lead_webhook_url:    record.lead_webhook_url    || '',
        lead_webhook_secret: record.lead_webhook_secret || '',
        niche_schema: record.niche_schema || undefined,
      };
    }
  } catch (e) {
    // console.error(e);
  }
  // Default mock settings
  return {
    id: 'mock',
    blog_enabled: true,
    projects_enabled: true,
    crm_enabled: true,
    retell_enabled: true,
    reviews_enabled: true,
    show_powered_by: true,
    active_template: 'modern',
    active_palette_id: '',
    palette_source: 'template' as const,
    template_palette_overrides: {},
    cms_palette: null,
    template_config: {},
    lead_webhook_url:    '',
    lead_webhook_secret: '',
    niche_schema: undefined,
  };
});

export const getSeoSettings = cache(async (): Promise<SeoSettings | null> => {
  try {
    const pb = await getPocketBaseClient();
    const record = await pb.collection('seo_settings').getFirstListItem<SeoSettings>('');
    return record || null;
  } catch {
    return null;
  }
});

export const getBusinessInfo = cache(async (): Promise<BusinessInfo> => {
  try {
    const pb = await getPocketBaseClient();
    const record = await pb.collection('business_info').getFirstListItem<BusinessInfo>('');
    if (record) return record;
  } catch (e) {
    // console.error(e);
  }
  
  // Default mock info
  return {
    id: 'mock',
    business_name: 'Tribe CMS Preview',
    tagline: 'Your Trusted Local Partner',
    phone: '(555) 123-4567',
    email: 'contact@example.com',
    address: '123 Preview St, City, ST 12345',
    google_maps_url: '',
    license_number: '',
    year_established: 2010,
    employee_count: '1-5',
    short_description: 'We are a dedicated local service provider...',
    emergency_service: 'No',
    service_radius: 50,
    business_type: 'LocalBusiness',
    city: 'City',
    hours: [],
    social_facebook: '',
    social_instagram: '',
    social_google: '',
    social_yelp: '',
    social_other: '',
  };
});
