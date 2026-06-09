import { severityBadgeClass } from '../lib/status';

export function SeverityBadge({ severity }: { severity: string | undefined }) {
  const label = severity ?? 'unknown';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${severityBadgeClass(severity)}`}
    >
      {label}
    </span>
  );
}
