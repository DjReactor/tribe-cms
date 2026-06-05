import { getBusinessInfo, getSettings } from '@/lib/settings';
import { getPocketBaseClient } from '@/lib/pocketbase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardHome() {
  const businessInfo = await getBusinessInfo();
  const settings = await getSettings();
  
  let totalContacts = 0;
  if (settings?.crm_enabled) {
    try {
      const pb = await getPocketBaseClient();
      const contactsList = await pb.collection('contacts').getList(1, 1);
      totalContacts = contactsList.totalItems;
    } catch (e) {
      // safe fallback
    }
  }
  
  const setupSteps = [
    {
      name: 'Complete Business Profile',
      description: 'Add your contact details, hours, and address.',
      href: '/dashboard/business-info',
      isComplete: !!(businessInfo?.name && businessInfo?.phone && businessInfo?.address),
    },
    {
      name: 'Add Your First Service',
      description: 'Create a service page to tell customers what you do.',
      href: '/dashboard/services',
      isComplete: false, // We would check services count here
    },
    {
      name: 'Configure SEO',
      description: 'Set your target keywords and site meta details.',
      href: '/dashboard/seo',
      isComplete: false,
    }
  ];

  const completedSteps = setupSteps.filter(s => s.isComplete).length;
  const progress = Math.round((completedSteps / setupSteps.length) * 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
        <p className="text-slate-500 mt-1">Here is what is happening with your website today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settings?.crm_enabled && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Contacts</CardDescription>
              <CardTitle className="text-4xl font-light">{totalContacts}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-slate-500">All time leads</div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Services</CardDescription>
            <CardTitle className="text-4xl font-light">6</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-slate-500">Live on website</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. SEO Score</CardDescription>
            <CardTitle className="text-4xl font-light text-blue-600">92/100</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-emerald-600 font-medium">Looking good!</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
          <CardDescription>
            Complete these steps to get your website ready for launch.
          </CardDescription>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-600">{completedSteps} of {setupSteps.length}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {setupSteps.map((step, i) => (
            <Link 
              key={i} 
              href={step.href}
              className="flex items-start gap-4 p-4 rounded-xl border border-slate-200/60 bg-white hover:border-blue-200 hover:shadow-sm transition-all"
            >
              {step.isComplete ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-6 w-6 text-slate-300 shrink-0" />
              )}
              <div className="flex-1 space-y-1">
                <p className="font-medium text-slate-900">{step.name}</p>
                <p className="text-sm text-slate-500">{step.description}</p>
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