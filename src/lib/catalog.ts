import { getPocketBaseClient } from './pocketbase';
import { getSettings } from './settings';
import type { CatalogItem, TemplateSettings } from '@/types/index';
import { cache } from 'react';

/**
 * Catalog datatypes — Types, Brands, Certifications, Awards & Nominations.
 * Four collections with one shared schema (see `CatalogItem`), each honouring
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
      const pb = await getPocketBaseClient();
      return await pb.collection(collection).getFullList<CatalogItem>({
        filter: 'is_active = true',
        sort: 'sort_order',
      });
    } catch {
      return [];
    }
  });
}

export const getTypes          = catalogFetcher('types', 'types_enabled');
export const getBrands         = catalogFetcher('brands', 'brands_enabled');
export const getCertifications = catalogFetcher('certifications', 'certifications_enabled');
export const getAwards         = catalogFetcher('awards', 'awards_enabled');

/** All four catalog arrays in one call — convenience for route files. */
export const getCatalog = cache(async () => {
  const [types, brands, certifications, awards] = await Promise.all([
    getTypes(), getBrands(), getCertifications(), getAwards(),
  ]);
  return { types, brands, certifications, awards };
});
