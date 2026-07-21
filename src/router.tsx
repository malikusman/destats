import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { Overview } from './pages/Overview';
import { Capacity } from './pages/Capacity';
import { Aggregates } from './pages/Aggregates';
import { Nodes } from './pages/Nodes';
import { Interfaces } from './pages/Interfaces';
import { Events } from './pages/Events';
import { Incidents } from './pages/Incidents';
import { IncidentOverview } from './pages/IncidentOverview';
import { IncidentDetail } from './pages/IncidentDetail';
import { AiReasoning } from './pages/AiReasoning';
import { Planning } from './pages/Planning';
import { Execution, ExecutionDashboard } from './pages/Execution';
import { Knowledge } from './pages/Knowledge';
import { UseCases } from './pages/UseCases';
import { Learning } from './pages/Learning';
import { Evaluation } from './pages/Evaluation';
import { SystemStatus } from './pages/SystemStatus';
import { ApiDocs } from './pages/ApiDocs';

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
          { index: true, element: <Navigate to="overview" replace /> },
          { path: 'overview', element: <IncidentOverview /> },
          { path: 'reasoning', element: <AiReasoning /> },
          { path: 'planning', element: <Planning /> },
          { path: 'execution', element: <Execution /> },
        ],
      },
      { path: 'execution', element: <ExecutionDashboard /> },
      { path: 'knowledge', element: <Knowledge /> },
      { path: 'usecases', element: <UseCases /> },
      { path: 'learning', element: <Learning /> },
      { path: 'evaluation', element: <Evaluation /> },
      { path: 'system-status', element: <SystemStatus /> },
      { path: 'api-docs', element: <ApiDocs /> },
    ],
  },
]);
