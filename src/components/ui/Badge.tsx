import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'solid' | 'outline';
}

export function Badge({ children, variant = 'default', className, ...props }: BadgeProps) {
  // Tinted-on-transparent chips, per the reference. Each pairs a /10 wash with
  // full-strength text of the same hue.
  const variants = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
    info: 'bg-primary/10 text-primary',
    solid: 'bg-primary text-primary-foreground',
    outline: 'border border-border text-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full px-2 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
