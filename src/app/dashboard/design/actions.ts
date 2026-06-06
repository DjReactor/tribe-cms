'use server';

import { getTemplateManifests } from '@/lib/template-registry';
import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { TemplateManifest } from '@/lib/template-registry';

export async function getTemplates(): Promise<TemplateManifest[]> {
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
      return { success: false, error: 'Template not found.' };
    }

    const pb = await getPocketBaseClient();
    const records = await pb.collection('settings').getFullList(1).catch(() => []);

    if (records.length > 0) {
      await pb.collection('settings').update(records[0].id, {
        active_template: templateId,
      });
    } else {
      await pb.collection('settings').create({ active_template: templateId });
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to activate template.' };
  }
}

export async function saveImageOverrides(overrides: Record<string, string>) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    const records = await pb.collection('settings').getFullList(1).catch(() => []);
    
    if (records.length > 0) {
      const currentConfig = records[0].template_config || {};
      await pb.collection('settings').update(records[0].id, {
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

