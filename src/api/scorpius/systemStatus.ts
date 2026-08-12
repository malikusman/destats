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
import {
  fetchAgentHealth,
  fetchAiHealth,
  fetchExecutionHealth,
  fetchPolicyHealth,
  type ControlPlaneHealth,
} from '../control-plane/health';

function overallFrom(services: ServiceStatus[]): ServiceHealth {
  if (services.some((s) => s.health === 'down')) return 'down';
  if (services.some((s) => s.health === 'degraded')) return 'degraded';
  if (services.every((s) => s.health === 'healthy')) return 'healthy';
  return 'unknown';
}

function controlPlaneOk(body: ControlPlaneHealth): boolean {
  const status = (body.status ?? '').toLowerCase();
  return status === 'ok' || status === 'healthy';
}

function pushControlPlaneProbe(
  services: ServiceStatus[],
  checkedAt: string,
  result: PromiseSettledResult<ControlPlaneHealth>,
  meta: { id: string; name: string; description: string; endpoint: string },
) {
  if (result.status === 'fulfilled') {
    const body = result.value;
    const metrics: Record<string, string | number> = { status: body.status };
    if (body.service) metrics.service = body.service;
    if (body.mode) metrics.mode = body.mode;
    services.push({
      id: meta.id,
      name: meta.name,
      description: body.mode
        ? `${meta.description} (mode: ${body.mode})`
        : meta.description,
      health: controlPlaneOk(body) ? 'healthy' : 'degraded',
      last_check: checkedAt,
      endpoint: meta.endpoint,
      metrics,
    });
  } else {
    services.push({
      id: meta.id,
      name: meta.name,
      description: meta.description,
      health: 'down',
      last_check: checkedAt,
      endpoint: meta.endpoint,
      error_message:
        result.reason instanceof Error ? result.reason.message : 'Health check failed',
    });
  }
}

async function probeLiveSystemStatus(): Promise<SystemStatusResponse> {
  const checkedAt = new Date().toISOString();
  const services: ServiceStatus[] = [];

  const [
    ingestionHealth,
    meta,
    incidentHealth,
    aiHealth,
    agentHealth,
    policyHealth,
    executionHealth,
  ] = await Promise.allSettled([
    fetchHealth(),
    fetchMetaSummary(),
    fetchIncidentHealth(),
    fetchAiHealth(),
    fetchAgentHealth(),
    fetchPolicyHealth(),
    fetchExecutionHealth(),
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

  pushControlPlaneProbe(services, checkedAt, aiHealth, {
    id: 'control-plane-ai',
    name: 'AI Gateway',
    description: 'Control Plane · Epic 13',
    endpoint: '/control-plane-api/ai/health',
  });
  pushControlPlaneProbe(services, checkedAt, agentHealth, {
    id: 'control-plane-agent',
    name: 'Agent Intelligence',
    description: 'Control Plane · Epic 7',
    endpoint: '/control-plane-api/agent/health',
  });
  pushControlPlaneProbe(services, checkedAt, policyHealth, {
    id: 'control-plane-policy',
    name: 'Policy Engine',
    description: 'Control Plane · Epic 14',
    endpoint: '/control-plane-api/policy/health',
  });
  pushControlPlaneProbe(services, checkedAt, executionHealth, {
    id: 'control-plane-execution',
    name: 'Execution Proxy',
    description: 'Control Plane · safe simulation boundary',
    endpoint: '/control-plane-api/execution/health',
  });

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
