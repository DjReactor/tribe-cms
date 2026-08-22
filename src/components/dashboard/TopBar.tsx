'use client';
import { LogOut, User, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export function TopBar({ userDisplayName, userRole }: { userDisplayName: string, userRole: string }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {userRole === 'agency_admin' && (
          <span className="inline-flex h-6 items-center rounded-full bg-destructive/10 px-2.5 text-xs font-medium text-destructive">
            Agency Admin
          </span>
        )}
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          View Website
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5 pr-1 text-sm font-medium">
          <span className="hidden max-w-[180px] truncate text-foreground sm:block">
            {userDisplayName}
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
            <User className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </div>
        <div className="h-6 w-px bg-border" />
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            aria-label="Log out"
            title="Log out"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </form>
      </div>
    </header>
  );
}
