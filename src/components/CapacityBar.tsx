import { capacityTone, toneBarClass, toneTextClass } from '../lib/status';
import { formatPercent } from '../lib/format';

interface CapacityBarProps {
  usedPercent: number | undefined | null;
  /** Draws a vertical marker, e.g. the aggregate full_threshold_percent (96). */
  thresholdPercent?: number;
  showLabel?: boolean;
  className?: string;
}

export function CapacityBar({
  usedPercent,
  thresholdPercent,
  showLabel = true,
  className = '',
}: CapacityBarProps) {
  const percent = Number.isFinite(usedPercent ?? NaN) ? (usedPercent as number) : 0;
  // Within 5 points of the full threshold counts as critical.
  const nearThreshold =
    thresholdPercent !== undefined && percent >= thresholdPercent - 5;
  const tone = nearThreshold ? 'crit' : capacityTone(percent);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Used ${formatPercent(percent)}`}
      >
        <div
          className={`h-full rounded-full transition-all ${toneBarClass[tone]}`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
        {thresholdPercent !== undefined && (
          <div
            className="absolute top-0 h-full w-0.5 bg-red-400"
            style={{ left: `${Math.min(100, thresholdPercent)}%` }}
            title={`Full threshold: ${thresholdPercent}%`}
          />
        )}
      </div>
      {showLabel && (
        <span className={`w-12 text-right text-xs font-semibold tabular-nums ${toneTextClass[tone]}`}>
          {formatPercent(percent, percent >= 10 ? 0 : 1)}
        </span>
      )}
    </div>
  );
}
