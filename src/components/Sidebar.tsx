import { NavLink } from 'react-router-dom';
import {
  Activity,
  Bot,
  BrainCircuit,
  BookOpen,
  ClipboardCheck,
  Cpu,
  Database,
  GraduationCap,
  HardDrive,
  LayoutDashboard,
  Lightbulb,
  Network,
  Server,
  ShieldCheck,
  Siren,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNodes } from '../hooks/queries';
import { deriveClusterIdentity } from '../lib/cluster-identity';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NETAPP_NAV: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/capacity', label: 'Capacity & Efficiency', icon: Database },
  { to: '/aggregates', label: 'Aggregates', icon: HardDrive },
  { to: '/nodes', label: 'Nodes', icon: Server },
  { to: '/interfaces', label: 'Network', icon: Network },
  { to: '/events', label: 'Events (EMS)', icon: Activity },
];

const SCORPIUS_NAV: NavItem[] = [
  { to: '/incidents', label: 'Incidents', icon: Siren },
  { to: '/knowledge', label: 'Knowledge', icon: BookOpen },
  { to: '/usecases', label: 'Use Cases', icon: Lightbulb },
  { to: '/learning', label: 'Learning', icon: GraduationCap },
  { to: '/evaluation', label: 'Evaluation', icon: ClipboardCheck },
  { to: '/system-status', label: 'System Status', icon: ShieldCheck },
];

const SCORPIUS_NAV_DISABLED = [{ label: 'Create Agent', icon: Bot }] as const;

function NavSection({ items }: { items: NavItem[] }) {
  return (
    <>
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {label}
        </NavLink>
      ))}
    </>
  );
}

export function Sidebar() {
  const nodes = useNodes();
  const identity = deriveClusterIdentity(nodes.data ?? []);
  const clusterLabel = identity.clusterName ?? (nodes.isPending ? '…' : '—');

  return (
    <aside className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:h-screen md:w-56 md:flex-col md:overflow-x-visible md:border-b-0 md:border-r md:px-3 md:py-4 md:sticky md:top-0">
      <div className="hidden items-center gap-2 px-2 pb-4 md:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <HardDrive className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-800">NetApp Monitor</div>
          <div className="font-mono text-[11px] text-slate-400">{clusterLabel}</div>
        </div>
      </div>

      <nav aria-label="NetApp navigation" className="flex flex-row gap-1 md:flex-col">
        <div className="hidden px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:block">
          NetApp Storage
        </div>
        <NavSection items={NETAPP_NAV} />
      </nav>

      <nav aria-label="Scorpius navigation" className="flex flex-row gap-1 md:mt-4 md:flex-col">
        <div className="hidden items-center gap-1.5 px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:flex">
          <BrainCircuit className="h-3 w-3" />
          Scorpius Platform
        </div>
        <NavSection items={SCORPIUS_NAV} />
        {SCORPIUS_NAV_DISABLED.map(({ label, icon: Icon }) => (
          <span
            key={label}
            className="flex cursor-not-allowed items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-300"
            title="Coming soon"
            aria-disabled="true"
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </span>
        ))}
      </nav>

      <div className="mt-auto hidden space-y-1 px-2 pt-4 md:block">
        <NavLink
          to="/control-plane"
          className={({ isActive }) =>
            `inline-flex items-center gap-1.5 text-[11px] transition-colors ${
              isActive
                ? 'font-medium text-blue-700'
                : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Cpu className="h-3 w-3 shrink-0" aria-hidden />
          Control Plane
        </NavLink>
        {identity.location && <div className="text-[11px] text-slate-400">{identity.location}</div>}
        {identity.ontapVersion && (
          <div className="font-mono text-[11px] text-slate-400">ONTAP {identity.ontapVersion}</div>
        )}
        {!identity.location && !identity.ontapVersion && nodes.isPending && (
          <div className="text-[11px] text-slate-400">Loading…</div>
        )}
      </div>

      {/* Mobile: keep Control Plane reachable in the horizontal strip */}
      <NavLink
        to="/control-plane"
        className={({ isActive }) =>
          `inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors md:hidden ${
            isActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
          }`
        }
      >
        <Cpu className="h-4 w-4 shrink-0" aria-hidden />
        Control Plane
      </NavLink>
    </aside>
  );
}
