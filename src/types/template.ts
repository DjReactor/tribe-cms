import { 
  BusinessInfo, 
  Service, 
  ServiceArea, 
  Testimonial, 
  BlogPost, 
  MediaItem, 
  TemplateSettings,
  BeforeAfterPair,
  TemplateManifest
} from './index';

export type { TemplateManifest, TemplateCopyKey, TemplateImageSlot } from './index'

export type TemplateConfig = Record<string, string | boolean>

export type ResolvedCopy = Record<string, string>

export interface LayoutProps {
  children: React.ReactNode
  businessInfo: BusinessInfo
  serviceAreas: ServiceArea[]
  services: Service[]
  settings: TemplateSettings
  config: TemplateConfig
}

export interface HeaderProps {
  businessInfo: BusinessInfo
  serviceAreas: ServiceArea[]
  blogEnabled: boolean
  config: TemplateConfig
}

export interface FooterProps {
  businessInfo: BusinessInfo
  services: Service[]
  serviceAreas: ServiceArea[]
  settings: TemplateSettings
  config: TemplateConfig
}

export interface HomePageProps {
  businessInfo: BusinessInfo
  resolvedCopy: ResolvedCopy
  services: Service[]
  serviceAreas: ServiceArea[]
  testimonials: Testimonial[]
  media: MediaItem[]
  beforeAfterPairs: BeforeAfterPair[]
  config: TemplateConfig
}

export interface AboutPageProps {
  businessInfo: BusinessInfo
  serviceAreas: ServiceArea[]
  resolvedCopy: ResolvedCopy
  services: Service[]
  testimonials: Testimonial[]
  media: MediaItem[]
  config: TemplateConfig
}

export interface ContactPageProps {
  businessInfo: BusinessInfo
  serviceAreas: ServiceArea[]
  resolvedCopy: ResolvedCopy
  media: MediaItem[]
  config: TemplateConfig
}

export interface ServicesIndexProps {
  services: Service[]
  businessInfo: BusinessInfo
  resolvedCopy: ResolvedCopy
  media: MediaItem[]
  config: TemplateConfig
}

export interface ServiceDetailProps {
  service: Service
  businessInfo: BusinessInfo
  serviceAreas: ServiceArea[]
  beforeAfterPairs: BeforeAfterPair[]
  media: MediaItem[]
  config: TemplateConfig
}

export interface ServiceAreaProps {
  area: ServiceArea
  businessInfo: BusinessInfo
  resolvedCopy: ResolvedCopy
  services: Service[]
  media: MediaItem[]
  config: TemplateConfig
}

export interface BlogIndexProps {
  posts: BlogPost[]
  businessInfo: BusinessInfo
  currentPage: number
  totalPages: number
  media: MediaItem[]
  config: TemplateConfig
}

export interface BlogPostProps {
  post: BlogPost
  businessInfo: BusinessInfo
  relatedPosts: BlogPost[]
  media: MediaItem[]
  config: TemplateConfig
}

export interface StaticPageProps {
  businessInfo: BusinessInfo
  pageContent: string
  config: TemplateConfig
}

export interface TestimonialsPageProps {
  businessInfo: BusinessInfo
  testimonials: Testimonial[]
  media: MediaItem[]
  config: TemplateConfig
}

export interface TemplatePack {
  manifest: TemplateManifest
  Layout: React.FC<LayoutProps>
  Header: React.FC<HeaderProps>
  Footer: React.FC<FooterProps>
  HomePage: React.FC<HomePageProps>
  AboutPage: React.FC<AboutPageProps>
  ContactPage: React.FC<ContactPageProps>
  ServicesIndexPage: React.FC<ServicesIndexProps>
  ServiceDetailPage: React.FC<ServiceDetailProps>
  ServiceAreaPage: React.FC<ServiceAreaProps>
  BlogIndexPage: React.FC<BlogIndexProps>
  BlogPostPage: React.FC<BlogPostProps>
  PrivacyPage: React.FC<StaticPageProps>
  TermsPage: React.FC<StaticPageProps>
  TestimonialsPage?: React.FC<TestimonialsPageProps>
}
