import type { LucideIcon } from 'lucide-react';
import { BrainCircuit } from 'lucide-react';

interface WorkflowUnavailableProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function WorkflowUnavailable({
  title,
  description,
  icon: Icon = BrainCircuit,
}: WorkflowUnavailableProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
      <Icon className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
      <p className="mt-3 text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
