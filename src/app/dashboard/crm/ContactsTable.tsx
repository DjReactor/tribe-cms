'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { updateContactStatus, updateContactNotes, deleteContact } from './actions';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Trash2, MessageSquare } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

const STATUS_COLORS: Record<string, any> = {
  new: 'info',
  contacted: 'warning',
  qualified: 'primary',
  converted: 'success',
  closed: 'danger'
};

export function ContactsTable({ initialContacts }: { initialContacts: any[] }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const handleStatusChange = async (id: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateContactStatus(id, newStatus);
      if (res.success) {
        setContacts(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
        addToast({ title: 'Status updated', type: 'success' });
      } else {
        addToast({ title: 'Update failed', description: res.error, type: 'error' });
      }
    });
  };

  const handleSaveNotes = async () => {
    if (!selectedContact) return;
    startTransition(async () => {
      const res = await updateContactNotes(selectedContact.id, notesDraft);
      if (res.success) {
        setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, notes: notesDraft } : c));
        addToast({ title: 'Notes saved', type: 'success' });
        setSelectedContact(null);
      } else {
        addToast({ title: 'Save failed', description: res.error, type: 'error' });
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    const res = await deleteContact(id);
    if (res.success) {
      setContacts(prev => prev.filter(c => c.id !== id));
      addToast({ title: 'Contact deleted', type: 'success' });
    } else {
      addToast({ title: 'Delete failed', description: res.error, type: 'error' });
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    <Link href={`/dashboard/crm/${contact.id}`} className="text-slate-900 hover:text-blue-600 hover:underline">
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div>{contact.email}</div>
                    <div>{contact.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    {contact.expand?.source?.label && (
                      <Badge variant="default">{contact.expand.source.label}</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs max-w-[180px] truncate">
                    {contact.address_full
                      ? contact.address_full
                      : [contact.address_city, contact.address_state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Select 
                      value={contact.status} 
                      onChange={(e) => handleStatusChange(contact.id, e.target.value)}
                      disabled={isPending}
                      className="py-1.5 min-w-[140px]"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="closed">Closed</option>
                    </Select>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                      onClick={() => {
                        setSelectedContact(contact);
                        setNotesDraft(contact.notes || '');
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(contact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No contacts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={!!selectedContact} 
        onClose={() => setSelectedContact(null)}
        title={`Notes for ${selectedContact?.name}`}
      >
        <div className="space-y-4">
          <Textarea 
            label="Internal Notes" 
            value={notesDraft} 
            onChange={(e) => setNotesDraft(e.target.value)}
            rows={5}
            placeholder="Add internal notes about this contact..."
          />
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveNotes} isLoading={isPending}>
              Save Notes
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
