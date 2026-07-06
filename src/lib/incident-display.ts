/** Map Epic 2/3 API severity/status strings to UI tone classes. */

export type SeverityTone = 'critical' | 'high' | 'medium' | 'low' | 'info';

export function severityTone(severity: string): SeverityTone {
  const s = severity.toUpperCase();
  if (s === 'CRITICAL' || s === 'EMERGENCY') return 'critical';
  if (s === 'HIGH' || s === 'WARNING' || s === 'ALERT') return 'high';
  if (s === 'MEDIUM') return 'medium';
  if (s === 'LOW') return 'low';
  return 'info';
}

export const SEVERITY_BG: Record<SeverityTone, string> = {
  critical: 'bg-red-100 text-red-700 ring-red-200',
  high: 'bg-orange-100 text-orange-700 ring-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  low: 'bg-blue-50 text-blue-600 ring-blue-100',
  info: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'new' || s === 'active') return 'bg-blue-50 text-blue-700 ring-blue-100';
  if (s === 'investigating') return 'bg-yellow-50 text-yellow-700 ring-yellow-100';
  if (s === 'resolved') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  if (s === 'closed' || s === 'suppressed') return 'bg-slate-100 text-slate-500 ring-slate-200';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}
