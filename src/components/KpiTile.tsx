import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { StatusTone } from '../lib/status';
import { toneTextClass } from '../lib/status';

interface KpiTileProps {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: StatusTone;
  loading?: boolean;
  /** When set, the tile becomes a drill-down link. */
  to?: string;
}

export function KpiTile({
  label,
  value,
  sublabel,
  hint,
  icon: Icon,
  tone = 'neutral',
  loading = false,
  to,
}: KpiTileProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        {Icon && <Icon className={`h-4 w-4 ${toneTextClass[tone]}`} aria-hidden />}
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-20 animate-pulse rounded bg-slate-100" />
      ) : (
        <div
          className={`mt-1 text-2xl font-semibold tabular-nums ${tone === 'neutral' ? 'text-slate-800' : toneTextClass[tone]}`}
        >
          {value}
        </div>
      )}
      {sublabel && <div className="mt-0.5 text-xs text-slate-400">{sublabel}</div>}
      {!loading && to && <div className="mt-1 text-[10px] font-medium text-blue-600">View details →</div>}
      {!loading && !to && hint && <div className="mt-1 text-[10px] text-slate-400">{hint}</div>}
    </>
  );

  const className =
    'rounded-xl border border-slate-200 bg-white p-4 shadow-sm' +
    (to
      ? ' transition-colors hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'
      : '');

  if (to) {
    return (
      <Link to={to} className={`block ${className}`}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
