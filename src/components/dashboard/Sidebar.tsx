'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Building2, Wrench, MapPin,
  FileText, LineChart, Settings as SettingsIcon,
  MessageSquare, Phone, Star, ShieldAlert, Palette, Key, Briefcase, Images, MapPinned,
  Handshake, Tag, BarChart3, Inbox, Shapes, BadgeCheck, ShieldCheck, Trophy
} from 'lucide-react';

interface SidebarProps {
  settings: any;
  userRole: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  show: boolean;
  exact?: boolean;
  danger?: boolean;
  isActive?: (pathname: string) => boolean;
}

export function Sidebar({ settings, userRole }: SidebarProps) {
  const pathname = usePathname();
  const isAgency = userRole === 'agency_admin';

  const core: NavItem[] = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true, show: true },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, show: settings?.crm_enabled || isAgency },
    { name: 'CRM', href: '/dashboard/crm', icon: MessageSquare, show: settings?.crm_enabled || isAgency },
    { name: 'Deals', href: '/dashboard/deals', icon: Handshake, show: settings?.crm_enabled || isAgency },
    { name: 'AI Call Logs', href: '/dashboard/call-logs', icon: Phone, show: settings?.retell_enabled || isAgency },
    { name: 'Reviews', href: '/dashboard/testimonials', icon: Star, show: settings?.reviews_enabled || isAgency },
    { name: 'Blog', href: '/dashboard/blog', icon: FileText, show: settings?.blog_enabled || isAgency },
  ];

  const businessInfo: NavItem[] = [
    { name: 'Basic Info', href: '/dashboard/business-info', icon: Building2, show: true },
    { name: 'Services', href: '/dashboard/services', icon: Wrench, show: true },
    { name: 'Service Areas', href: '/dashboard/service-areas', icon: MapPin, show: true },
    { name: 'Locations', href: '/dashboard/locations', icon: MapPinned, show: settings?.locations_enabled || isAgency },
    { name: 'Projects', href: '/dashboard/projects', icon: Briefcase, show: settings?.projects_enabled || isAgency },
    { name: 'Types', href: '/dashboard/types', icon: Shapes, show: settings?.types_enabled || isAgency },
    { name: 'Brands', href: '/dashboard/brands', icon: BadgeCheck, show: settings?.brands_enabled || isAgency },
    { name: 'Certifications', href: '/dashboard/certifications', icon: ShieldCheck, show: settings?.certifications_enabled || isAgency },
    { name: 'Awards', href: '/dashboard/awards', icon: Trophy, show: settings?.awards_enabled || isAgency },
  ];

  const designSeo: NavItem[] = [
    { name: 'Design', href: '/dashboard/design', icon: Palette, show: true },
    { name: 'Site Content', href: '/dashboard/content', icon: FileText, show: true },
    { name: 'Media Library', href: '/dashboard/media', icon: Images, show: true },
    { name: 'SEO & Visibility', href: '/dashboard/seo', icon: LineChart, show: true },
  ];

  const system: NavItem[] = [
    {
      name: 'Platform Settings', href: '/dashboard/settings', icon: SettingsIcon, show: true,
      isActive: (p) => p.startsWith('/dashboard/settings')
        && !p.startsWith('/dashboard/settings/agency')
        && !p.startsWith('/dashboard/settings/lead-sources'),
    },
    { name: 'Security', href: '/dashboard/security', icon: Key, show: true },
    { name: 'Lead Sources', href: '/dashboard/settings/lead-sources', icon: Tag, show: isAgency },
    { name: 'Event Outbox', href: '/dashboard/outbox', icon: Inbox, show: isAgency },
    { name: 'Agency Settings', href: '/dashboard/settings/agency', icon: ShieldAlert, show: isAgency, danger: true },
  ];

  const groups: { label: string; items: NavItem[] }[] = [
    { label: 'Core', items: core },
    { label: 'Business Info', items: businessInfo },
    { label: 'Design & SEO', items: designSeo },
    { label: 'System', items: system },
  ];

  const renderItem = (item: NavItem) => {
    const isActive = item.isActive
      ? item.isActive(pathname)
      : item.exact
        ? pathname === item.href
        : pathname.startsWith(item.href);
    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          isActive
            ? item.danger ? 'bg-red-500/10 text-red-400' : 'bg-blue-600/10 text-blue-400'
            : 'hover:bg-slate-800/50 hover:text-white'
        )}
      >
        <item.icon className={cn('h-4 w-4 shrink-0', item.danger ? 'text-red-400' : isActive ? 'text-blue-400' : 'text-slate-400')} />
        {item.name}
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shrink-0">
      <div className="p-6 shrink-0">
        <h1 className="text-xl font-bold text-white tracking-tight">Tribe CMS</h1>
        <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Business Portal</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 pb-8">
        {groups.map((group) => {
          const items = group.items.filter((item) => item.show);
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{group.label}</p>
              <nav className="space-y-1">
                {items.map(renderItem)}
              </nav>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
