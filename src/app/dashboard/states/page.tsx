import { getStates } from './actions';
import StatesList from './StatesList';
import type { StateItem } from '@/types/index';

export default async function StatesPage() {
  const states = await getStates();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">States</h1>
        <p className="text-slate-500 mt-2">
          The states you work in. This is a picklist, not a place with a page — a service area or a
          project points at one so the site can say &ldquo;Santa Rosa, CA&rdquo;. To give a state its
          own page, add it as a top-level service area instead.
        </p>
      </div>

      <StatesList initialStates={states as unknown as StateItem[]} />
    </div>
  );
}
