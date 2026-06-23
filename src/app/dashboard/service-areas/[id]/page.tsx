import { getServiceArea } from '../actions';
import ServiceAreaDetailForm from './ServiceAreaDetailForm';
import { notFound } from 'next/navigation';

export default async function ServiceAreaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {id === 'new' ? 'New Service Area' : 'Edit Service Area'}
        </h1>
        <p className="text-slate-500 mt-2">
          {id === 'new'
            ? 'Add a new service area to your website.'
            : `Update the content and SEO details for ${area.name}.`}
        </p>
      </div>

      <ServiceAreaDetailForm initialData={area} />
    </div>
  );
}
