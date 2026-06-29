import { notFound } from 'next/navigation';
import { getContact, getContactTimeline, getContactDeals } from '../actions';
import { getActiveLeadSources } from '../../deals/actions';
import { ContactDetail } from './ContactDetail';

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await getContact(id);
  if (!contact) notFound();

  const [timeline, deals, sources] = await Promise.all([
    getContactTimeline(id),
    getContactDeals(id),
    getActiveLeadSources(),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <ContactDetail contact={contact} timeline={timeline} deals={deals} sources={sources} />
    </div>
  );
}
