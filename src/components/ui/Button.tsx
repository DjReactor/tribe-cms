import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = cn(
      'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md',
      'text-sm font-medium transition-all outline-none',
      'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:h-4 [&_svg:not([class*='size-'])]:w-4"
    );

    const variants = {
      primary: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
      outline: 'border border-border bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground',
      ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
      // Tinted, not solid. The one call site is a delete affordance sitting on a
      // media thumbnail, where a solid red block shouts; this keeps the original
      // subtle intent in the reference's tinted-chip language.
      danger: 'bg-destructive/10 text-destructive hover:bg-destructive/15 focus-visible:ring-destructive/30',
    };

    const sizes = {
      sm: 'h-8 gap-1.5 px-3',
      md: 'h-9 px-4',
      lg: 'h-10 px-6',
      icon: 'h-9 w-9 px-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
