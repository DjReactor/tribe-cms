import { getCatalogItems } from '../catalog/actions';
import CatalogList from '@/components/dashboard/catalog/CatalogList';
import { CATALOG_KIND_META } from '@/lib/catalog-kinds';

const KIND = 'certifications' as const;

export default async function CatalogKindPage() {
  const items = await getCatalogItems(KIND);
  const meta = CATALOG_KIND_META[KIND];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{meta.label}</h1>
        <p className="text-slate-500 mt-2">{meta.description} Drag to reorder how they appear on your site.</p>
      </div>

      <CatalogList kind={KIND} initialItems={items} />
    </div>
  );
}
