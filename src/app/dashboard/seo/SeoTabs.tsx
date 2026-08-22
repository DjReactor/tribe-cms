'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Overview', href: '/dashboard/seo' },
  { name: 'Settings', href: '/dashboard/seo/settings' },
  { name: 'Redirects', href: '/dashboard/seo/redirects' },
  { name: '404 Logs', href: '/dashboard/seo/404s' },
];

export function SeoTabs() {
  const pathname = usePathname();

  return (
    <div className="flex space-x-1 border-b border-border">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              isActive
                ? "border-ring text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-input"
            )}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
