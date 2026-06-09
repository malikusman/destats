import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { Overview } from './pages/Overview';
import { Capacity } from './pages/Capacity';
import { Aggregates } from './pages/Aggregates';
import { Nodes } from './pages/Nodes';
import { Interfaces } from './pages/Interfaces';
import { Events } from './pages/Events';

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
    ],
  },
]);
