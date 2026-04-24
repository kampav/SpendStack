'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-gradient text-white border-0 hover:brightness-95 focus-visible:ring-primary',
  secondary:
    'bg-transparent text-primary border border-[1.5px] border-primary hover:bg-primary/8 focus-visible:ring-primary',
  ghost:
    'bg-transparent text-navy border-0 hover:bg-n-100 focus-visible:ring-navy',
  destructive:
    'bg-error text-white border-0 hover:brightness-95 focus-visible:ring-error',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[13px] rounded-[10px]',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3.5 text-[15px] rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  loading,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-semibold',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'active:scale-[0.98]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
