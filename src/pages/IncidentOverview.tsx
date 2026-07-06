import { useParams } from 'react-router-dom';
import { isDemoIncidentId } from '../lib/incident-adapters';
import { IncidentOverviewApi } from './IncidentOverviewApi';
import { IncidentOverviewDemo } from './IncidentOverviewDemo';

export function IncidentOverview() {
  const { id } = useParams<{ id: string }>();
  if (isDemoIncidentId(id)) {
    return <IncidentOverviewDemo />;
  }
  return <IncidentOverviewApi />;
}
