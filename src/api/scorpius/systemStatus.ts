/**
 * System Status API module.
 *
 * Live mode probes real health endpoints (ingestion /health, /api/netapp/summary,
 * incident-api /health). Mock data is only used when VITE_USE_MOCK_INCIDENTS=1.
 */
import type { ServiceHealth, ServiceStatus, SystemStatusResponse } from '../../types/scorpius';
import { USE_MOCK_INCIDENTS } from '../../lib/data-source';
import { getMockSystemStatus } from '../../mocks/systemStatus';
import { fetchHealth } from '../health';
import { fetchMetaSummary } from '../summary';
import { fetchIncidentHealth } from '../incident-service/incidents';

function overallFrom(services: ServiceStatus[]): ServiceHealth {
  if (services.some((s) => s.health === 'down')) return 'down';
  if (services.some((s) => s.health === 'degraded')) return 'degraded';
  if (services.every((s) => s.health === 'healthy')) return 'healthy';
  return 'unknown';
}

async function probeLiveSystemStatus(): Promise<SystemStatusResponse> {
  const checkedAt = new Date().toISOString();
  const services: ServiceStatus[] = [];

  const [ingestionHealth, meta, incidentHealth] = await Promise.allSettled([
    fetchHealth(),
    fetchMetaSummary(),
    fetchIncidentHealth(),
  ]);

  if (ingestionHealth.status === 'fulfilled') {
    const body = ingestionHealth.value;
    services.push({
      id: 'ingestion-api',
      name: 'NetApp Ingestion API',
      description: body.service || 'scorpius-netapp-ingestion-api',
      health: body.ok ? 'healthy' : 'down',
      last_check: body.time || checkedAt,
      endpoint: '/health',
    });
  } else {
    services.push({
      id: 'ingestion-api',
      name: 'NetApp Ingestion API',
      description: 'scorpius-netapp-ingestion-api',
      health: 'down',
      last_check: checkedAt,
      endpoint: '/health',
      error_message:
        ingestionHealth.reason instanceof Error
          ? ingestionHealth.reason.message
          : 'Health check failed',
    });
  }

  if (meta.status === 'fulfilled') {
    const sources = meta.value.sources ?? {};
    for (const [name, source] of Object.entries(sources)) {
      services.push({
        id: `ingest-source-${name}`,
        name: `Ingestion · ${name}`,
        description: source.source || `ONTAP ${name} collector`,
        health: source.ok ? 'healthy' : 'down',
        last_check: meta.value.fetched_at || checkedAt,
        endpoint: `/api/netapp/${name}`,
        metrics: {
          records: source.count,
          status_code: source.status_code,
        },
        error_message: source.ok ? undefined : `Upstream status ${source.status_code}`,
      });
    }
  } else {
    services.push({
      id: 'ingest-summary',
      name: 'Ingestion summary',
      description: '/api/netapp/summary',
      health: 'down',
      last_check: checkedAt,
      endpoint: '/api/netapp/summary',
      error_message:
        meta.reason instanceof Error ? meta.reason.message : 'Summary probe failed',
    });
  }

  if (incidentHealth.status === 'fulfilled') {
    const body = incidentHealth.value;
    const status = (body.status ?? '').toLowerCase();
    const healthy = status === 'healthy' || status === 'ok';
    services.push({
      id: 'incident-api',
      name: 'Incident / Platform API',
      description: 'Incidents, knowledge, learning, evaluation',
      health: healthy ? 'healthy' : 'degraded',
      last_check: checkedAt,
      endpoint: '/incident-api/health',
      metrics: { status: body.status },
    });
  } else {
    services.push({
      id: 'incident-api',
      name: 'Incident / Platform API',
      description: 'Incidents, knowledge, learning, evaluation',
      health: 'down',
      last_check: checkedAt,
      endpoint: '/incident-api/health',
      error_message:
        incidentHealth.reason instanceof Error
          ? incidentHealth.reason.message
          : 'Health check failed',
    });
  }

  return {
    overall_health: overallFrom(services),
    fetched_at: checkedAt,
    services,
  };
}

export async function fetchSystemStatus(): Promise<SystemStatusResponse> {
  if (USE_MOCK_INCIDENTS) {
    await delay(200);
    return getMockSystemStatus();
  }
  return probeLiveSystemStatus();
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
