import { getServiceAreas } from './actions';
import { getStates } from '../states/actions';
import ServiceAreasList from './ServiceAreasList';
import type { ServiceArea, StateItem } from '@/types/index';

export default async function ServiceAreasPage() {
  const areas = await getServiceAreas();
  const states = await getStates();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Service Areas</h1>
        <p className="text-slate-500 mt-2">
          The places you serve, nested state → county → city → neighborhood. Drag to reorder within
          a level; nest an area by setting its parent when you edit it. Every area lives at the site
          root, so its URL stays the same however it is nested.
        </p>
      </div>

      <ServiceAreasList
        initialAreas={areas as unknown as ServiceArea[]}
        states={states as unknown as StateItem[]}
      />
    </div>
  );
}
