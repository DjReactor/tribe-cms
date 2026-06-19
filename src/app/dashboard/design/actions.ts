'use server';

import { getTemplateManifests } from '@/lib/template-registry';
import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { TemplateRegistryManifest } from '@/lib/template-registry';

export async function getTemplates(): Promise<TemplateRegistryManifest[]> {
  return getTemplateManifests();
}

export async function activateTemplate(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth();

    // Validate that the requested template actually exists
    const available = getTemplateManifests();
    if (!available.find((t) => t.id === templateId)) {
      return { success: false, error: 'Template not found in registry.' };
    }

    const pb = await getPocketBaseClient();
    let settingId = null;

    try {
      const record = await pb.collection('settings').getFirstListItem('');
      settingId = record.id;
    } catch (e) {
      // Record might not exist
    }

    if (settingId) {
      await pb.collection('settings').update(settingId, {
        active_template: templateId,
        palette_source: 'template',
        template_palette_overrides: {},
      });
    } else {
      await pb.collection('settings').create({
        active_template: templateId,
        palette_source: 'template',
        template_palette_overrides: {},
      });
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('activateTemplate error:', error);
    return { success: false, error: error.message || 'Failed to activate template.' };
  }
}

export async function saveImageOverrides(overrides: Record<string, string>) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    let settingId = null;
    let currentConfig = {};

    try {
      const record = await pb.collection('settings').getFirstListItem('');
      settingId = record.id;
      currentConfig = record.template_config || {};
    } catch (e) {
      // Record might not exist
    }
    
    if (settingId) {
      await pb.collection('settings').update(settingId, {
        template_config: {
          ...currentConfig,
          imageOverrides: overrides
        }
      });
    } else {
      await pb.collection('settings').create({
        active_template: 'modern',
        template_config: { imageOverrides: overrides }
      });
    }
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

