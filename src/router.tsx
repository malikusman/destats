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
import { Knowledge } from './pages/Knowledge';
import { UseCases } from './pages/UseCases';
import { Learning } from './pages/Learning';
import { Evaluation } from './pages/Evaluation';
import { SystemStatus } from './pages/SystemStatus';
import {
  ControlPlane,
  ControlPlaneAuditTab,
  ControlPlaneIndex,
  ControlPlaneModelsTab,
  ControlPlanePolicyTab,
  ControlPlanePromptsTab,
} from './pages/ControlPlane';
import { IncidentControlPlane } from './pages/IncidentControlPlane';

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
          { path: 'control-plane', element: <IncidentControlPlane /> },
          { path: 'execution', element: <Navigate to="overview" replace /> },
        ],
      },
      { path: 'execution', element: <Navigate to="/incidents" replace /> },
      { path: 'knowledge', element: <Knowledge /> },
      { path: 'usecases', element: <UseCases /> },
      { path: 'learning', element: <Learning /> },
      { path: 'evaluation', element: <Evaluation /> },
      { path: 'system-status', element: <SystemStatus /> },
      {
        path: 'control-plane',
        element: <ControlPlane />,
        children: [
          { index: true, element: <ControlPlaneIndex /> },
          { path: 'models', element: <ControlPlaneModelsTab /> },
          { path: 'prompts', element: <ControlPlanePromptsTab /> },
          { path: 'audit', element: <ControlPlaneAuditTab /> },
          { path: 'policy', element: <ControlPlanePolicyTab /> },
        ],
      },
      { path: 'ai-models', element: <Navigate to="/control-plane/models" replace /> },
      { path: 'prompt-catalog', element: <Navigate to="/control-plane/prompts" replace /> },
      { path: 'ai-audit', element: <Navigate to="/control-plane/audit" replace /> },
      { path: 'policy-rules', element: <Navigate to="/control-plane/policy" replace /> },
      { path: 'api-docs', element: <Navigate to="/" replace /> },
    ],
  },
]);
