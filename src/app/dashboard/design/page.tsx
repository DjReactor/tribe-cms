import { getSettings } from '@/lib/settings';
import { getTemplates } from './actions';
import { getPalettes, getActivePaletteId } from './palettes/actions';
import { DesignClient } from './DesignClient';
import { DesignSettingsForm } from './DesignSettingsForm';
import { PaletteClient } from './palettes/PaletteClient';
import { loadTemplate } from '@/lib/template-loader';

export const metadata = {
  title: 'Design',
};

export default async function DesignPage() {
  const [settings, templates, palettes, activePaletteId] = await Promise.all([
    getSettings(), 
    getTemplates(),
    getPalettes(),
    getActivePaletteId()
  ]);

  let activeManifest = undefined;
  try {
    const pack = await loadTemplate(settings.active_template);
    activeManifest = pack.manifest;
  } catch (e) {
    // ignore
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Design</h1>
        <p className="text-slate-500 mt-2">
          Choose a template for your website. Changes go live immediately after activation.
        </p>
      </div>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Color Palettes</h2>
          <p className="text-slate-500 mt-1">
            Choose a color palette for your site. Changes apply instantly.
          </p>
        </div>
        <PaletteClient palettes={palettes} activePaletteId={activePaletteId ?? ''} />
      </section>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Templates</h2>

      <DesignClient
        templates={templates}
        activeTemplateId={settings.active_template}
      />

      {activeManifest && (
        <DesignSettingsForm 
          manifest={activeManifest} 
          initialSettings={settings} 
        />
      )}
      </div>
    </div>
  );
}
