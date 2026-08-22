import { getBusinessInfo, getSettings } from '@/lib/settings';
import { getPocketBaseClient } from '@/lib/pocketbase';
import { verifySession } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardHome() {
  const businessInfo = await getBusinessInfo();
  const settings = await getSettings();
  // SEO lives in the agency-only Design & SEO section, so the score card and the
  // setup step that links there are agency-only too.
  const user = await verifySession();
  const isAgency = user?.role === 'agency_admin';

  let totalContacts = 0;
  let activeServicesCount = 0;
  let seoScore = 100;
  try {
    const pb = await getPocketBaseClient();

    // Fetch active contacts (if CRM enabled)
    if (settings?.crm_enabled) {
      try {
        const contactsList = await pb.collection('contacts').getList(1, 1);
        totalContacts = contactsList.totalItems;
      } catch (e) {
        // safe fallback
      }
    }

    // Fetch active services count
    try {
      const servicesList = await pb.collection('services').getList(1, 1, {
        filter: 'is_active=true',
      });
      activeServicesCount = servicesList.totalItems;
    } catch (e) {
      // safe fallback
    }

    // Compute SEO score (mirrors /dashboard/seo logic) — agency-only card
    if (isAgency) {
      try {
        const seoSettings = await pb.collection('seo_settings').getFirstListItem('').catch(() => null);
        const logs404 = await pb.collection('seo_404_log').getFullList({ sort: '-last_seen' }).catch(() => []);
        const unresolved404s = logs404.filter((l: any) => !l.resolved).length;

        if (!seoSettings?.site_name) seoScore -= 10;
        if (!seoSettings?.default_og_image) seoScore -= 5;
        if (!seoSettings?.google_verification) seoScore -= 5;
        if (unresolved404s > 0) seoScore -= Math.min(20, unresolved404s * 2);
      } catch (e) {
        // safe fallback
      }
    }
  } catch (e) {
    // outer PocketBase connection failure — use defaults
  }

  const seoScoreLabel = seoScore >= 90 ? 'Looking good!' : seoScore >= 70 ? 'Needs attention' : 'Action required';
  
  const setupSteps = [
    {
      name: 'Complete Business Profile',
      description: 'Add your contact details, hours, and address.',
      href: '/dashboard/business-info',
      isComplete: !!(businessInfo?.business_name && businessInfo?.phone && businessInfo?.address),
    },
    {
      name: 'Add Your First Service',
      description: 'Create a service page to tell customers what you do.',
      href: '/dashboard/services',
      isComplete: false, // We would check services count here
    },
    ...(isAgency ? [{
      name: 'Configure SEO',
      description: 'Set your target keywords and site meta details.',
      href: '/dashboard/seo',
      isComplete: false,
    }] : []),
  ];

  const completedSteps = setupSteps.filter(s => s.isComplete).length;
  const progress = Math.round((completedSteps / setupSteps.length) * 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h1>
        <p className="text-muted-foreground mt-1">Here is what is happening with your website today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settings?.crm_enabled && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Contacts</CardDescription>
              <CardTitle className="text-4xl font-light">{totalContacts}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">All time leads</div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Services</CardDescription>
            <CardTitle className="text-4xl font-light">{activeServicesCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Live on website</div>
          </CardContent>
        </Card>
        
        {isAgency && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>SEO Health Score</CardDescription>
              <CardTitle className="text-4xl font-light text-primary">{seoScore}/100</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xs font-medium ${
                seoScore >= 90 ? 'text-success' : seoScore >= 70 ? 'text-warning' : 'text-destructive'
              }`}>{seoScoreLabel}</div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="bg-gradient-to-br from-white to-muted/50">
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
          <CardDescription>
            Complete these steps to get your website ready for launch.
          </CardDescription>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{completedSteps} of {setupSteps.length}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {setupSteps.map((step, i) => (
            <Link 
              key={i} 
              href={step.href}
              className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-card hover:border-ring hover:shadow-xs transition-all"
            >
              {step.isComplete ? (
                <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 space-y-1">
                <p className="font-medium text-foreground">{step.name}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              <Button variant={step.isComplete ? "ghost" : "outline"} size="sm">
                {step.isComplete ? 'Review' : 'Start'}
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}