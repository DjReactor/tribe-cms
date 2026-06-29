'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { applyContactLifecycleChange } from '@/lib/crm-writes';
import { dispatchEvent } from '@/lib/automation';
import { revalidatePath } from 'next/cache';

const LIFECYCLE = ['lead', 'customer', 'inactive'];

export async function getContacts() {
  const pb = await getPocketBaseClient();
  return pb.collection('contacts').getFullList({
    sort: '-id',
    expand: 'source',
  }).catch(() => []);
}

/** Single contact with source + assignee expanded (contact-detail page). */
export async function getContact(id: string) {
  await requireAuth();
  const pb = await getPocketBaseClient();
  try {
    return await pb.collection('contacts').getOne(id, { expand: 'source,assigned_to' });
  } catch {
    return null;
  }
}

/** Deals for a contact, newest first (contact-detail deal panel). */
export async function getContactDeals(contactId: string) {
  await requireAuth();
  const pb = await getPocketBaseClient();
  return pb
    .collection('deals')
    .getFullList({ filter: pb.filter('contact = {:c}', { c: contactId }), sort: '-created', expand: 'source,referred_by' })
    .catch(() => []);
}

/**
 * Unified contact timeline (§6, Phase 4): parallel-fetch messages, activities,
 * and call logs (PocketBase has no cross-collection union), then merge + sort
 * newest-first into a single feed of { kind, ts, data }.
 */
export async function getContactTimeline(contactId: string) {
  await requireAuth();
  const pb = await getPocketBaseClient();
  const filter = pb.filter('contact = {:c}', { c: contactId });
  const [messages, activities, calls] = await Promise.all([
    pb.collection('messages').getFullList({ filter, sort: '-created' }).catch(() => []),
    pb.collection('activities').getFullList({ filter, sort: '-created' }).catch(() => []),
    pb.collection('ai_call_logs').getFullList({ filter, sort: '-created' }).catch(() => []),
  ]);
  return [
    ...messages.map((m: any) => ({ kind: 'message' as const, ts: m.created, data: m })),
    ...activities.map((a: any) => ({ kind: 'activity' as const, ts: a.created, data: a })),
    ...calls.map((c: any) => ({ kind: 'call' as const, ts: c.start_timestamp || c.created, data: c })),
  ].sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
}

/** Read a contact's SMS/email history, newest first (timeline source — Phase 4). */
export async function getContactMessages(contactId: string) {
  await requireAuth();
  const pb = await getPocketBaseClient();
  return pb
    .collection('messages')
    .getFullList({ filter: pb.filter('contact = {:c}', { c: contactId }), sort: '-created' })
    .catch(() => []);
}

export async function updateContactStatus(id: string, status: string) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('contacts').update(id, { status });
    revalidatePath('/dashboard/crm');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateContactNotes(id: string, notes: string) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('contacts').update(id, { notes });
    revalidatePath('/dashboard/crm');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Set a contact's CRM lifecycle_status, log the transition as an activity, and
 * emit contact.lifecycle_changed for n8n (§5.1). The contact-detail UI that
 * calls this lands in Phase 4; the capture + emission path lives here now so the
 * event contract is exercised from day one (§1.1 capture-before-display).
 */
export async function setContactLifecycle(id: string, lifecycle_status: string) {
  try {
    const user = await requireAuth();
    if (!LIFECYCLE.includes(lifecycle_status)) {
      return { success: false, error: 'Invalid lifecycle status.' };
    }
    const pb = await getPocketBaseClient();
    await applyContactLifecycleChange(pb, id, lifecycle_status, `user:${user.id}`);

    revalidatePath('/dashboard/crm');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Set a contact's tags (JSON array). */
export async function updateContactTags(id: string, tags: string[]) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('contacts').update(id, { tags });
    revalidatePath(`/dashboard/crm/${id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Manual compose (§6, Phase 4): emit message.send_requested so n8n sends the
 * SMS/email and logs the outbound back via /api/internal/crm/messages. The CMS
 * never touches Twilio/SES — it only requests the send.
 */
export async function requestMessageSend(input: {
  contact_id: string;
  channel: string;
  body: string;
  subject?: string;
}) {
  try {
    await requireAuth();
    if (!['sms', 'email'].includes(input.channel)) return { success: false, error: 'Invalid channel.' };
    if (!input.body?.trim()) return { success: false, error: 'Message body is required.' };
    await dispatchEvent('message.send_requested', {
      contact_id: input.contact_id,
      channel: input.channel,
      body: input.body.trim(),
      subject: input.subject?.trim() || undefined,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteContact(id: string) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('contacts').delete(id);
    revalidatePath('/dashboard/crm');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
