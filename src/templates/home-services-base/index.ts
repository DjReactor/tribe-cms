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

const templatePack: TemplatePack = {
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
