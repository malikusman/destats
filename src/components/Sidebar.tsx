import { NavLink } from 'react-router-dom';
import {
  Activity,
  Database,
  HardDrive,
  LayoutDashboard,
  Network,
  Server,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/capacity', label: 'Capacity & Efficiency', icon: Database },
  { to: '/aggregates', label: 'Aggregates', icon: HardDrive },
  { to: '/nodes', label: 'Nodes', icon: Server },
  { to: '/interfaces', label: 'Network', icon: Network },
  { to: '/events', label: 'Events (EMS)', icon: Activity },
];

export function Sidebar() {
  return (
    <aside className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:h-screen md:w-56 md:flex-col md:overflow-x-visible md:border-b-0 md:border-r md:px-3 md:py-4 md:sticky md:top-0">
      <div className="hidden items-center gap-2 px-2 pb-4 md:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <HardDrive className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-800">NetApp Monitor</div>
          <div className="font-mono text-[11px] text-slate-400">uspdc-nac01</div>
        </div>
      </div>
      <nav aria-label="Main navigation" className="flex flex-row gap-1 md:flex-col">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
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
      </nav>
      <div className="mt-auto hidden px-2 pt-4 text-[11px] text-slate-400 md:block">
        Hillsboro, OR DC
        <br />
        scorpius-netapp-ingestion-api
      </div>
    </aside>
  );
}
