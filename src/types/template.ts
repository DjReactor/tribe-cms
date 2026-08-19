import {
  BusinessInfo,
  Service,
  ServiceNode,
  ServiceArea,
  Testimonial,
  BlogPost,
  MediaItem,
  TemplateSettings,
  BeforeAfterPair,
  TemplateManifest,
  Project,
  Location,
  Brand,
  Certification,
  Award,
} from './index';

export type { TemplateManifest, TemplateCopyKey, TemplateImageSlot } from './index'

export type TemplateConfig = Record<string, string | boolean>

export type ResolvedCopy = Record<string, string>

export interface LayoutProps {
  children: React.ReactNode
  businessInfo: BusinessInfo
  serviceAreas: ServiceArea[]
  services: ServiceNode[]
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  settings: TemplateSettings
  config: TemplateConfig
}

export interface HeaderProps {
  businessInfo: BusinessInfo
  serviceAreas: ServiceArea[]
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  blogEnabled: boolean
  config: TemplateConfig
}

export interface FooterProps {
  businessInfo: BusinessInfo
  services: ServiceNode[]
  serviceAreas: ServiceArea[]
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  settings: TemplateSettings
  config: TemplateConfig
}

export interface HomePageProps {
  businessInfo: BusinessInfo
  resolvedCopy: ResolvedCopy
  services: ServiceNode[]
  serviceAreas: ServiceArea[]
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  testimonials: Testimonial[]
  media: MediaItem[]
  beforeAfterPairs: BeforeAfterPair[]
  config: TemplateConfig
}

export interface AboutPageProps {
  businessInfo: BusinessInfo
  serviceAreas: ServiceArea[]
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  resolvedCopy: ResolvedCopy
  services: ServiceNode[]
  testimonials: Testimonial[]
  media: MediaItem[]
  config: TemplateConfig
}

export interface ContactPageProps {
  businessInfo: BusinessInfo
  serviceAreas: ServiceArea[]
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  resolvedCopy: ResolvedCopy
  media: MediaItem[]
  config: TemplateConfig
}

export interface ServicesIndexProps {
  /** Every tier, depth-first: each parent immediately followed by its children. */
  services: ServiceNode[]
  /** The same services nested by `parent`. Roots only; walk `.children`. */
  serviceTree: ServiceNode[]
  /** Resolved from settings — 'auto' has already been decided for you. */
  servicesDisplayMode: 'flat' | 'tree'
  businessInfo: BusinessInfo
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  resolvedCopy: ResolvedCopy
  media: MediaItem[]
  config: TemplateConfig
}

export interface ServiceDetailProps {
  service: Service
  /** Ancestors root-first, excluding `service`. Empty for a top-level service. */
  parentChain: Service[]
  /** Direct children of `service`, sibling order, each with its `path`. */
  childServices: ServiceNode[]
  /** Breadcrumb trail incl. `service` itself, each with its canonical path. */
  serviceTrail: { name: string; path: string }[]
  /** Canonical path of `service`, e.g. `/services/remodeling/kitchen`. */
  servicePath: string
  businessInfo: BusinessInfo
  serviceAreas: ServiceArea[]
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  beforeAfterPairs: BeforeAfterPair[]
  media: MediaItem[]
  config: TemplateConfig
}

export interface ServiceAreaProps {
  area: ServiceArea
  businessInfo: BusinessInfo
  resolvedCopy: ResolvedCopy
  services: ServiceNode[]
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  media: MediaItem[]
  config: TemplateConfig
}

export interface BlogIndexProps {
  posts: BlogPost[]
  businessInfo: BusinessInfo
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  currentPage: number
  totalPages: number
  media: MediaItem[]
  config: TemplateConfig
}

export interface BlogPostProps {
  post: BlogPost
  businessInfo: BusinessInfo
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  relatedPosts: BlogPost[]
  media: MediaItem[]
  config: TemplateConfig
}

export interface StaticPageProps {
  businessInfo: BusinessInfo
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  pageContent: string
  config: TemplateConfig
}

export interface TestimonialsPageProps {
  businessInfo: BusinessInfo
  testimonials: Testimonial[]
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  media: MediaItem[]
  config: TemplateConfig
}

