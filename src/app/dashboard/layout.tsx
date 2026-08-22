import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { requireAuth } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { ToastProvider } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Dashboard-only face. Applied on the shell wrapper, not <body>, so the
// public site keeps whatever fonts its template picked.
const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s | Dashboard',
  },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Auth Guard
  const user = await requireAuth().catch(() => null);
  if (!user) redirect('/login');

  const settings = await getSettings();

  return (
    <ToastProvider>
      <div
        className={cn(
          geistSans.variable,
          'tribe-dashboard font-sans antialiased',
          'flex h-screen overflow-hidden bg-background text-foreground'
        )}
      >
        <Sidebar settings={settings} userRole={user.role} />
        <div className="relative flex h-full min-w-0 flex-1 flex-col">
          <TopBar userDisplayName={user.display_name || user.email} userRole={user.role} />
          <main className="flex-1 overflow-y-auto pb-24">
            <div className="mx-auto max-w-7xl p-6 animate-in fade-in duration-300 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
