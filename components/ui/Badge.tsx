import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'success'
  | 'streak'
  | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  emoji?: string;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  bronze:
    'bg-[#CD7F3226] text-[#7a4a1e] border border-[#CD7F324d]',
  silver:
    'bg-[#A8A9AD33] text-[#4a4d52] border border-[#A8A9AD66]',
  gold:
    'bg-[#D4A01733] text-[#8a6508] border border-[#D4A0174d]',
  platinum:
    'bg-[#E5E4E2] text-[#3a3a38] border border-[#cfcecc]',
  success:
    'bg-[#38A16922] text-[#1f7a49] border border-[#38A1694d]',
  streak:
    'bg-[#FFF7ED] text-[#C2410C] border border-[#fed7aa]',
  default:
    'bg-n-100 text-n-500 border border-n-200',
};

export function Badge({ variant = 'default', emoji, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full',
        'text-[12px] font-semibold leading-5 whitespace-nowrap',
        variantStyles[variant],
        className
      )}
    >
      {emoji && <span aria-hidden="true">{emoji}</span>}
      {children}
    </span>
  );
}
