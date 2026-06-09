import { format as formatDate, formatDistanceToNow, parseISO } from 'date-fns';

const KIB = 1024;
const MIB = KIB * 1024;
const GIB = MIB * 1024;
const TIB = GIB * 1024;
const PIB = TIB * 1024;

/** Human-readable bytes with one decimal (TiB/GiB/MiB...). */
export function formatBytes(bytes: number | undefined | null): string {
  if (bytes === undefined || bytes === null || !Number.isFinite(bytes)) return '—';
  const abs = Math.abs(bytes);
  if (abs >= PIB) return `${(bytes / PIB).toFixed(1)} PiB`;
  if (abs >= TIB) return `${(bytes / TIB).toFixed(1)} TiB`;
  if (abs >= GIB) return `${(bytes / GIB).toFixed(1)} GiB`;
  if (abs >= MIB) return `${(bytes / MIB).toFixed(1)} MiB`;
  if (abs >= KIB) return `${(bytes / KIB).toFixed(1)} KiB`;
  return `${bytes} B`;
}

export function formatTiB(tib: number | undefined | null): string {
  if (tib === undefined || tib === null || !Number.isFinite(tib)) return '—';
  return `${tib.toLocaleString(undefined, { maximumFractionDigits: 1 })} TiB`;
}

export function formatPercent(value: number | undefined | null, decimals = 1): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString();
}

/** Uptime in seconds → "346d 18h" (or "5h 12m" under a day). */
export function formatUptime(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null || !Number.isFinite(seconds)) return '—';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Localized absolute timestamp, e.g. "Jun 9, 2026 11:56 AM". */
export function formatTimestamp(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return formatDate(parseISO(iso), 'MMM d, yyyy h:mm a');
  } catch {
    return iso;
  }
}

/** Compact time for chart axes, e.g. "11:56:45". */
export function formatTimeShort(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return formatDate(parseISO(iso), 'HH:mm:ss');
  } catch {
    return iso;
  }
}

/** Relative time, e.g. "3 minutes ago". */
export function formatRelative(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

/** Relative seconds since an epoch-ms value, e.g. "12s ago". */
export function formatAgo(epochMs: number | undefined | null): string {
  if (!epochMs) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - epochMs) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
}
