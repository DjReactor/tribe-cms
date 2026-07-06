/**
 * Shared config for the four catalog datatypes (Types / Brands /
 * Certifications / Awards & Nominations). The kind string doubles as the
 * PocketBase collection name, the public route segment, and the dashboard
 * route segment. Imported by both server actions and client components.
 */
export const CATALOG_KINDS = ['types', 'brands', 'certifications', 'awards'] as const;

export type CatalogKind = (typeof CATALOG_KINDS)[number];

export const CATALOG_KIND_META: Record<CatalogKind, { label: string; singular: string; description: string }> = {
  types: {
    label: 'Types',
    singular: 'Type',
    description: 'Types of work or offerings shown on your site.',
  },
  brands: {
    label: 'Brands',
    singular: 'Brand',
    description: 'Brands you work with, carry, or service.',
  },
  certifications: {
    label: 'Certifications',
    singular: 'Certification',
    description: 'Certifications, partnerships, and affiliations.',
  },
  awards: {
    label: 'Awards & Nominations',
    singular: 'Award',
    description: 'Awards and nominations your business has earned.',
  },
};

export function isCatalogKind(value: string): value is CatalogKind {
  return (CATALOG_KINDS as readonly string[]).includes(value);
}
