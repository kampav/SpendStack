import { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Use as a clickable surface */
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article';
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export function Card({
  children,
  onClick,
  padding = 'md',
  as: Tag = 'div',
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'bg-white rounded-xl shadow-card',
        paddingMap[padding],
        onClick &&
          'cursor-pointer hover:shadow-card-hover transition-shadow duration-200',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
