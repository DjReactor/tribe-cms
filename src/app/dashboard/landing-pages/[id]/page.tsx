import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLandingPagesData } from '../actions';
import { PairDetailForm } from './PairDetailForm';

export default async function LandingPageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { pairs, services, areas, source, checklistItems } = await getLandingPagesData();

  const pair = pairs.find((p) => p.id === id);
  if (!pair) notFound();

  const service = services.find((s) => s.id === pair.service);
  const area = areas.find((a) => a.id === pair.service_area);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link href="/dashboard/landing-pages" className="text-sm text-slate-500 hover:text-slate-700">
          ← Landing Pages
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mt-2">
          {service?.name || 'Deleted service'} in {area?.name || 'deleted area'}
        </h1>
        <p className="text-slate-500 mt-2">
          The service and the area are fixed for the life of this page — they are its identity, not
          settings. To cover a different combination, create a page for it.
        </p>
      </div>

      <PairDetailForm
        pair={pair}
        service={service}
        area={area}
        source={source}
        checklistItems={checklistItems}
      />
    </div>
  );
}
