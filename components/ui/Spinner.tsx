interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 36,
};

export default function Spinner({ size = 'md', color = 'var(--color-purple)' }: SpinnerProps) {
  const px = sizeMap[size];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="14 42"
        strokeLinecap="round"
      />
    </svg>
  );
}
