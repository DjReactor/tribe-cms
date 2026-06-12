'use client';
import { useForm } from 'react-hook-form';
import { useTransition, useState } from 'react';
import { generateApiKey, deleteApiKey, updateCredentials } from './actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react';

export function SecurityClient({ userRole, apiKeys }: { userRole: string, apiKeys: any[] }) {
  const { addToast } = useToast();
  const [isPendingKeys, startTransitionKeys] = useTransition();
  const [isPendingCreds, startTransitionCreds] = useTransition();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { handleSubmit: handleApiKeySubmit, register: registerApiKey, reset: resetApiKey } = useForm();
  const { handleSubmit: handleCredsSubmit, register: registerCreds, reset: resetCreds } = useForm();

  const onGenerateKey = (data: any) => {
    if (!data.title) return addToast({ title: 'Title required', type: 'error' });
    startTransitionKeys(async () => {
      const res = await generateApiKey(data.title);
      if (res.success) {
        addToast({ title: 'API Key generated', type: 'success' });
        resetApiKey();
      } else {
        addToast({ title: 'Error generating key', description: res.error, type: 'error' });
      }
    });
  };

  const onDeleteKey = (id: string) => {
    if (!confirm('Are you sure you want to delete this API Key? Any integrations using it will immediately break.')) return;
    startTransitionKeys(async () => {
      const res = await deleteApiKey(id);
      if (res.success) {
        addToast({ title: 'API Key deleted', type: 'success' });
      } else {
        addToast({ title: 'Error deleting key', description: res.error, type: 'error' });
      }
    });
  };

  const onUpdateCredentials = (data: any) => {
    startTransitionCreds(async () => {
      const res = await updateCredentials(data.email, data.password);
      if (res.success) {
        addToast({ title: 'Credentials updated', type: 'success' });
        resetCreds();
      } else {
        addToast({ title: 'Error updating credentials', description: res.error, type: 'error' });
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security</h1>
        <p className="text-slate-500 mt-1">Manage your account credentials and universal API access.</p>
      </div>

      {userRole === 'agency_admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Universal API Keys</CardTitle>
            <CardDescription>
              Agency Admins can generate universal API keys that authenticate across all endpoints for this instance.
              Use these for n8n, Make.com, or custom integrations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleApiKeySubmit(onGenerateKey)} className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Key Title</label>
                <Input placeholder="e.g. n8n Main Workflow" {...registerApiKey('title')} required />
              </div>
              <Button type="submit" isLoading={isPendingKeys}>Generate Key</Button>
            </form>

            {apiKeys.length > 0 && (
              <div className="space-y-3 mt-6">
                <h4 className="text-sm font-semibold text-slate-700">Active Keys</h4>
                {apiKeys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="overflow-hidden mr-4">
                      <p className="font-medium text-sm text-slate-900">{k.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[200px] sm:max-w-[400px]">
                          {k.key}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(k.key)}
                          className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                          title="Copy to clipboard"
                        >
                          {copiedKey === k.key ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteKey(k.id)}
                      disabled={isPendingKeys}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                      title="Delete API Key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {apiKeys.length === 0 && (
              <p className="text-sm text-slate-500 mt-4 italic">No API keys generated yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account Credentials</CardTitle>
          <CardDescription>
            {userRole === 'agency_admin' 
              ? "Update the Business Owner's email and password here. You do not need the current password." 
              : "Update your login email and password. Leave fields blank to keep them unchanged."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCredsSubmit(onUpdateCredentials)} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Email</label>
              <Input type="email" placeholder="New email address" {...registerCreds('email')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Leave blank to keep unchanged" 
                  minLength={8} 
                  {...registerCreds('password')} 
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit" isLoading={isPendingCreds}>Save Credentials</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
