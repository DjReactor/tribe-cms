import { getCatalogItem } from '../../catalog/actions';
import CatalogItemForm from '@/components/dashboard/catalog/CatalogItemForm';
import { CATALOG_KIND_META } from '@/lib/catalog-kinds';
import { notFound } from 'next/navigation';

const KIND = 'awards' as const;

export default async function CatalogKindDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = CATALOG_KIND_META[KIND];

  let item: any;
  if (id === 'new') {
    item = { id: 'new' };
  } else {
    item = await getCatalogItem(KIND, id);
    if (!item) {
      notFound();
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          {id === 'new' ? `New ${meta.singular}` : `Edit ${meta.singular}`}
        </h1>
        <p className="text-muted-foreground mt-2">
          {id === 'new'
            ? `Add a new ${meta.singular.toLowerCase()} to your website.`
            : `Update the content and SEO details for ${item.name}.`}
        </p>
      </div>

      <CatalogItemForm kind={KIND} initialData={item} />
    </div>
  );
}
