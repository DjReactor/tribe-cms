'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Phone, Mail, MessageSquare, Activity, ArrowUpRight, ArrowDownLeft, ExternalLink, Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TagInput } from '@/components/ui/TagInput';
import { useToast } from '@/components/ui/Toast';
import { setContactLifecycle, updateContactNotes, updateContactTags, requestMessageSend } from '../actions';
import { createDeal, updateDealStage, updateDeal } from '../../deals/actions';

const STAGE_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'estimate_scheduled', label: 'Estimate Scheduled' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];
const LIFECYCLE_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'customer', label: 'Customer' },
  { value: 'inactive', label: 'Inactive' },
];

const money = (n: number | undefined) =>
  !n ? '—' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtTime = (ts: string) => (ts ? new Date(ts).toLocaleString() : '—');

export function ContactDetail({
  contact, timeline, deals, sources,
}: { contact: any; timeline: any[]; deals: any[]; sources: any[] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [lifecycle, setLifecycle] = useState(contact.lifecycle_status || '');
  const [tags, setTags] = useState<string[]>(Array.isArray(contact.tags) ? contact.tags : []);
  const [notesDraft, setNotesDraft] = useState(contact.notes || '');

  const refresh = () => router.refresh();
  const toastResult = (res: any, ok: string) =>
    res?.success
      ? addToast({ title: ok, type: 'success' })
      : addToast({ title: 'Action failed', description: res?.error, type: 'error' });

  const onLifecycle = (value: string) => {
    setLifecycle(value);
    startTransition(async () => { toastResult(await setContactLifecycle(contact.id, value), 'Lifecycle updated'); refresh(); });
  };
  const onTags = (next: string[]) => {
    setTags(next);
    startTransition(async () => { await updateContactTags(contact.id, next); });
  };
  const onSaveNotes = () =>
    startTransition(async () => { toastResult(await updateContactNotes(contact.id, notesDraft), 'Notes saved'); });

  return (
    <div className="space-y-6">
      <Link href="/dashboard/crm" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to CRM
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{contact.name || '(no name)'}</h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                {contact.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{contact.email}</span>}
                {contact.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{contact.phone}</span>}
              </div>
              {(contact.address_full || contact.address_city) && (
                <p className="mt-1 text-sm text-slate-400">
                  {contact.address_full || [contact.address_city, contact.address_state, contact.address_zip].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {contact.expand?.source?.label && <Badge variant="info">{contact.expand.source.label}</Badge>}
              <div className="w-44">
                <Select value={lifecycle} onChange={(e) => onLifecycle(e.target.value)} disabled={isPending} className="py-1.5">
                  <option value="">— Lifecycle —</option>
                  {LIFECYCLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TagInput label="Tags" value={tags} onChange={onTags} placeholder="Add a tag…" />
            <div>
              <Textarea label="Internal notes" value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} rows={2} />
              <div className="mt-2 flex justify-end">
                <Button size="sm" variant="ghost" onClick={onSaveNotes} isLoading={isPending}>Save notes</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Activity Timeline</CardTitle></CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No activity yet.</p>
              ) : (
                <ol className="space-y-4">
                  {timeline.map((item, i) => <TimelineItem key={i} item={item} />)}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: deals + compose */}
        <div className="space-y-6">
          <DealsPanel contactId={contact.id} deals={deals} sources={sources} onChanged={refresh} />
          <ComposeBox contactId={contact.id} />
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ item }: { item: any }) {
  const { kind, ts, data } = item;

  if (kind === 'call') {
    return (
      <li className="flex gap-3">
        <IconDot className="bg-violet-100 text-violet-600"><Phone className="h-4 w-4" /></IconDot>
        <div className="flex-1 rounded-xl border border-slate-200/70 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-900">Call · {data.from_number || data.caller_number || 'Unknown'}</span>
            <span className="text-xs text-slate-400">{fmtTime(ts)}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <Badge variant={data.call_successful ? 'success' : 'default'} className="capitalize">
              {data.call_successful ? 'Successful' : (data.disconnection_reason || data.call_status || 'Unknown')}
            </Badge>
            {data.sentiment && <span className="capitalize text-slate-500">{data.sentiment}</span>}
          </div>
          {data.summary && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{data.summary}</p>}
          <Link href="/dashboard/call-logs" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
            Open in Call Logs <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </li>
    );
  }

  if (kind === 'message') {
    const outbound = data.direction === 'outbound';
    return (
      <li className="flex gap-3">
        <IconDot className="bg-sky-100 text-sky-600">
          {data.channel === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
        </IconDot>
        <div className="flex-1 rounded-xl border border-slate-200/70 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 capitalize">
              {outbound ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> : <ArrowDownLeft className="h-3.5 w-3.5 text-blue-500" />}
              {data.direction} {data.channel}
            </span>
            <span className="text-xs text-slate-400">{fmtTime(ts)}</span>
          </div>
          {data.subject && <p className="mt-1 text-sm font-medium text-slate-700">{data.subject}</p>}
          {data.body && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{data.body}</p>}
          {data.status && <span className="mt-1 inline-block text-xs capitalize text-slate-400">{data.status}</span>}
        </div>
      </li>
    );
  }

  // activity
  return (
    <li className="flex gap-3">
      <IconDot className="bg-slate-100 text-slate-500"><Activity className="h-4 w-4" /></IconDot>
      <div className="flex-1 pt-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-slate-700">{data.title || data.type}</span>
          <span className="text-xs text-slate-400">{fmtTime(ts)}</span>
        </div>
        {data.detail && <p className="mt-0.5 text-sm text-slate-500">{data.detail}</p>}
      </div>
    </li>
  );
}

function IconDot({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${className || ''}`}>{children}</span>;
}

function DealsPanel({ contactId, deals, sources, onChanged }: { contactId: string; deals: any[]; sources: any[]; onChanged: () => void }) {
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [title, setTitle] = useState('');
  const [stage, setStage] = useState('new');
  const [estimateValue, setEstimateValue] = useState('');
  const [wonValue, setWonValue] = useState('');
  const [sourceId, setSourceId] = useState('');

  const reset = () => { setTitle(''); setStage('new'); setEstimateValue(''); setWonValue(''); setSourceId(''); };
  const toast = (res: any, ok: string) =>
    res?.success ? addToast({ title: ok, type: 'success' }) : addToast({ title: 'Failed', description: res?.error, type: 'error' });

  const onCreate = () => startTransition(async () => {
    const res = await createDeal({
      contact_id: contactId, title: title.trim(), stage,
      estimate_value: estimateValue ? Number(estimateValue) : undefined,
      won_value: wonValue ? Number(wonValue) : undefined,
      source_id: sourceId || undefined,
    });
    toast(res, 'Deal created');
    if (res.success) { setOpen(false); reset(); onChanged(); }
  });

  const onStage = (id: string, s: string) => startTransition(async () => {
    const res = await updateDealStage(id, s); toast(res, 'Stage updated'); if (res.success) onChanged();
  });

  const onSaveEdit = () => startTransition(async () => {
    const res = await updateDeal(editing.id, {
      title: editing.title || '',
      estimate_value: editing.estimate_value ? Number(editing.estimate_value) : 0,
      won_value: editing.won_value ? Number(editing.won_value) : 0,
    });
    toast(res, 'Deal updated');
    if (res.success) { setEditing(null); onChanged(); }
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Deals</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>New</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {deals.length === 0 && <p className="text-sm text-slate-400">No deals yet.</p>}
        {deals.map((d) => (
          <div key={d.id} className="rounded-xl border border-slate-200/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-slate-900">{d.title || 'Untitled deal'}</span>
              <button className="text-xs text-slate-400 hover:text-slate-700" onClick={() => setEditing({ ...d })}>Edit</button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Select value={d.stage} disabled={isPending} onChange={(e) => onStage(d.id, e.target.value)} className="h-8 py-0 text-xs">
                {STAGE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              <span className="shrink-0 text-sm font-medium text-slate-700">
                {d.stage === 'won' ? money(d.won_value) : money(d.estimate_value)}
              </span>
            </div>
            {d.expand?.source?.label && <p className="mt-1 text-xs text-slate-400">via {d.expand.source.label}</p>}
          </div>
        ))}
      </CardContent>

      {/* New deal */}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="New Deal">
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Roof replacement" />
          <Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Estimate ($)" type="number" value={estimateValue} onChange={(e) => setEstimateValue(e.target.value)} placeholder="0" />
            {stage === 'won' && <Input label="Won ($)" type="number" value={wonValue} onChange={(e) => setWonValue(e.target.value)} placeholder="0" />}
          </div>
          <Select label="Source" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            <option value="">— Select a source —</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onCreate} isLoading={isPending}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Edit deal values */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Deal">
        {editing && (
          <div className="space-y-4">
            <Input label="Title" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Estimate ($)" type="number" value={editing.estimate_value ?? ''} onChange={(e) => setEditing({ ...editing, estimate_value: e.target.value })} />
              <Input label="Won ($)" type="number" value={editing.won_value ?? ''} onChange={(e) => setEditing({ ...editing, won_value: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={onSaveEdit} isLoading={isPending}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}

function ComposeBox({ contactId }: { contactId: string }) {
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [channel, setChannel] = useState('sms');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const onSend = () => {
    if (!body.trim()) { addToast({ title: 'Enter a message', type: 'error' }); return; }
    startTransition(async () => {
      const res = await requestMessageSend({ contact_id: contactId, channel, body, subject: channel === 'email' ? subject : undefined });
      if (res.success) {
        addToast({ title: 'Send requested', description: 'n8n will deliver and log it.', type: 'success' });
        setBody(''); setSubject('');
      } else {
        addToast({ title: 'Could not request send', description: res.error, type: 'error' });
      }
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Send a message</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
        </Select>
        {channel === 'email' && <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />}
        <Textarea placeholder="Type your message…" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
        <Button onClick={onSend} isLoading={isPending} className="w-full">
          <Send className="mr-2 h-4 w-4" /> Request send
        </Button>
        <p className="text-xs text-slate-400">The message is sent by your automation (n8n) and logged back to this timeline.</p>
      </CardContent>
    </Card>
  );
}
