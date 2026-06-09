import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      {icon ?? <Inbox className="h-6 w-6 text-slate-400" aria-hidden />}
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && <div className="max-w-md text-xs text-slate-400">{description}</div>}
    </div>
  );
}
