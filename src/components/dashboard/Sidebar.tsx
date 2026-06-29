'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Building2, Wrench, MapPin,
  FileText, LineChart, Settings as SettingsIcon,
  MessageSquare, Phone, Star, ShieldAlert, Palette, Key, Briefcase, Images, MapPinned,
  Handshake, Tag, BarChart3, Inbox
} from 'lucide-react';

interface SidebarProps {
  settings: any;
  userRole: string;
}

export function Sidebar({ settings, userRole }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Business Info', href: '/dashboard/business-info', icon: Building2 },
    { name: 'Services', href: '/dashboard/services', icon: Wrench },
    { name: 'Service Areas', href: '/dashboard/service-areas', icon: MapPin },
    { name: 'Site Content', href: '/dashboard/content', icon: FileText },
    { name: 'Media Library', href: '/dashboard/media', icon: Images },
    { name: 'Design', href: '/dashboard/design', icon: Palette },
    { name: 'SEO & Visibility', href: '/dashboard/seo', icon: LineChart },
  ];

  const modules = [];
  if (settings?.blog_enabled || userRole === 'agency_admin') {
    modules.push({ name: 'Blog', href: '/dashboard/blog', icon: FileText });
  }
  if (settings?.projects_enabled || userRole === 'agency_admin') {
    modules.push({ name: 'Projects', href: '/dashboard/projects', icon: Briefcase });
  }
  if (settings?.locations_enabled || userRole === 'agency_admin') {
    modules.push({ name: 'Locations', href: '/dashboard/locations', icon: MapPinned });
  }
  if (settings?.crm_enabled || userRole === 'agency_admin') {
    modules.push({ name: 'CRM Contacts', href: '/dashboard/crm', icon: MessageSquare });
    modules.push({ name: 'Deals', href: '/dashboard/deals', icon: Handshake });
    modules.push({ name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 });
  }
  if (settings?.retell_enabled || userRole === 'agency_admin') {
    modules.push({ name: 'AI Call Logs', href: '/dashboard/call-logs', icon: Phone });
  }
  if (settings?.reviews_enabled || userRole === 'agency_admin') {
    modules.push({ name: 'Reviews', href: '/dashboard/reviews', icon: Star });
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shrink-0">
      <div className="p-6 shrink-0">
        <h1 className="text-xl font-bold text-white tracking-tight">Tribe CMS</h1>
        <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Business Portal</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 pb-8">
        <div>
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Core</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400' 
                      : 'hover:bg-slate-800/50 hover:text-white'
                  )}
                >
                  <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-blue-400' : 'text-slate-400')} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {modules.length > 0 && (
          <div>
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Modules</p>
            <nav className="space-y-1">
              {modules.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive 
                        ? 'bg-blue-600/10 text-blue-400' 
                        : 'hover:bg-slate-800/50 hover:text-white'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-blue-400' : 'text-slate-400')} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        <div>
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">System</p>
          <nav className="space-y-1">
            <Link
              href="/dashboard/settings"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                pathname.startsWith('/dashboard/settings')
                  && !pathname.startsWith('/dashboard/settings/agency')
                  && !pathname.startsWith('/dashboard/settings/lead-sources')
                  ? 'bg-blue-600/10 text-blue-400'
                  : 'hover:bg-slate-800/50 hover:text-white'
              )}
            >
              <SettingsIcon className="h-4 w-4 text-slate-400 shrink-0" />
              Platform Settings
            </Link>
            <Link
              href="/dashboard/security"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                pathname.startsWith('/dashboard/security')
                  ? 'bg-blue-600/10 text-blue-400' 
                  : 'hover:bg-slate-800/50 hover:text-white'
              )}
            >
              <Key className={cn('h-4 w-4 shrink-0', pathname.startsWith('/dashboard/security') ? 'text-blue-400' : 'text-slate-400')} />
              Security
            </Link>
            {userRole === 'agency_admin' && (
              <Link
                href="/dashboard/settings/lead-sources"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  pathname.startsWith('/dashboard/settings/lead-sources')
                    ? 'bg-blue-600/10 text-blue-400'
                    : 'hover:bg-slate-800/50 hover:text-white'
                )}
              >
                <Tag className={cn('h-4 w-4 shrink-0', pathname.startsWith('/dashboard/settings/lead-sources') ? 'text-blue-400' : 'text-slate-400')} />
                Lead Sources
              </Link>
            )}
            {userRole === 'agency_admin' && (
              <Link
                href="/dashboard/outbox"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  pathname.startsWith('/dashboard/outbox')
                    ? 'bg-blue-600/10 text-blue-400'
                    : 'hover:bg-slate-800/50 hover:text-white'
                )}
              >
                <Inbox className={cn('h-4 w-4 shrink-0', pathname.startsWith('/dashboard/outbox') ? 'text-blue-400' : 'text-slate-400')} />
                Event Outbox
              </Link>
            )}
            {userRole === 'agency_admin' && (
              <Link
                href="/dashboard/settings/agency"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  pathname.startsWith('/dashboard/settings/agency') 
                    ? 'bg-red-500/10 text-red-400' 
                    : 'hover:bg-slate-800/50 hover:text-white'
                )}
              >
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
                Agency Settings
              </Link>
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
