import { getService, getServices } from '../actions';
import ServiceDetailForm from './ServiceDetailForm';
import { notFound } from 'next/navigation';

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // The whole forest, active or not - the parent picker needs to see every
  // service to work out valid parents and to exclude this one's descendants.
  const allServices = await getServices();

  let service: any;
  if (id === 'new') {
    service = { id: 'new' };
  } else {
    service = await getService(id);
    if (!service) {
      notFound();
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          {id === 'new' ? 'New Service' : 'Edit Service'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {id === 'new'
            ? 'Add a new service to your website.'
            : `Update the content and SEO details for ${service.name}.`}
        </p>
      </div>

      <ServiceDetailForm initialData={service} allServices={allServices as any[]} />
    </div>
  );
}
