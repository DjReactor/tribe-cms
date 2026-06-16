const fs = require('fs');
const path = require('path');

const baseDir = 'src/app/dashboard';

const routes = {
  'layout.tsx': `import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth().catch(() => null);
  if (!user) redirect('/login');

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 font-bold text-xl border-b">Dashboard</div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-100">Overview</Link>
          <Link href="/dashboard/business-info" className="block px-3 py-2 rounded hover:bg-gray-100">Business Info</Link>
          <Link href="/dashboard/services" className="block px-3 py-2 rounded hover:bg-gray-100">Services</Link>
          <Link href="/dashboard/service-areas" className="block px-3 py-2 rounded hover:bg-gray-100">Service Areas</Link>
          <Link href="/dashboard/content" className="block px-3 py-2 rounded hover:bg-gray-100">Site Content</Link>
          <Link href="/dashboard/seo" className="block px-3 py-2 rounded hover:bg-gray-100">SEO Settings</Link>
          <Link href="/dashboard/settings" className="block px-3 py-2 rounded hover:bg-gray-100">Platform Settings</Link>
        </nav>
        <div className="p-4 border-t">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full text-left px-3 py-2 text-red-600 rounded hover:bg-gray-100">Log Out</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}`,

  'page.tsx': `export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome to Tribe CMS</h1>
      <p>Use the sidebar to manage your website content.</p>
    </div>
  );
}`,

  'business-info/page.tsx': `export default function BusinessInfoPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Business Information</h1>
      <p>Manage your address, phone, social links, and business hours here.</p>
      {/* Form implementation goes here */}
    </div>
  );
}`,

  'services/page.tsx': `export default function ServicesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Services</h1>
      <p>Add and edit the services you provide.</p>
    </div>
  );
}`,

  'service-areas/page.tsx': `export default function ServiceAreasPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Service Areas</h1>
      <p>Manage the cities and zip codes you serve.</p>
    </div>
  );
}`,

  'content/page.tsx': `export default function ContentPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Site Content</h1>
      <p>Edit homepage and about page copy.</p>
    </div>
  );
}`,

  'seo/page.tsx': `export default function SeoPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">SEO Settings</h1>
      <p>Configure meta tags and schema options.</p>
    </div>
  );
}`,

  'settings/page.tsx': `export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Platform Settings</h1>
      <p>Manage webhooks, integrations, and active template.</p>
    </div>
  );
}`
};

for (const [route, code] of Object.entries(routes)) {
  const fullPath = path.join(baseDir, route);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, code);
}
console.log('Dashboard routes generated.');
