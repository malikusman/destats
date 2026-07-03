import type { SystemStatusResponse, ServiceStatus } from '../types/scorpius';

export function getMockSystemStatus(): SystemStatusResponse {
  const now = new Date().toISOString();

  const services: ServiceStatus[] = [
    {
      id: 'svc-incident',
      name: 'Incident Service',
      description: 'Detects and manages Scorpius incidents from EMS and policy events',
      health: 'healthy',
      uptime_seconds: 7 * 86_400 + 3 * 3600,
      last_check: now,
      version: '2.1.4',
      endpoint: 'http://incident-service:8080',
      metrics: { incidents_processed_today: 23, avg_detection_ms: 340 },
    },
    {
      id: 'svc-ai',
      name: 'AI Platform (Reasoning Engine)',
      description: 'LLM-powered root cause analysis and action recommendation',
      health: 'healthy',
      uptime_seconds: 5 * 86_400 + 14 * 3600,
      last_check: now,
      version: '2.1.4',
      endpoint: 'http://ai-platform:8080',
      metrics: { analyses_today: 18, avg_confidence: 87, avg_analysis_ms: 4200 },
    },
    {
      id: 'svc-planner',
      name: 'Plan Generator',
      description: 'Generates and evaluates candidate remediation plans',
      health: 'healthy',
      uptime_seconds: 5 * 86_400 + 14 * 3600,
      last_check: now,
      version: '2.1.4',
      endpoint: 'http://planner:8080',
      metrics: { plans_generated_today: 14, avg_candidates_per_plan: 2.8 },
    },
    {
      id: 'svc-policy',
      name: 'Policy Engine',
      description: 'Evaluates plans against organisational policies and approval workflows',
      health: 'healthy',
      uptime_seconds: 5 * 86_400 + 14 * 3600,
      last_check: now,
      version: '2.1.4',
      endpoint: 'http://policy-engine:8080',
      metrics: { checks_today: 14, approved: 12, review_required: 2, rejected: 0 },
    },
    {
      id: 'svc-execution',
      name: 'Execution Layer',
      description: 'Executes approved remediation actions against ONTAP systems',
      health: 'healthy',
      uptime_seconds: 5 * 86_400 + 14 * 3600,
      last_check: now,
      version: '2.1.4',
      endpoint: 'http://execution-layer:8080',
      metrics: { actions_executed_today: 31, success_rate_pct: 96.8 },
    },
    {
      id: 'svc-knowledge',
      name: 'Knowledge Repository',
      description: 'RAG-powered knowledge store for runbooks, historical incidents, and use cases',
      health: 'healthy',
      uptime_seconds: 12 * 86_400,
      last_check: now,
      version: '2.1.4',
      endpoint: 'http://knowledge-repo:8080',
      metrics: { documents: 247, queries_today: 52, avg_similarity: 0.86 },
    },
    {
      id: 'svc-rabbitmq',
      name: 'RabbitMQ Message Bus',
      description: 'Event bus connecting all Scorpius microservices',
      health: 'healthy',
      uptime_seconds: 14 * 86_400,
      last_check: now,
      version: '3.12.8',
      endpoint: 'amqp://rabbitmq:5672',
      metrics: { queues: 12, messages_ready: 0, messages_unacked: 3, consumers: 24 },
    },
    {
      id: 'svc-db',
      name: 'PostgreSQL Database',
      description: 'Primary datastore for incidents, plans, and execution history',
      health: 'healthy',
      uptime_seconds: 30 * 86_400,
      last_check: now,
      version: '16.2',
      endpoint: 'postgres://postgres:5432',
      metrics: { connections: 18, max_connections: 100, db_size_gb: 2.4 },
    },
    {
      id: 'svc-netapp-api',
      name: 'NetApp Ingestion API',
      description: 'Polls ONTAP cluster REST APIs and pushes telemetry into Scorpius',
      health: 'degraded',
      uptime_seconds: 0,
      last_check: now,
      version: '1.3.2',
      endpoint: 'http://10.0.65.40:8080',
      error_message:
        'Connection refused: ONTAP cluster at 10.0.65.40 is not responding. ' +
        'Last successful poll: 2026-06-28T14:22:00Z.',
      metrics: { last_successful_poll: '2026-06-28T14:22:00Z', consecutive_failures: 47 },
    },
    {
      id: 'svc-scheduler',
      name: 'Compliance Scheduler',
      description: 'Runs scheduled compliance scans (snapshot policy, capacity, security checks)',
      health: 'healthy',
      uptime_seconds: 5 * 86_400,
      last_check: now,
      version: '2.1.4',
      endpoint: 'http://scheduler:8080',
      metrics: { scans_today: 6, next_scan_in_minutes: 12 },
    },
  ];

  const anyDown = services.some((s) => s.health === 'down');
  const anyDegraded = services.some((s) => s.health === 'degraded');
  const overall_health = anyDown ? 'down' : anyDegraded ? 'degraded' : 'healthy';

  return {
    overall_health,
    fetched_at: now,
    services,
  };
}
