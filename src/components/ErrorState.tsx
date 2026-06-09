import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({ error, onRetry, compact = false }: ErrorStateProps) {
  const message = error instanceof Error ? error.message : 'Something went wrong while fetching data.';
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-center ${
        compact ? 'p-4' : 'p-8'
      }`}
    >
      <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden />
      <p className="text-sm font-medium text-red-700">Failed to load data</p>
      <p className="max-w-md break-words text-xs text-red-500">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden />
          Retry
        </button>
      )}
    </div>
  );
}
