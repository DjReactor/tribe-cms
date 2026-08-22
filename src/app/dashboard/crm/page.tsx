import { getContacts } from './actions';
import { ContactsTable } from './ContactsTable';

export default async function CRMPage() {
  const contacts = await getContacts();
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Lead CRM</h1>
        <p className="text-muted-foreground mt-2">Manage your contacts, track leads, and add internal notes.</p>
      </div>
      
      <ContactsTable initialContacts={contacts} />
    </div>
  );
}
