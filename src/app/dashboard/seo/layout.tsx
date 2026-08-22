import { requireAgencyPage } from '@/lib/dashboard-access';
import { SeoTabs } from './SeoTabs';

// Agency-only segment (see lib/dashboard-access.ts). Business Owners get the
// dashboard not-found boundary instead of the page.
export default async function SEOLayout({ children }: { children: React.ReactNode }) {
  await requireAgencyPage();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">SEO &amp; Visibility</h1>
        <p className="text-muted-foreground mt-2">Manage your search engine presence, metadata, and track broken links.</p>
      </div>

      <SeoTabs />

      <div>{children}</div>
    </div>
  );
}
