import type { TemplatePack } from '@/types/template';

// Cache for loaded templates
const templateCache = new Map<string, TemplatePack>();

export async function loadTemplate(id: string): Promise<TemplatePack> {
  if (templateCache.has(id)) {
    return templateCache.get(id)!;
  }

  try {
    // Dynamic import of the requested template.
    // The trailing `/index` constrains the bundler's dynamic-import context to
    // `src/templates/*/index.ts` (real template entry points). Without it, the
    // context globs every file directly under src/templates/ — including
    // non-code files like AGENTS.md — which Turbopack can't compile ("Unknown
    // module type"), breaking the entire module graph.
    const module = await import(`@/templates/${id}/index`);
    const pack = module.default as TemplatePack;
    
    if (!pack) {
      throw new Error(`Template ${id} does not have a default export.`);
    }

    templateCache.set(id, pack);
    return pack;
  } catch (error) {
    console.error(`Failed to load template '${id}'. Falling back to 'modern'.`, error);
    
    // Fallback to modern
    if (id !== 'modern') {
      return loadTemplate('modern');
    }
    
    throw new Error('Critical: Base template "modern" is missing or broken.');
  }
}
