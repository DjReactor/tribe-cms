import type { LayoutProps } from '@/types/template'
import { bodyFont, headingFont } from './theme'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout({ children, businessInfo, serviceAreas, settings, config }: LayoutProps) {
  return (
    <div className={`${bodyFont.variable} ${headingFont.variable} font-sans min-h-screen flex flex-col bg-white text-gray-900`}>
      <Header
        businessInfo={businessInfo}
        serviceAreas={serviceAreas}
        blogEnabled={settings.blog_enabled}
        config={config}
      />
      <main className="flex-1 w-full overflow-hidden">{children}</main>
      <Footer
        businessInfo={businessInfo}
        services={[]}
        serviceAreas={serviceAreas}
        settings={settings}
        config={config}
      />
    </div>
  )
}
