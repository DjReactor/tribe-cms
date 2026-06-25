import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";

export async function generateMetadata(): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  return {
    title: 'Terms of Service',
    description: `Terms of service for ${businessInfo.business_name}.`,
    robots: { index: false, follow: false },
  };
}

/**
 * Terms of Service page
 *
 * Content is fetched from the `legal_pages` PocketBase collection (slug = "terms-of-service").
 * If the record does not exist yet (e.g. before the migration runs), the route falls back
 * to the original hardcoded HTML so the page is never blank.
 */
export default async function TermsOfServicePageWrapper() {
  const settings     = await getSettings();
  const businessInfo = await getBusinessInfo();

  // ── Attempt DB fetch ──────────────────────────────────────────────────────
  let content: string;
  try {
    const pb     = await getPocketBaseClient();
    const record = await pb.collection("legal_pages").getFirstListItem<{ content: string }>(
      `slug="terms-of-service"`
    );
    content = record.content || "";
  } catch {
    // Collection not yet created or record missing — use hardcoded fallback
    content = `
      <h2>1. Terms</h2>
      <p>By accessing this website, you are agreeing to be bound by these website Terms and Conditions of Use.</p>
      <h2>2. Use License</h2>
      <p>Permission is granted to temporarily download one copy of the materials on ${businessInfo.business_name}'s web site for personal, non-commercial transitory viewing only.</p>
      <h2>3. Disclaimer</h2>
      <p>The materials on ${businessInfo.business_name}'s web site are provided "as is". We make no warranties, expressed or implied.</p>
      <h2>4. Limitations</h2>
      <p>In no event shall ${businessInfo.business_name} or its suppliers be liable for any damages arising out of the use or inability to use the materials on our Internet site.</p>
    `;
  }

  const locations = await getLocations();
  const template          = await loadTemplate(settings.active_template);
  const TermsPageComponent = template.TermsPage;

  return (
    <TermsPageComponent
      businessInfo={businessInfo}
      locations={locations}
      pageContent={content}
      config={settings.template_config || {}}
    />
  );
}