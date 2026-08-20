import Link from 'next/link';
import { getManualChecklistItems } from '../actions';
import { ChecklistEditor } from './ChecklistEditor';

export default async function ChecklistItemsPage() {
  const items = await getManualChecklistItems();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link href="/dashboard/landing-pages" className="text-sm text-slate-500 hover:text-slate-700">
          ← Landing Pages
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mt-2">Checklist Items</h1>
        <p className="text-slate-500 mt-2 max-w-2xl">
          Your own pre-publish steps, shown as checkboxes on every landing page. They are plain
          labels with no logic behind them, which is exactly why adding one is data rather than a
          deploy. Anything the CMS could work out for itself already lives in Readiness.
        </p>
      </div>

      <ChecklistEditor initialItems={items} />
    </div>
  );
}
