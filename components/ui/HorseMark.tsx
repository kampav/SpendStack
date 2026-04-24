// Lloyds-style horse mark — simplified silhouette placeholder.
// Replace with licensed Lloyds SVG before public release.
export function HorseMark({
  size = 24,
  color = 'currentColor',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
      className={className}
    >
      <path
        fill={color}
        d="M22 78 L28 60 L24 58 C22 56 22 52 24 50 L30 46 L28 42 C26 38 28 34 32 32 L38 30 L40 24 C42 20 46 18 50 20 L54 16 C58 14 62 16 64 20 L66 22 L70 20 C74 20 76 24 74 28 L72 32 L76 34 C78 36 78 40 76 42 L74 46 L78 50 C80 54 78 58 74 60 L70 62 L72 66 L74 78 L68 78 L64 66 L58 66 L54 70 L54 78 L48 78 L48 68 L40 68 L38 74 L36 78 Z"
      />
    </svg>
  );
}
