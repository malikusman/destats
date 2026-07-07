import { Link } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';

export function DemoWorkflowPlaceholder() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
      <BrainCircuit className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
      <p className="mt-3 text-sm font-medium text-slate-700">Workflow not available</p>
      <p className="mt-1 text-sm text-slate-500">
        AI Reasoning, Planning, and Execution are available for{' '}
        <span className="font-mono">INC-*</span> incidents. Open one from the list to explore the
        full workflow.
      </p>
      <Link to="/incidents" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
        Back to incidents
      </Link>
    </div>
  );
}
