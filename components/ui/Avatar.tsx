import { cn } from '@/lib/utils';

const AVATAR_COLORS = [
  '#006A4D', // primary
  '#1A2B3C', // navy
  '#C2410C', // orange
  '#6B46C1', // purple
  '#2563EB', // blue
  '#B91C1C', // red
];

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[h];
}

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizePx: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  ring?: string; // CSS colour for ring
  className?: string;
}

export function Avatar({ name, size = 'md', ring, className }: AvatarProps) {
  const px = sizePx[size];
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const fontSize = Math.round(px * 0.38);
  const bg = avatarColor(name);

  return (
    <div
      aria-label={`${name} avatar`}
      className={cn('rounded-full shrink-0 inline-flex items-center justify-center font-bold text-cream', className)}
      style={{
        width: px,
        height: px,
        fontSize,
        background: bg,
        boxShadow: ring
          ? `0 0 0 3px #FBF9F4, 0 0 0 5px ${ring}`
          : undefined,
      }}
    >
      {initials}
    </div>
  );
}
