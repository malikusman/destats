import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { Overview } from './pages/Overview';
import { Capacity } from './pages/Capacity';
import { Aggregates } from './pages/Aggregates';
import { Nodes } from './pages/Nodes';
import { Interfaces } from './pages/Interfaces';
import { Events } from './pages/Events';
import { Incidents } from './pages/Incidents';
import { IncidentDetail } from './pages/IncidentDetail';
import { AiReasoning } from './pages/AiReasoning';
import { Planning } from './pages/Planning';
import { Execution, ExecutionDashboard } from './pages/Execution';
import { Knowledge } from './pages/Knowledge';
import { SystemStatus } from './pages/SystemStatus';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Overview /> },
      { path: 'capacity', element: <Capacity /> },
      { path: 'aggregates', element: <Aggregates /> },
      { path: 'nodes', element: <Nodes /> },
      { path: 'interfaces', element: <Interfaces /> },
      { path: 'events', element: <Events /> },
      { path: 'incidents', element: <Incidents /> },
      {
        path: 'incidents/:id',
        element: <IncidentDetail />,
        children: [
          { path: 'reasoning', element: <AiReasoning /> },
          { path: 'planning', element: <Planning /> },
          { path: 'execution', element: <Execution /> },
        ],
      },
      { path: 'execution', element: <ExecutionDashboard /> },
      { path: 'knowledge', element: <Knowledge /> },
      { path: 'system-status', element: <SystemStatus /> },
    ],
  },
]);
