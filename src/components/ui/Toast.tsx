'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={1.75} />,
    error: <AlertCircle className="h-4 w-4 text-destructive" strokeWidth={1.75} />,
    info: <Info className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
  };

  return (
    <div className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg animate-in slide-in-from-right-5 fade-in duration-300">
      <div className="shrink-0 pt-0.5">{icons[toast.type || 'info']}</div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        {toast.description && <p className="text-sm text-muted-foreground">{toast.description}</p>}
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
