'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Building2, Wrench, MapPin,
  FileText, LineChart, Settings as SettingsIcon,
  MessageSquare, Phone, Star, ShieldAlert, Palette, Key, Briefcase, Images, MapPinned,
  Handshake, Tag, BarChart3, Inbox, BadgeCheck, ShieldCheck, Trophy, Map, Signpost
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
    { name: 'States', href: '/dashboard/states', icon: Map, show: true },
    { name: 'Locations', href: '/dashboard/locations', icon: MapPinned, show: settings?.locations_enabled || isAgency },
    { name: 'Projects', href: '/dashboard/projects', icon: Briefcase, show: settings?.projects_enabled || isAgency },
    { name: 'Brands', href: '/dashboard/brands', icon: BadgeCheck, show: settings?.brands_enabled || isAgency },
    { name: 'Certifications', href: '/dashboard/certifications', icon: ShieldCheck, show: settings?.certifications_enabled || isAgency },
    { name: 'Awards', href: '/dashboard/awards', icon: Trophy, show: settings?.awards_enabled || isAgency },
    { name: 'Media Library', href: '/dashboard/media', icon: Images, show: true },
  ];

  const designSeo: NavItem[] = [
    { name: 'Design', href: '/dashboard/design', icon: Palette, show: true },
    { name: 'Site Content', href: '/dashboard/content', icon: FileText, show: true },
    { name: 'Landing Pages', href: '/dashboard/landing-pages', icon: Signpost, show: true },
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

  // Business Owners get Core + Business Info only; Design & SEO and System are
  // agency-operated. Route access is enforced server-side by the matching
  // segment layouts (see lib/dashboard-access.ts) — keep the two in sync.
  const groups: { label: string; items: NavItem[]; agencyOnly?: boolean }[] = [
    { label: 'Core', items: core },
    { label: 'Business Info', items: businessInfo },
    { label: 'Design & SEO', items: designSeo, agencyOnly: true },
    { label: 'System', items: system, agencyOnly: true },
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
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group my-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
          'transition-all duration-200 ease-in-out',
          isActive
            ? item.danger
              ? 'bg-destructive text-destructive-foreground shadow-xs'
              : 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs'
            : item.danger
              ? 'text-destructive hover:translate-x-1 hover:bg-destructive/5'
              : 'text-sidebar-foreground/70 hover:translate-x-1 hover:bg-sidebar-primary/5 hover:text-sidebar-foreground'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate">{item.name}</span>
      </Link>
    );
  };

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* h-16 + border-b matches TopBar exactly, so the header rule runs
          unbroken across the sidebar seam instead of stopping at it. */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
          T
        </span>
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate text-[15px] font-semibold tracking-tight">Tribe CMS</span>
          <span className="mt-1 truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Business Portal
          </span>
        </span>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 pb-8 pt-2">
        {groups.map((group) => {
          if (group.agencyOnly && !isAgency) return null;
          const items = group.items.filter((item) => item.show);
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <nav>{items.map(renderItem)}</nav>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
