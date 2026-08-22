import Link from 'next/link';
import { ShieldOff } from 'lucide-react';

// Dashboard-scoped 404 boundary. Without it, notFound() inside /dashboard falls
// through to the public app/not-found.tsx, which mounts <Track404 /> and would
// log agency-only dashboard paths into seo_404_log as real 404s.
export default function DashboardNotFound() {
  return (
    <div className="max-w-xl mx-auto text-center py-24 space-y-4">
      <ShieldOff className="h-10 w-10 mx-auto text-muted-foreground" />
      <h1 className="text-2xl font-bold text-foreground">Page not available</h1>
      <p className="text-muted-foreground">
        This section is managed by your agency and isn&apos;t part of your dashboard.
      </p>
      <Link href="/dashboard" className="inline-block text-sm font-medium text-primary hover:underline">
        Back to Overview
      </Link>
    </div>
  );
}
