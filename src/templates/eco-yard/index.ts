import type { TemplatePack } from '@/types/template'

import { Layout }            from './Layout'
import { Header }            from './Header'
import { Footer }            from './Footer'
import { HomePage }          from './HomePage'
import { AboutPage }         from './AboutPage'
import { ContactPage }       from './ContactPage'
import { ServicesIndexPage } from './ServicesIndexPage'
import { ServiceDetailPage } from './ServiceDetailPage'
import { ServiceAreaPage }   from './ServiceAreaPage'
import { BlogIndexPage }     from './BlogIndexPage'
import { BlogPostPage }      from './BlogPostPage'
import { PrivacyPage }       from './PrivacyPage'
import { TermsPage }         from './TermsPage'

import { TemplateManifest } from '@/types'

export const manifest: TemplateManifest = {
  name: "Eco Yard",
  slug: "eco-yard",
  supportedImageKeys: {
    "hero_bg": { 
      label: "Main Hero Background", 
      defaultFallback: "/assets/eco-yard/699164a8407057ce8dde70466b6cf90a.webp" 
    },
    "about_us_main": { 
      label: "About Section Image", 
      defaultFallback: "/assets/eco-yard/58b034415e24578b01eba384a7a63a00.webp" 
    },
    "contact_bg": {
      label: "Contact Banner Background",
      defaultFallback: "/assets/eco-yard/8da3caff9e07af4fe3aad4bea44e0275.webp"
    }
  },
  supportedCopyKeys: {
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
}

export default templatePack
