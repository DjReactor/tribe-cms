'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FileText, PhoneIncoming, PhoneOutgoing } from 'lucide-react';

export function CallLogsTable({ logs }: { logs: any[] }) {
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // `duration` holds Retell duration_ms.
  const formatDuration = (ms: number) => {
    if (!ms || ms < 0) return '—';
    const total = Math.round(ms / 1000);
    return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
  };
  const dateOf = (log: any) => log.start_timestamp || log.created;

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Caller</th>
                <th className="px-6 py-4">Direction</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Outcome</th>
                <th className="px-6 py-4">Sentiment</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {dateOf(log) ? new Date(dateOf(log)).toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{log.from_number || log.caller_number || '—'}</td>
                  <td className="px-6 py-4 text-slate-500">
                    <span className="inline-flex items-center gap-1.5 capitalize">
                      {log.direction === 'outbound'
                        ? <PhoneOutgoing className="h-3.5 w-3.5" />
                        : <PhoneIncoming className="h-3.5 w-3.5" />}
                      {log.direction || 'inbound'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDuration(log.duration)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={log.call_successful ? 'success' : 'default'} className="capitalize">
                      {log.call_successful ? 'Successful' : (log.disconnection_reason || log.call_status || 'Unknown')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 capitalize text-slate-600">{log.sentiment || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                      <FileText className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No call logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Call Details">
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Meta label="Direction" value={selectedLog.direction} />
              <Meta label="Outcome" value={selectedLog.call_successful ? 'Successful' : 'Unsuccessful'} />
              <Meta label="Caller" value={selectedLog.from_number || selectedLog.caller_number} />
              <Meta label="Disconnect reason" value={selectedLog.disconnection_reason} />
            </div>

            {selectedLog.recording_url && (
              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">Recording</p>
                <audio controls src={selectedLog.recording_url} className="w-full" />
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-slate-900 mb-2">AI Summary</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-sm text-slate-700">
                {selectedLog.summary || 'No summary available.'}
              </div>
            </div>

            {selectedLog.custom_analysis_data && Object.keys(selectedLog.custom_analysis_data).length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">Extracted Data</p>
                <pre className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-700 overflow-x-auto">
                  {JSON.stringify(selectedLog.custom_analysis_data, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-slate-900 mb-2">Transcript</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 max-h-64 overflow-y-auto text-sm text-slate-700 whitespace-pre-wrap">
                {selectedLog.transcript || 'No transcript available.'}
              </div>
            </div>

            {selectedLog.public_log_url && (
              <a
                href={selectedLog.public_log_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-blue-600 hover:underline"
              >
                View full Retell log →
              </a>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function Meta({ label, value }: { label: string; value?: any }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-slate-800 capitalize">{value || '—'}</p>
    </div>
  );
}
