import type { StatusTone } from '../lib/status';
import { toneDotClass } from '../lib/status';

interface StatusDotProps {
  tone: StatusTone;
  label: string;
  pulse?: boolean;
}

export function StatusDot({ tone, label, pulse = false }: StatusDotProps) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${toneDotClass[tone]} ${
        pulse && tone === 'crit' ? 'animate-pulse' : ''
      }`}
    />
  );
}
