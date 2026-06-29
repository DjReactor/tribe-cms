import { getOutboxSummary } from './actions';
import { OutboxView } from './OutboxView';

export default async function OutboxPage() {
  const data = await getOutboxSummary();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Event Outbox</h1>
        <p className="text-slate-500 mt-2">Outbound automation events queued for delivery to n8n.</p>
      </div>
      {data ? (
        <OutboxView counts={data.counts} recent={data.recent} />
      ) : (
        <p className="text-slate-500">Agency admin access required.</p>
      )}
    </div>
  );
}
