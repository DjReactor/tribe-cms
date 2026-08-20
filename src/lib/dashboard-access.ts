import { notFound } from 'next/navigation';
import { verifySession } from './auth';

/**
 * Dashboard visibility policy: the Business Owner sees the Core and Business
 * Info nav groups only. Design & SEO (design, content, landing-pages, seo) and
 * System (settings, security, outbox) are agency-operated surfaces. Media
 * Library is deliberately NOT one of them — the shared media pickers in
 * Projects, Services and Business Info depend on it.
 *
 * Enforcement is in two places that must stay in sync:
 *   - `components/dashboard/Sidebar.tsx` marks those two groups `agencyOnly`.
 *   - each of those route segments has a `layout.tsx` calling requireAgencyPage().
 */
export async function requireAgencyPage() {
  const user = await verifySession();
  if (!user || user.role !== 'agency_admin') notFound();
  return user;
}
