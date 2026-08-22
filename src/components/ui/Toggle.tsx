import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, description, id, checked, onChange, disabled, ...props }, ref) => {
    const toggleId = id || React.useId();

    return (
      <div className={cn('flex items-center justify-between gap-4', className)}>
        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <label htmlFor={toggleId} className="cursor-pointer text-sm font-medium leading-none text-foreground">
                {label}
              </label>
            )}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        )}
        <button
          type="button"
          role="switch"
          id={toggleId}
          aria-checked={checked}
          disabled={disabled}
          onClick={(e) => {
            if (disabled) return;
            const event = {
              target: { checked: !checked, name: props.name },
            } as any;
            onChange?.(event);
          }}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-all outline-none',
            'focus-visible:ring-[3px] focus-visible:ring-ring/50',
            checked ? 'bg-primary' : 'bg-input',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <span className="sr-only">Toggle {label}</span>
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-background ring-0 transition-transform',
              checked ? 'translate-x-[18px]' : 'translate-x-0.5'
            )}
          />
        </button>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Toggle.displayName = 'Toggle';
