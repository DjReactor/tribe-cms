import type { TemplatePack } from '@/types/template'

import { Layout }              from './Layout'
import { Header }              from './Header'
import { Footer }              from './Footer'
import { HomePage }            from './HomePage'
import { AboutPage }           from './AboutPage'
import { ContactPage }         from './ContactPage'
import { ServicesIndexPage }   from './ServicesIndexPage'
import { ServiceDetailPage }   from './ServiceDetailPage'
import { ServiceAreaPage }     from './ServiceAreaPage'
import { BlogIndexPage }       from './BlogIndexPage'
import { BlogPostPage }        from './BlogPostPage'
import { PrivacyPage }         from './PrivacyPage'
import { TermsPage }           from './TermsPage'
import { ProjectsIndexPage }   from './ProjectsIndexPage'
import { ProjectDetailPage }   from './ProjectDetailPage'

import { TemplateManifest } from '@/types'

export const manifest: TemplateManifest = {
  name: "Home Services Base",
  slug: "home-services-base",
  supportedImageKeys: {
    "hero_bg": { 
      label: "Main Hero Background", 
      defaultFallback: "" 
    }
  },
  supportedCopyKeys: {
    // ── Home Page ──────────────────────────────────────────────────────────
    "hero_h1": {
      label: "Hero Headline",
      default: "The Best {{business_type}} in {{city}}",
      type: "text",
      page: "Home Page",
      hint: "The main heading visitors see first."
    },
    "hero_subtitle": {
      label: "Hero Subtitle",
      default: "Fast. Reliable. Local.",
      type: "text",
      page: "Home Page"
    },
    "cta_primary": {
      label: "Primary CTA Button",
      default: "Get a Free Quote",
      type: "text",
      page: "Home Page"
    },
    "cta_secondary": {
      label: "Secondary CTA Button",
      default: "Call {{phone}}",
      type: "text",
      page: "Home Page"
    },
    "about_heading": {
      label: "About Section Heading",
      default: "Why {{city}} Trusts {{business_name}}",
      type: "text",
      page: "Home Page"
    },
    // ── About Page ─────────────────────────────────────────────────────────
    "about_page_heading": {
      label: "About Page Heading",
      default: "About {{business_name}}",
      type: "text",
      page: "About Page"
    },
    // ── Contact Page ───────────────────────────────────────────────────────
    "contact_heading": {
      label: "Contact Page Heading",
      default: "Get in Touch",
      type: "text",
      page: "Contact Page"
    },
    "contact_subheading": {
      label: "Contact Page Subheading",
      default: "Reach out to {{business_name}} today.",
      type: "text",
      page: "Contact Page"
    },
    // ── Services Page ──────────────────────────────────────────────────────
    "services_heading": {
      label: "Services Page Heading",
      default: "Our {{business_type}} Services",
      type: "text",
      page: "Services Page"
    },
    "services_intro": {
      label: "Services Page Intro",
      default: "Professional and reliable solutions for your needs.",
      type: "textarea",
      page: "Services Page"
    },
    // ── Service Area Pages ────────────────────────────────────────────────
    "service_area_h1": {
      label: "Service Area Page Headline",
      default: "{{business_type}} in {{city}}",
      type: "text",
      page: "Service Area Pages",
      hint: "Shown as the H1 on each service area page. {{business_type}} and {{city}} are replaced automatically."
    },
    "service_area_intro": {
      label: "Service Area Page Intro",
      default: "Professional {{business_type}} services serving {{city}} and surrounding areas.",
      type: "textarea",
      page: "Service Area Pages",
      hint: "Introductory paragraph under the H1 on service area pages."
    }
  }
}


const templatePack: TemplatePack = {
  manifest,
  Layout,
  Header,
  Footer,
  HomePage,
  AboutPage,
  ContactPage,
  ServicesIndexPage,
  ServiceDetailPage,
  ServiceAreaPage,
  BlogIndexPage,
  BlogPostPage,
  PrivacyPage,
  TermsPage,
  ProjectsIndexPage,
  ProjectDetailPage,
}

export default templatePack
