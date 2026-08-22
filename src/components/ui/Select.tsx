import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium leading-none text-foreground">
            {label}
          </label>
        )}
        <select
          ref={ref}
          aria-invalid={error ? true : undefined}
          className={cn(
            'flex h-9 w-full cursor-pointer appearance-none rounded-md border border-input bg-background py-1 pl-3 pr-9 text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none',
            'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Chevron drawn as a background image so the control keeps a native
            // <select> (no portal, no JS) while matching the reference's trigger.
            "bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23737373' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat",
            error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
