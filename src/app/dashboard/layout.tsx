import { requireAuth } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { ToastProvider } from '@/components/ui/Toast';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Auth Guard
  const user = await requireAuth().catch(() => null);
  if (!user) redirect('/login');

  const settings = await getSettings();

  return (
    <ToastProvider>
      <div className="flex h-screen bg-slate-50/50 overflow-hidden text-slate-900">
        <Sidebar settings={settings} userRole={user.role} />
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <TopBar userDisplayName={user.display_name || user.email} userRole={user.role} />
          <main className="flex-1 overflow-y-auto pb-24">
            <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}