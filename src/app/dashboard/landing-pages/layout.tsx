import { requireAgencyPage } from '@/lib/dashboard-access';

// Agency-only segment (see lib/dashboard-access.ts). Business Owners get the
// dashboard not-found boundary instead of the page. The other two enforcement
// points are the `agencyOnly` Design & SEO group in Sidebar.tsx and the
// requireAgencyAdmin() guard on every action in ./actions.ts — all three, or
// none of them counts.
export default async function LandingPagesLayout({ children }: { children: React.ReactNode }) {
  await requireAgencyPage();
  return <>{children}</>;
}
