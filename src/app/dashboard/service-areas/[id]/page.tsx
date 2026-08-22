import { getServiceArea, getServiceAreas } from '../actions';
import { getStates } from '../../states/actions';
import ServiceAreaDetailForm from './ServiceAreaDetailForm';
import { notFound } from 'next/navigation';
import type { ServiceArea, StateItem } from '@/types/index';

export default async function ServiceAreaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // The whole forest, active or not — the parent picker needs to see every area
  // to work out valid parents and to exclude this one's descendants.
  const allAreas = await getServiceAreas();
  const states = await getStates();

  let area: any;
  if (id === 'new') {
    area = { id: 'new' };
  } else {
    area = await getServiceArea(id);
    if (!area) {
      notFound();
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          {id === 'new' ? 'New Service Area' : 'Edit Service Area'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {id === 'new'
            ? 'Add a new service area to your website.'
            : `Update the content and SEO details for ${area.name}.`}
        </p>
      </div>

      <ServiceAreaDetailForm
        initialData={area}
        allAreas={allAreas as unknown as ServiceArea[]}
        states={states as unknown as StateItem[]}
      />
    </div>
  );
}
