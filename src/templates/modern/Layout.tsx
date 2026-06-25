import type { LayoutProps } from '@/types/template';
import { bodyFont, headingFont } from './theme';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout({ children, businessInfo, serviceAreas, locations, settings, config }: LayoutProps) {
  return (
    <div
      className={`${bodyFont.variable} ${headingFont.variable} font-sans min-h-screen flex flex-col bg-[var(--tribe-surface)] text-[var(--tribe-text)]`}
    >
      <Header
        businessInfo={businessInfo}
        serviceAreas={serviceAreas}
        locations={locations}
        blogEnabled={settings.blog_enabled}
        config={config}
      />
      <main className="flex-1">
        {children}
      </main>
      <Footer
        businessInfo={businessInfo}
        services={[]} // Layout does not get services, passing empty array
        serviceAreas={serviceAreas}
        locations={locations}
        settings={settings}
        config={config}
      />
    </div>
  );
}
