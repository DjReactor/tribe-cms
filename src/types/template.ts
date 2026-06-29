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
  settings: TemplateSettings
  config: TemplateConfig
}

export interface HeaderProps {
  businessInfo: BusinessInfo
  serviceAreas: ServiceArea[]
  locations: Location[]
  projects: Project[]
  blogEnabled: boolean
  config: TemplateConfig
}

export interface FooterProps {
  businessInfo: BusinessInfo
  services: Service[]
  serviceAreas: ServiceArea[]
  locations: Location[]
  projects: Project[]
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
  resolvedCopy: ResolvedCopy
  media: MediaItem[]
  config: TemplateConfig
}

export interface ServicesIndexProps {
  services: Service[]
  businessInfo: BusinessInfo
  locations: Location[]
  projects: Project[]
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
  media: MediaItem[]
  config: TemplateConfig
}

export interface BlogIndexProps {
  posts: BlogPost[]
  businessInfo: BusinessInfo
  locations: Location[]
  projects: Project[]
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
  relatedPosts: BlogPost[]
  media: MediaItem[]
  config: TemplateConfig
}

export interface StaticPageProps {
  businessInfo: BusinessInfo
  locations: Location[]
  projects: Project[]
  pageContent: string
  config: TemplateConfig
}

export interface TestimonialsPageProps {
  businessInfo: BusinessInfo
  testimonials: Testimonial[]
  locations: Location[]
  projects: Project[]
  media: MediaItem[]
  config: TemplateConfig
}

export interface ServiceAreasIndexPageProps {
  serviceAreas: ServiceArea[]
  businessInfo: BusinessInfo
  locations: Location[]
  projects: Project[]
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
  resolvedCopy: ResolvedCopy
  services: Service[]
  config: TemplateConfig
}

export interface ProjectDetailPageProps {
  project: Project
  businessInfo: BusinessInfo
  locations: Location[]
  relatedProjects: Project[]
  config: TemplateConfig
}

export interface LocationsIndexPageProps {
  locations: Location[]
  businessInfo: BusinessInfo
  projects: Project[]
  config: TemplateConfig
}

export interface LocationDetailPageProps {
  location: Location
  businessInfo: BusinessInfo
  projects: Project[]
  relatedLocations: Location[]
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
}
