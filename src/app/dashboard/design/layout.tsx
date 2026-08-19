import { requireAgencyPage } from '@/lib/dashboard-access';

// Agency-only segment (see lib/dashboard-access.ts). Business Owners get the
// dashboard not-found boundary instead of the page.
export default async function DesignLayout({ children }: { children: React.ReactNode }) {
  await requireAgencyPage();
  return <>{children}</>;
}
