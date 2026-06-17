import type { Metadata } from "next";
import Link from 'next/link';
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo } from "@/lib/settings";

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  try {
    const settings = await getSettings();
    const template = await loadTemplate(settings.active_template);

    if (template.Custom404Page) {
      const businessInfo = await getBusinessInfo();
      const Custom404PageComponent = template.Custom404Page;
      return (
        <Custom404PageComponent
          businessInfo={businessInfo}
          config={settings.template_config || {}}
        />
      );
    }
  } catch {}

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h2 className="text-4xl font-bold mb-4">404 - Not Found</h2>
      <p className="mb-8 text-gray-600">The page you are looking for does not exist.</p>
      <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded">
        Return Home
      </Link>
    </div>
  );
}
