import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { StatusTone } from '../lib/status';
import { toneTextClass } from '../lib/status';

interface KpiTileProps {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon?: LucideIcon;
  tone?: StatusTone;
  loading?: boolean;
}

export function KpiTile({ label, value, sublabel, icon: Icon, tone = 'neutral', loading = false }: KpiTileProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        {Icon && <Icon className={`h-4 w-4 ${toneTextClass[tone]}`} aria-hidden />}
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-20 animate-pulse rounded bg-slate-100" />
      ) : (
        <div className={`mt-1 text-2xl font-semibold tabular-nums ${tone === 'neutral' ? 'text-slate-800' : toneTextClass[tone]}`}>
          {value}
        </div>
      )}
      {sublabel && <div className="mt-0.5 text-xs text-slate-400">{sublabel}</div>}
    </div>
  );
}
