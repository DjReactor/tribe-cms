import { getSettings, getBusinessInfo } from '@/lib/settings';
import { loadTemplate } from '@/lib/template-loader';
import SiteContentForm from './ContentForm';

export default async function SiteContentPage() {
  const [settings, businessInfo] = await Promise.all([
    getSettings(),
    getBusinessInfo(),
  ]);

  const template = await loadTemplate(settings.active_template);

  const supportedCopyKeys = template.manifest?.supportedCopyKeys ?? {};
  const copyOverrides     = settings.template_config?.copyOverrides ?? {};

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Site Content</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customise the text on your website. Leave any field blank to use the
          template&apos;s smart default. Type{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">{'{{'}
          </code>{' '}
          in any field to insert an auto-fill variable.
        </p>
      </div>

      <SiteContentForm
        supportedCopyKeys={supportedCopyKeys}
        initialOverrides={copyOverrides}
        businessInfo={businessInfo}
      />
    </div>
  );
}