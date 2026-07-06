import {
  BusinessInfo,
  Service,
  ServiceArea,
  Testimonial,
  BlogPost,
  MediaItem,
  TemplateSettings,
  BeforeAfterPair,
  TemplateManifest,
  Project,
  Location,
  TypeItem,
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
  services: Service[]
  locations: Location[]
  projects: Project[]
  types: TypeItem[]
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
  types: TypeItem[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  blogEnabled: boolean
  config: TemplateConfig
}

export interface FooterProps {
  businessInfo: BusinessInfo
  services: Service[]
  serviceAreas: ServiceArea[]
  locations: Location[]
  projects: Project[]
  types: TypeItem[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  settings: TemplateSettings
  config: TemplateConfig
}

export interface HomePageProps {
  businessInfo: BusinessInfo
  resolvedCopy: ResolvedCopy
  services: Service[]
  serviceAreas: ServiceArea[]
  locations: Location[]
  projects: Project[]
  types: TypeItem[]
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
  types: TypeItem[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  resolvedCopy: ResolvedCopy
  services: Service[]
  testimonials: Testimonial[]
  media: MediaItem[]
  config: TemplateConfig
}

export interface ContactPageProps {
  businessInfo: BusinessInfo
  serviceAreas: ServiceArea[]
  locations: Location[]
  projects: Project[]
  types: TypeItem[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  resolvedCopy: ResolvedCopy
  media: MediaItem[]
  config: TemplateConfig
}

export interface ServicesIndexProps {
  services: Service[]
  businessInfo: BusinessInfo
  locations: Location[]
  projects: Project[]
  types: TypeItem[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  resolvedCopy: ResolvedCopy
  media: MediaItem[]
  config: TemplateConfig
}

export interface ServiceDetailProps {
  service: Service
  businessInfo: BusinessInfo
  serviceAreas: ServiceArea[]
  locations: Location[]
  projects: Project[]
  types: TypeItem[]
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
  services: Service[]
  locations: Location[]
  projects: Project[]
  types: TypeItem[]
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
  types: TypeItem[]
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
  types: TypeItem[]
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
  types: TypeItem[]
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
  types: TypeItem[]
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
  types: TypeItem[]
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
  types: TypeItem[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  resolvedCopy: ResolvedCopy
  services: Service[]
  config: TemplateConfig
}

export interface ProjectDetailPageProps {
  project: Project
  businessInfo: BusinessInfo
  locations: Location[]
  types: TypeItem[]
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
  types: TypeItem[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  config: TemplateConfig
}

export interface LocationDetailPageProps {
  location: Location
  businessInfo: BusinessInfo
  projects: Project[]
  types: TypeItem[]
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

export interface TypesIndexPageProps {
  types: TypeItem[]
  businessInfo: BusinessInfo
  resolvedCopy: ResolvedCopy
  locations: Location[]
  projects: Project[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  config: TemplateConfig
}

export interface TypeDetailPageProps {
  typeItem: TypeItem
  businessInfo: BusinessInfo
  relatedTypes: TypeItem[]
  locations: Location[]
  projects: Project[]
  types: TypeItem[]
  brands: Brand[]
  certifications: Certification[]
  awards: Award[]
  config: TemplateConfig
}

export interface BrandsIndexPageProps {
  brands: Brand[]
  businessInfo: BusinessInfo
  resolvedCopy: ResolvedCopy
  locations: Location[]
  projects: Project[]
  types: TypeItem[]
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
  types: TypeItem[]
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
  types: TypeItem[]
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
  types: TypeItem[]
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
  types: TypeItem[]
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
  types: TypeItem[]
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
  TypesIndexPage?: React.FC<TypesIndexPageProps>
  TypeDetailPage?: React.FC<TypeDetailPageProps>
  BrandsIndexPage?: React.FC<BrandsIndexPageProps>
  BrandDetailPage?: React.FC<BrandDetailPageProps>
  CertificationsIndexPage?: React.FC<CertificationsIndexPageProps>
  CertificationDetailPage?: React.FC<CertificationDetailPageProps>
  AwardsIndexPage?: React.FC<AwardsIndexPageProps>
  AwardDetailPage?: React.FC<AwardDetailPageProps>
}
