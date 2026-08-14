import type { EmsEvent } from '../types/netapp';

/** Event names TDK asked to hide by default (Khai, Aug 2026). */
export const TDK_HIDDEN_EVENT_NAMES = [
  'netif.tcp.conn.bad.checksum',
  'Nblade.cifsMaxWatchesPerTree',
  'Nblade.nfsConnResetAndClose',
  'configbr.noDestURL',
  'callhome.pool.aggr.noncomp',
  'license.cappool.aggr.noncomp',
  'asup.smtp.drop',
] as const;

const HIDDEN_EVENT_NAMES = new Set(
  TDK_HIDDEN_EVENT_NAMES.map((name) => name.toLowerCase()),
);

/** Legacy message-text noise (failed logins, snapshot drift, peer mismatch). */
const NOISE_PATTERNS: RegExp[] = [
  /failed\s+login/i,
  /authentication\s+fail/i,
  /login\s+fail/i,
  /snapshot\s+policy\s+drift/i,
  /policy\s+drift/i,
  /peer\s+address\s+mismatch/i,
  /address\s+mismatch/i,
];

export function isHiddenByDefault(event: EmsEvent): boolean {
  const name = (event.message?.name ?? '').toLowerCase();
  if (name && HIDDEN_EVENT_NAMES.has(name)) return true;
  const haystack = `${event.log_message ?? ''} ${event.message?.name ?? ''} ${event.source ?? ''}`;
  return NOISE_PATTERNS.some((re) => re.test(haystack));
}

/** Overview donut: skip informational/notice so they do not dominate the chart. */
export const DONUT_SEVERITIES = ['emergency', 'alert', 'error', 'warning'] as const;
