export interface BusinessHour {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  enabled: boolean
  /** Canonical 24-hour `HH:MM` (ISO-8601 time), e.g. "08:00". Ignored when `open24`. Formatted to 12h only for display. */
  open: string
  /** Canonical 24-hour `HH:MM`, e.g. "18:00". Ignored when `open24`. */
  close: string
  /** Open 24 hours on this day; overrides open/close. */
  open24?: boolean
}

export interface BusinessInfo {
  id: string
  business_name: string
  tagline: string
  logo_url: string
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
  /** Parent service id. Empty/undefined = top-level. Max 3 tiers (see lib/services.ts). */
  parent?: string
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

/** A `Service` with its children nested. Built by `buildServiceTree`. */
export interface ServiceNode extends Service {
  children: ServiceNode[]
  /** 1-based tier: a top-level service is 1. */
  depth: number
  /** Canonical public path, e.g. `/services/remodeling/kitchen`. */
  path: string
}

/** A state the business operates in. A picklist, not a place with a page. */
export interface StateItem {
  id: string
  name: string                 // "California"
  code: string                 // "CA"
  is_active: boolean
  sort_order: number
}

export interface ServiceArea {
  id: string
  name: string
  /** URL slug — globally unique; areas live at the site root (`/santa-rosa`). */
  slug: string
  /** Parent area id. Empty = top level. Max 4 tiers (see lib/area-tree.ts). */
  parent?: string
  /** State id — powers "Santa Rosa, CA" and region schema. */
  state?: string
  /** Resolved state, when the relation is expanded. */
  stateRecord?: StateItem
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
  /**
   * Places named on this area's page but given no page of their own — the tier
   * below the area tree. Page-worthy => its own `ServiceArea`; name-worthy =>
   * a string here. (Was `neighborhoods`, renamed once areas gained a 4th tier.)
   */
  also_serving?: string[] | null
  updated?: string
}

/** A `ServiceArea` with its children nested. Built by `buildAreaTree`. */
export interface ServiceAreaNode extends ServiceArea {
  children: ServiceAreaNode[]
  /** 1-based tier: a top-level area is 1. */
  depth: number
  /** Canonical public path — always flat, e.g. `/santa-rosa`. */
  path: string
}

/**
 * A landing page for exactly one service in exactly one area, at
 * `/{area.slug}/{slug}`.
 *
 * Pairs are OPT-IN RECORDS, never a computed route: an unpaired combination
 * 404s, so the page count equals what somebody actually wrote. The key is
 * `service` + `service_area` and nothing else — a third dimension would
 * reintroduce the cartesian product that reads as a doorway to Google. If
 * another axis is ever needed it belongs in the page body, not in the key.
 */
export interface Pair {
  id: string
  /** Service id — half of the unique key. */
  service: string
  /** Service-area id — the other half. Also the first URL segment's owner. */
  service_area: string
  /**
   * Second URL segment. Materialised at write time (defaulting to the service
   * slug), never resolved at render — it only has to be unique within its area.
   */
  slug: string
  h1: string
  intro: string
  /** BlockNote blocks. Empty is the publish gate: no body => cannot publish. */
  body: unknown[] | null
  seo_title: string
  seo_description: string
  noindex?: boolean
  is_published: boolean
  /**
   * Set when the pair's service or area is deactivated or deleted. The record
   * survives (neither relation cascades) so the agency sees a flag and decides.
   */
  auto_unpublished: boolean
  /** Ticks against `TemplateSettings`-adjacent agency-defined checklist items. */
  manual_checklist: Record<string, boolean> | null
  sort_order: number
  /** Resolved service, when the relation is expanded. */
  serviceRecord?: Service
  /** Resolved area, when the relation is expanded. */
  areaRecord?: ServiceArea
  created?: string
  updated?: string
}

/** One agency-defined readiness item, stored in `settings.manual_checklist_items`. */
export interface ManualChecklistItem {
  id: string
  label: string
  description?: string
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
  /** Where the work happened — what combo/area auto-pull matches on. */
  serviceArea?: ServiceArea
  /** Finer than the area tree, e.g. "Tribeca" when the area is Manhattan. */
  neighborhood?: string
  /** For businesses working across adjacent states. Template picks name or code. */
  state?: StateItem
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

export interface Location {
  id: string
  area_name: string
  slug: string
  address: string
  phone: string
  is_active: boolean
  sort_order: number
  seo_title: string
  seo_description: string
  noindex?: boolean
  updated?: string
}

/**
 * Shared shape of the four catalog datatypes — Types, Brands, Certifications,
 * Awards & Nominations. One collection each (`types`, `brands`,
 * `certifications`, `awards`), identical schema, each gated by its own
 * settings master switch (`brands_enabled`, `certifications_enabled`, …).
 */
export interface CatalogItem {
  id: string
  name: string
  slug: string
  description: string
  details: unknown[] | null   // BlockNote JSON (array of blocks)
  image_url: string           // Full URL from the media library; may be empty
  is_active: boolean
  sort_order: number
  seo_title: string
  seo_description: string
  noindex?: boolean
  updated?: string
}

export type Brand = CatalogItem
export type Certification = CatalogItem
export type Award = CatalogItem

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
  defaultPalette?: import('./color-palette').ColorPaletteColors
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
  locations_enabled?: boolean
  brands_enabled?: boolean
  certifications_enabled?: boolean
  awards_enabled?: boolean
  service_areas_index_enabled?: boolean
  /** Services index layout: 'auto' nests only when a hierarchy exists. */
  services_display_mode?: 'auto' | 'flat' | 'tree'
  show_powered_by: boolean
  active_template: string
  /** @deprecated Use palette_source / template_palette_overrides / cms_palette instead */
  active_palette_id?: string
  palette_source?: 'template' | 'cms'
  template_palette_overrides?: Partial<import('./color-palette').ColorPaletteColors>
  cms_palette?: import('./color-palette').ColorPaletteColors | null
  crm_enabled?: boolean
  retell_enabled?: boolean
  reviews_enabled?: boolean
  lead_webhook_url?: string
  lead_webhook_secret?: string  // Server-side only — do not use in templates
  /** Marketing Automation (n8n) — outbound event delivery config (§4.7) */
  automation_webhook_url?: string
  automation_webhook_secret?: string  // Server-side only — HMAC signing key, do not use in templates
  automation_enabled?: boolean
  automation_events?: Record<string, boolean>  // per-event on/off toggles
  automation_allowed_host?: string             // SSRF allowlist host for outbound events
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
