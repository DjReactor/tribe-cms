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
  city: string
  state?: string
  zip?: string
  google_maps_url: string
  license_number: string
  year_established: number
  employee_count: '1-5' | '6-20' | '21-50' | '51+' | ''
  short_description: string
  emergency_service: 'No' | 'Yes — Business Hours' | 'Yes — 24/7' | ''
  service_radius: number
  business_type: string
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
  page_content: unknown[] | null
  seo_title: string
  seo_description: string
  cover_image_url: string
  noindex?: boolean
  updated?: string
}

export interface ServiceArea {
  id: string
  name: string
  slug: string
  is_active: boolean
  sort_order: number
  custom_h1: string
  custom_intro: string
  page_content: unknown[] | null
  seo_title: string
  seo_description: string
  noindex?: boolean
  geo_latitude?: string
  geo_longitude?: string
  updated?: string
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

export type ProjectStatus = 'planned' | 'in_progress' | 'completed'

export interface Project {
  id: string
  title: string
  slug: string
  summary: string
  services: Service[]
  location?: {
    city: string
    state?: string
  }
  status: ProjectStatus
  completed_at?: string
  cover_image_url: string
  gallery_image_urls?: string[]
  content?: {
    problem?: string
    solution?: string
    process?: string
    outcome?: string
  }
  testimonial?: {
    quote: string
    client: string
    client_info?: string
    client_image_url?: string
    rating?: number
  }
  featured?: boolean
  is_active: boolean
  sort_order: number
  seo_title: string
  seo_description: string
  canonical_url?: string
  og_image_url?: string
  noindex?: boolean
  updated?: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: unknown[]
  excerpt: string
  cover_image_url: string
  status: 'draft' | 'published'
  author_type: 'manual' | 'auto'
  published_at: string
  seo_title: string
  seo_description: string
  noindex?: boolean
  canonical_url?: string
  updated?: string
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

/**
 * Describes one user-editable text slot declared by a template.
 * Used by the dashboard to dynamically generate the Site Content editor.
 */
export interface TemplateCopyKey {
  label: string               // Human-readable label shown in the dashboard
  default: string             // Default value — may include {{tokens}}
  type?: 'text' | 'textarea'  // 'text' for short strings, 'textarea' for paragraphs
  page?: string               // Tab grouping label e.g. "Home Page", "About Page"
  hint?: string               // Optional helper text shown below the input
}

export interface TemplateManifest {
  name: string
  slug: string
  supportedImageKeys: Record<string, TemplateImageSlot>
  supportedCopyKeys: Record<string, TemplateCopyKey>
}

export interface SeoSettings {
  id: string
  schema_business_type: string
  schema_price_range?: string
  enable_aggregate_rating?: boolean
  enable_breadcrumbs?: boolean
  title_separator: string
  site_name?: string
  twitter_handle?: string
  google_verification?: string
  bing_verification?: string
  noindex_blog?: boolean
  noindex_service_areas?: boolean
  custom_robots_rules?: string
  default_og_image?: string
}

export interface TemplateSettings {
  blog_enabled: boolean
  projects_enabled?: boolean
  service_areas_index_enabled?: boolean
  show_powered_by: boolean
  active_template: string
  active_palette_id?: string
  crm_enabled?: boolean
  retell_enabled?: boolean
  reviews_enabled?: boolean
  lead_webhook_url?: string
  lead_webhook_secret?: string  // Server-side only — do not use in templates
  template_config?: {
    imageOverrides?: Record<string, string>
    copyOverrides?: Record<string, string>   // User-saved overrides for template copy slots
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
