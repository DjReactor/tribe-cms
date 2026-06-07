export interface BusinessHour {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  enabled: boolean
  open: string
  close: string
}

export interface BusinessInfo {
  id: string
  business_name: string
  tagline: string
  phone: string
  email: string
  address: string
  google_maps_url: string
  license_number: string
  year_established: number
  employee_count: '1-5' | '6-20' | '21-50' | '51+' | ''
  short_description: string
  emergency_service: 'No' | 'Yes — Business Hours' | 'Yes — 24/7' | ''
  service_radius: number
  business_type: string
  city: string
  hours: BusinessHour[]
  social_facebook: string
  social_instagram: string
  social_google: string
  social_yelp: string
  social_other: string
  niche_attributes?: Record<string, string>
}

export interface Service {
  id: string
  name: string
  slug: string
  short_description: string
  icon: string
  is_active: boolean
  sort_order: number
  page_content: Record<string, unknown> | null
  seo_title: string
  seo_description: string
  cover_image_url: string
}

export interface ServiceArea {
  id: string
  name: string
  slug: string
  is_active: boolean
  sort_order: number
  custom_h1: string
  custom_intro: string
  page_content: Record<string, unknown> | null
  seo_title: string
  seo_description: string
}

export interface Testimonial {
  id: string
  author_name: string
  author_photo_url: string
  title: string
  author_location: string
  rating: number
  content: string
  is_visible: boolean
  source: 'manual' | 'google' | 'retell' | 'trustpilot' | 'houzz' | 'yelp' | 'facebook'
  sort_order: number
}

export interface BeforeAfterPair {
  id: string
  title: string
  description: string
  before_image_url: string
  after_image_url: string
  is_active: boolean
  sort_order: number
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: Record<string, unknown>
  excerpt: string
  cover_image_url: string
  status: 'draft' | 'published'
  author_type: 'manual' | 'auto'
  published_at: string
  seo_title: string
  seo_description: string
}

export interface MediaItem {
  id: string
  file: string
  label: string
  category: 'hero' | 'gallery' | 'team' | 'logo' | 'other' | ''
  alt_text: string
  sort_order: number
}

export interface TemplateImageSlot {
  label: string
  defaultFallback: string
}

export interface TemplateManifest {
  name: string
  slug: string
  supportedImageKeys: Record<string, TemplateImageSlot>
}

export interface SeoSettings {
  id: string
  schema_business_type: string
  enable_aggregate_rating: boolean
  title_separator: string
}

export interface TemplateSettings {
  blog_enabled: boolean
  show_powered_by: boolean
  active_template: string
  crm_enabled?: boolean
  retell_enabled?: boolean
  reviews_enabled?: boolean
  lead_webhook_url?: string
  template_config?: {
    imageOverrides?: Record<string, string>
    [key: string]: any
  }
  niche_schema?: NicheSchema
}

export interface NicheSchemaField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'image'
  required?: boolean
}

export interface NicheSchema {
  niche_id: string
  niche_name: string
  custom_attributes: NicheSchemaField[]
}
