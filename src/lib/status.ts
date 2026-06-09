export type StatusTone = 'ok' | 'warn' | 'crit' | 'neutral';

/** Capacity thresholds: < 70% green, 70–85% amber, > 85% red. */
export function capacityTone(usedPercent: number | undefined | null): StatusTone {
  if (usedPercent === undefined || usedPercent === null || !Number.isFinite(usedPercent)) {
    return 'neutral';
  }
  if (usedPercent > 85) return 'crit';
  if (usedPercent >= 70) return 'warn';
  return 'ok';
}

export const toneBarClass: Record<StatusTone, string> = {
  ok: 'bg-green-600',
  warn: 'bg-amber-600',
  crit: 'bg-red-600',
  neutral: 'bg-slate-400',
};

export const toneTextClass: Record<StatusTone, string> = {
  ok: 'text-green-600',
  warn: 'text-amber-600',
  crit: 'text-red-600',
  neutral: 'text-slate-500',
};

export const toneDotClass: Record<StatusTone, string> = {
  ok: 'bg-green-500',
  warn: 'bg-amber-500',
  crit: 'bg-red-500',
  neutral: 'bg-slate-400',
};

const HEALTHY_STATES = new Set(['up', 'online', 'ok', 'normal', 'member', 'battery_ok']);
const WARN_STATES = new Set(['degraded', 'mixed', 'partial', 'unknown']);

/** Maps an entity state string ("up", "online", "down"...) to a tone. */
export function stateTone(state: string | undefined | null): StatusTone {
  if (!state) return 'neutral';
  const normalized = state.toLowerCase();
  if (HEALTHY_STATES.has(normalized)) return 'ok';
  if (WARN_STATES.has(normalized)) return 'warn';
  return 'crit';
}

/** Badge classes per EMS severity. */
export function severityBadgeClass(severity: string | undefined | null): string {
  switch ((severity ?? '').toLowerCase()) {
    case 'emergency':
      return 'bg-red-700 text-white';
    case 'alert':
      return 'bg-red-600 text-white';
    case 'error':
      return 'bg-red-100 text-red-700 border border-red-200';
    case 'warning':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'notice':
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'informational':
      return 'bg-slate-100 text-slate-600 border border-slate-200';
    case 'debug':
      return 'bg-slate-50 text-slate-400 border border-slate-200';
    default:
      return 'bg-slate-100 text-slate-500 border border-slate-200';
  }
}

/** Chart colors per EMS severity (for the severity donut). */
export const severityChartColor: Record<string, string> = {
  emergency: '#991b1b',
  alert: '#dc2626',
  error: '#f87171',
  warning: '#d97706',
  notice: '#3b82f6',
  informational: '#94a3b8',
  debug: '#e2e8f0',
  other: '#cbd5e1',
};

export const SEVERITY_ORDER = [
  'emergency',
  'alert',
  'error',
  'warning',
  'notice',
  'informational',
  'debug',
] as const;
