import { getPocketBaseClient } from './pocketbase';
import type { TemplateSettings, BusinessInfo } from '@/types/index';
import { cache } from 'react';

export const getSettings = cache(async (): Promise<TemplateSettings & { id: string; template_config: any }> => {
  try {
    const pb = await getPocketBaseClient();
    const records = await pb.collection('settings').getFullList(1);
    if (records[0]) {
      return {
        id: records[0].id,
        blog_enabled: records[0].blog_enabled ?? false,
        crm_enabled: records[0].crm_enabled ?? false,
        retell_enabled: records[0].retell_enabled ?? false,
        reviews_enabled: records[0].reviews_enabled ?? false,
        show_powered_by: records[0].show_powered_by ?? false,
        active_template: records[0].active_template || 'modern',
        active_palette_id: records[0].active_palette_id || '',
        template_config: records[0].template_config || {},
        lead_webhook_url:    records[0].lead_webhook_url    || '',
        lead_webhook_secret: records[0].lead_webhook_secret || '',
        niche_schema: records[0].niche_schema || null,
      };
    }
  } catch (e) {
    // console.error(e);
  }
  // Default mock settings
  return {
    id: 'mock',
    blog_enabled: true,
    crm_enabled: true,
    retell_enabled: true,
    reviews_enabled: true,
    show_powered_by: true,
    active_template: 'modern',
    active_palette_id: '',
    template_config: {},
    lead_webhook_url:    '',
    lead_webhook_secret: '',
    niche_schema: null,
  };
});

export const getBusinessInfo = cache(async (): Promise<BusinessInfo> => {
  try {
    const pb = await getPocketBaseClient();
    const records = await pb.collection('business_info').getFullList<BusinessInfo>(1);
    if (records[0]) return records[0];
  } catch (e) {
    // console.error(e);
  }
  
  // Default mock info
  return {
    id: 'mock',
    business_name: 'SuccessForce Preview',
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
