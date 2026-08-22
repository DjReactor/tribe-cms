import { getCallLogs } from './actions';
import { CallLogsTable } from './CallLogsTable';

export default async function CallLogsPage() {
  const logs = await getCallLogs();
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">AI Call Logs</h1>
        <p className="text-muted-foreground mt-2">Review transcripts, summaries, and recordings from your AI phone agent.</p>
      </div>
      
      <CallLogsTable logs={logs} />
    </div>
  );
}
