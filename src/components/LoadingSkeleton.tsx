interface LoadingSkeletonProps {
  /** Number of placeholder rows. */
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ rows = 4, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`} aria-label="Loading" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-4 rounded bg-slate-100" style={{ width: `${90 - (i % 3) * 15}%` }} />
      ))}
    </div>
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <LoadingSkeleton rows={5} />
    </div>
  );
}
