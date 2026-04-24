import { HorseMark } from './HorseMark';

export function Wordmark({
  size = 18,
  color = '#006A4D',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-black tracking-tight leading-none ${className}`}
      style={{ color, fontSize: size, letterSpacing: '-0.02em' }}
    >
      <HorseMark size={Math.round(size * 1.2)} color={color} />
      <span>SpendStack</span>
    </span>
  );
}