export interface ServiceAreasIndexPageProps {
  serviceAreas: ServiceArea[]
  businessInfo: BusinessInfo
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  resolvedCopy: ResolvedCopy
  media: MediaItem[]
  config: TemplateConfig
}

export interface Custom404PageProps {
  businessInfo: BusinessInfo
  config: TemplateConfig
}

export interface ProjectsIndexPageProps {
  projects: Project[]
  businessInfo: BusinessInfo
  locations: Location[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  resolvedCopy: ResolvedCopy
  services: ServiceNode[]
  config: TemplateConfig
}

export interface ProjectDetailPageProps {
  project: Project
  businessInfo: BusinessInfo
  locations: Location[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  relatedProjects: Project[]
  config: TemplateConfig
}

export interface LocationsIndexPageProps {
  locations: Location[]
  businessInfo: BusinessInfo
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  config: TemplateConfig
}

export interface LocationDetailPageProps {
  location: Location
  businessInfo: BusinessInfo
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  relatedLocations: Location[]
  config: TemplateConfig
}

// ── Catalog pages (Types / Brands / Certifications / Awards & Nominations) ──
// Four optional index+detail page pairs sharing the CatalogItem shape. Each is
// gated by its settings master switch; the platform falls back to a minimal
// grid / detail view when the template doesn't export the component.

export interface BrandsIndexPageProps {
  brands: Brand[]
  businessInfo: BusinessInfo
  resolvedCopy: ResolvedCopy
  locations: Location[]
  projects: Project[]
  certifications: Certification[]
  awards: Award[]
  config: TemplateConfig
}

export interface BrandDetailPageProps {
  brand: Brand
  businessInfo: BusinessInfo
  relatedBrands: Brand[]
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  config: TemplateConfig
}

export interface CertificationsIndexPageProps {
  certifications: Certification[]
  businessInfo: BusinessInfo
  resolvedCopy: ResolvedCopy
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  awards: Award[]
  config: TemplateConfig
}

export interface CertificationDetailPageProps {
  certification: Certification
  businessInfo: BusinessInfo
  relatedCertifications: Certification[]
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  config: TemplateConfig
}

export interface AwardsIndexPageProps {
  awards: Award[]
  businessInfo: BusinessInfo
  resolvedCopy: ResolvedCopy
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  config: TemplateConfig
}

export interface AwardDetailPageProps {
  award: Award
  businessInfo: BusinessInfo
  relatedAwards: Award[]
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  config: TemplateConfig
}

export interface TemplatePack {
  manifest: TemplateManifest
  Layout: React.FC<LayoutProps>
  Header: React.FC<HeaderProps>
  Footer: React.FC<FooterProps>
  HomePage: React.FC<HomePageProps>
  AboutPage?: React.FC<AboutPageProps>
  ContactPage?: React.FC<ContactPageProps>
  ServicesIndexPage?: React.FC<ServicesIndexProps>
  ServiceDetailPage?: React.FC<ServiceDetailProps>
  ServiceAreaPage?: React.FC<ServiceAreaProps>
  BlogIndexPage?: React.FC<BlogIndexProps>
  BlogPostPage?: React.FC<BlogPostProps>
  PrivacyPage?: React.FC<StaticPageProps>
  TermsPage?: React.FC<StaticPageProps>
  TestimonialsPage?: React.FC<TestimonialsPageProps>
  ServiceAreasIndexPage?: React.FC<ServiceAreasIndexPageProps>
  Custom404Page?: React.FC<Custom404PageProps>
  ProjectsIndexPage?: React.FC<ProjectsIndexPageProps>
  ProjectDetailPage?: React.FC<ProjectDetailPageProps>
  LocationsIndexPage?: React.FC<LocationsIndexPageProps>
  LocationDetailPage?: React.FC<LocationDetailPageProps>
  BrandsIndexPage?: React.FC<BrandsIndexPageProps>
  BrandDetailPage?: React.FC<BrandDetailPageProps>
  CertificationsIndexPage?: React.FC<CertificationsIndexPageProps>
  CertificationDetailPage?: React.FC<CertificationDetailPageProps>
  AwardsIndexPage?: React.FC<AwardsIndexPageProps>
  AwardDetailPage?: React.FC<AwardDetailPageProps>
}
