import { getPocketBaseClient } from './pocketbase';
import { getSettings } from './settings';
import type { Location } from '@/types/index';
import { cache } from 'react';

/**
 * Active locations for public display — available to every page.
 *
 * Honours the `locations_enabled` master switch (Option A): when the feature is
 * off this returns `[]` everywhere, so any template "Locations" section hides
 * itself via its `locations.length > 0` condition, and the dedicated routes /
 * sitemap stay empty. Wrapped in React `cache()` so calling it from both the
 * layout and the page in one request is a single query.
 */
export const getLocations = cache(async (): Promise<Location[]> => {
  const settings = await getSettings();
  if (!settings.locations_enabled) return [];
  try {
    const pb = await getPocketBaseClient();
    return await pb.collection('locations').getFullList<Location>({
      filter: 'is_active = true',
      sort: 'sort_order',
    });
  } catch {
    return [];
  }
});
