import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";

export async function generateMetadata(): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  return {
    title: 'Privacy Policy',
    description: `Privacy policy for ${businessInfo.business_name}.`,
    robots: { index: false, follow: false },
  };
}

/**
 * Privacy Policy page
 *
 * Content is fetched from the `legal_pages` PocketBase collection (slug = "privacy-policy").
 * If the record does not exist yet (e.g. before the migration runs), the route falls back
 * to the original hardcoded HTML so the page is never blank.
 */
export default async function PrivacyPolicyPageWrapper() {
  const settings     = await getSettings();
  const businessInfo = await getBusinessInfo();

  // ── Attempt DB fetch ──────────────────────────────────────────────────────
  let content: string;
  try {
    const pb     = await getPocketBaseClient();
    const record = await pb.collection("legal_pages").getFirstListItem<{ content: string }>(
      `slug="privacy-policy"`
    );
    content = record.content || "";
  } catch {
    // Collection not yet created or record missing — use hardcoded fallback
    content = `
      <h2>1. Introduction</h2>
      <p>Welcome to ${businessInfo.business_name}. We respect your privacy and are committed to protecting your personal data.</p>
      <h2>2. Data Collection</h2>
      <p>We may collect personal identification information such as your name, email address, phone number, etc. when you fill out forms on our site.</p>
      <h2>3. How We Use Your Data</h2>
      <p>We use your data to provide and improve our services, respond to inquiries, and communicate with you.</p>
      <h2>4. Contact Us</h2>
      <p>If you have any questions, contact us at ${businessInfo.email || "our contact page"}.</p>
    `;
  }

  const locations            = await getLocations();
  const projects             = await getProjects();
  const template             = await loadTemplate(settings.active_template);
  const PrivacyPageComponent = template.PrivacyPage;

  return (
    <PrivacyPageComponent
      businessInfo={businessInfo}
      locations={locations}
      projects={projects}
      pageContent={content}
      config={settings.template_config || {}}
    />
  );
}