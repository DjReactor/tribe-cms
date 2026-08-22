import { getPublicPocketBase } from './pocketbase-public';
import { getSettings } from './settings';
import type { CatalogItem, TemplateSettings } from '@/types/index';
import { cache } from 'react';

/**
 * Catalog datatypes — Brands, Certifications, Awards & Nominations.
 * Three collections with one shared schema (see `CatalogItem`), each honouring
 * its own settings master switch: when the feature is off the fetcher returns
 * `[]` everywhere, so any template section hides itself via its
 * `items.length > 0` condition, and the dedicated routes / sitemap stay empty.
 * Wrapped in React `cache()` so calling from both the layout and the page in
 * one request is a single query.
 */
function catalogFetcher(collection: string, flag: keyof TemplateSettings) {
  return cache(async (): Promise<CatalogItem[]> => {
    const settings = await getSettings();
    if (!settings[flag]) return [];
    try {
      const pb = await getPublicPocketBase();
      return await pb.collection(collection).getFullList<CatalogItem>({
        filter: 'is_active = true',
        sort: 'sort_order',
      });
    } catch {
      return [];
    }
  });
}

export const getBrands         = catalogFetcher('brands', 'brands_enabled');
export const getCertifications = catalogFetcher('certifications', 'certifications_enabled');
export const getAwards         = catalogFetcher('awards', 'awards_enabled');

/** All three catalog arrays in one call — convenience for route files. */
export const getCatalog = cache(async () => {
  const [brands, certifications, awards] = await Promise.all([
    getBrands(), getCertifications(), getAwards(),
  ]);
  return { brands, certifications, awards };
});
