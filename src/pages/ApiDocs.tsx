import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Code2 } from 'lucide-react';

type HttpMethod = 'GET' | 'POST' | 'PATCH';

interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  statusCodes: string;
  uiIntegrated: boolean;
  uiNote: string;
  clientFn: string;
  requestBody?: string;
  sampleResponse: string;
  curl: string;
}

const BASE = '/incident-api';
const SAMPLE_ID = 'e94c2c19-7bc5-4448-ae0b-5b94fb4ff6b9';

const ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'health',
    method: 'GET',
    path: '/health',
    summary: 'Liveness check for the Incident Service.',
    statusCodes: '200',
    uiIntegrated: false,
    uiNote: 'Client only — not shown in the dashboard',
    clientFn: 'fetchIncidentHealth()',
    sampleResponse: JSON.stringify({ status: 'healthy' }, null, 2),
    curl: `curl -s ${BASE}/health`,
  },
  {
    id: 'stats',
    method: 'GET',
    path: '/incidents/stats',
    summary: 'Aggregate counts across all incidents (including resolved/closed). Powers KPI tiles.',
    statusCodes: '200',
    uiIntegrated: true,
    uiNote: 'Incidents page — KPI tiles via useUnifiedIncidents',
    clientFn: 'fetchIncidentStats()',
    sampleResponse: JSON.stringify(
      {
        total: 10,
        new: 3,
        investigating: 4,
        resolved: 3,
        closed: 0,
        critical: 1,
        high: 9,
        medium: 0,
        low: 0,
      },
      null,
      2,
    ),
    curl: `curl -s ${BASE}/incidents/stats`,
  },
  {
    id: 'list',
    method: 'GET',
    path: '/incidents',
    summary: 'Active incidents only (excludes Resolved and Closed). Each item is a list-row shape.',
    statusCodes: '200',
    uiIntegrated: true,
    uiNote: 'Incidents list — Live rows via useUnifiedIncidents',
    clientFn: 'fetchIncidentList()',
    sampleResponse: JSON.stringify(
      [
        {
          incident_id: SAMPLE_ID,
          title: 'High latency detected',
          entity: 'node-01',
          severity: 'WARNING',
          priority: 'High',
          status: 'Investigating',
          alert_count: 1,
          correlation_key: 'node-01:latency.high:storage_filesystem',
        },
      ],
      null,
      2,
    ),
    curl: `curl -s ${BASE}/incidents`,
  },
  {
    id: 'detail',
    method: 'GET',
    path: '/incidents/{id}',
    summary: 'Full incident detail for a single UUID incident.',
    statusCodes: '200 / 404',
    uiIntegrated: true,
    uiNote: 'UUID incident detail header + overview',
    clientFn: 'fetchIncidentById(id)',
    sampleResponse: JSON.stringify(
      {
        incident_id: SAMPLE_ID,
        title: 'High latency detected',
        source: 'RabbitMQ',
        entity: 'node-01',
        asset_type: 'NetApp',
        severity: 'WARNING',
        priority: 'High',
        status: 'Investigating',
        owner: 'api-test',
        related_alert_ids: ['alert-101'],
        correlation_key: 'node-01:latency.high:storage_filesystem',
        raw_alerts: [],
      },
      null,
      2,
    ),
    curl: `curl -s ${BASE}/incidents/${SAMPLE_ID}`,
  },
  {
    id: 'timeline',
    method: 'GET',
    path: '/incidents/{id}/timeline',
    summary: 'Chronological lifecycle events for an incident.',
    statusCodes: '200 / 404',
    uiIntegrated: true,
    uiNote: 'Overview tab — timeline section',
    clientFn: 'fetchIncidentTimeline(id)',
    sampleResponse: JSON.stringify(
      [
        {
          timestamp: '2026-07-02T00:00:00Z',
          event: 'Incident created',
          details: 'Initial anomaly converted into incident',
        },
        {
          timestamp: '2026-07-02T00:03:00Z',
          event: 'Alert correlated',
          details: 'Related alert added',
        },
      ],
      null,
      2,
    ),
    curl: `curl -s ${BASE}/incidents/${SAMPLE_ID}/timeline`,
  },
  {
    id: 'related',
    method: 'GET',
    path: '/incidents/{id}/related',
    summary: 'Other incidents related by correlation / history.',
    statusCodes: '200 / 404',
    uiIntegrated: true,
    uiNote: 'Overview tab — related incidents',
    clientFn: 'fetchRelatedIncidents(id)',
    sampleResponse: JSON.stringify(
      [
        {
          incident_id: 'inc-related-001',
          title: 'Storage latency anomaly',
          severity: 'WARNING',
          status: 'Resolved',
        },
      ],
      null,
      2,
    ),
    curl: `curl -s ${BASE}/incidents/${SAMPLE_ID}/related`,
  },
  {
    id: 'recommendations',
    method: 'GET',
    path: '/incidents/{id}/recommendations',
    summary: 'Suggested remediation actions for an incident.',
    statusCodes: '200 / 404',
    uiIntegrated: true,
    uiNote: 'Overview tab — recommendations',
    clientFn: 'fetchIncidentRecommendations(id)',
    sampleResponse: JSON.stringify(
      [
        {
          recommendation_id: 'rec-001',
          title: 'Check storage latency',
          confidence: 0.86,
          risk: 'Low',
        },
      ],
      null,
      2,
    ),
    curl: `curl -s ${BASE}/incidents/${SAMPLE_ID}/recommendations`,
  },
  {
    id: 'create',
    method: 'POST',
    path: '/incidents',
    summary:
      'Create an incident from an alert, or correlate into an existing one if the correlation key already exists (entity:event_code:intent).',
    statusCodes: '201 (new) / 200 (correlate)',
    uiIntegrated: false,
    uiNote: 'API client exists — no create form in the UI yet',
    clientFn: 'createIncidentFromAlert(alert)',
    requestBody: JSON.stringify(
      {
        alert_id: 'alert-api-test-001',
        entity: 'node-test',
        severity: 'WARNING',
        title: 'API test incident',
        event_code: 'test.latency',
        intent: 'testing',
      },
      null,
      2,
    ),
    sampleResponse: JSON.stringify(
      {
        incident_id: '1cc8cd12-097f-41df-a7b8-2688c3456fc2',
        title: 'API test incident',
        status: 'New',
        priority: 'Medium',
        alert_count: 1,
        correlation_key: 'node-test:test.latency:testing',
      },
      null,
      2,
    ),
    curl: `curl -s -X POST ${BASE}/incidents \\\n  -H 'Content-Type: application/json' \\\n  -d '{"alert_id":"alert-001","entity":"node-test","severity":"WARNING","title":"API test","event_code":"test.latency","intent":"testing"}'`,
  },
  {
    id: 'patch',
    method: 'PATCH',
    path: '/incidents/{id}',
    summary:
      'Update status, owner, and/or priority. Appends a timeline event when status changes.',
    statusCodes: '200 / 404',
    uiIntegrated: false,
    uiNote: 'API client exists — no edit controls in the UI yet',
    clientFn: 'patchIncident(id, patch)',
    requestBody: JSON.stringify(
      { status: 'Investigating', owner: 'api-test', priority: 'High' },
      null,
      2,
    ),
    sampleResponse: JSON.stringify(
      {
        incident_id: SAMPLE_ID,
        status: 'Investigating',
        owner: 'api-test',
        priority: 'High',
      },
      null,
      2,
    ),
    curl: `curl -s -X PATCH ${BASE}/incidents/${SAMPLE_ID} \\\n  -H 'Content-Type: application/json' \\\n  -d '{"status":"Investigating","owner":"api-test","priority":"High"}'`,
  },
];

const PLATFORM_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'uc-list',
    method: 'GET',
    path: '/usecases',
    summary: 'List use cases (Epic 4).',
    statusCodes: '200',
    uiIntegrated: true,
    uiNote: 'Use Cases page via useUseCases',
    clientFn: 'fetchUseCases()',
    sampleResponse: JSON.stringify(
      [{ id: 1, title: 'Aggregate near full', status: 'Approved', category: 'capacity' }],
      null,
      2,
    ),
    curl: `curl -s ${BASE}/usecases`,
  },
  {
    id: 'uc-create',
    method: 'POST',
    path: '/usecases',
    summary: 'Create a draft use case.',
    statusCodes: '200',
    uiIntegrated: true,
    uiNote: 'Use Cases — New draft',
    clientFn: 'createUseCase(payload)',
    requestBody: JSON.stringify(
      {
        title: 'Smoke use case',
        description: '…',
        category: 'capacity',
        status: 'draft',
      },
      null,
      2,
    ),
    sampleResponse: JSON.stringify({ id: 15, title: 'Smoke use case', status: 'draft' }, null, 2),
    curl: `curl -s -X POST ${BASE}/usecases -H 'Content-Type: application/json' -d '{"title":"Smoke","status":"draft"}'`,
  },
  {
    id: 'kn-list',
    method: 'GET',
    path: '/knowledge',
    summary: 'List knowledge items (Epic 5).',
    statusCodes: '200',
    uiIntegrated: true,
    uiNote: 'Knowledge page (default live; VITE_USE_MOCK_KNOWLEDGE=1 for mocks)',
    clientFn: 'fetchKnowledgeAsDocuments()',
    sampleResponse: JSON.stringify(
      [{ id: 19, title: 'Capacity thresholds', embedding_status: 'completed' }],
      null,
      2,
    ),
    curl: `curl -s ${BASE}/knowledge`,
  },
  {
    id: 'kn-retrieve',
    method: 'POST',
    path: '/knowledge/retrieve',
    summary: 'Semantic retrieve for incident context.',
    statusCodes: '200',
    uiIntegrated: true,
    uiNote: 'UUID incident overview + reasoning tabs',
    clientFn: 'retrieveKnowledge({ query, limit })',
    requestBody: JSON.stringify(
      { query: 'aggregate utilization exceeded threshold', limit: 5 },
      null,
      2,
    ),
    sampleResponse: JSON.stringify(
      { ok: true, retrieval_type: 'semantic_context_package', semantic_search: { returned_records: 5 } },
      null,
      2,
    ),
    curl: `curl -s -X POST ${BASE}/knowledge/retrieve -H 'Content-Type: application/json' -d '{"query":"capacity","limit":5}'`,
  },
  {
    id: 'lr-list',
    method: 'GET',
    path: '/learning',
    summary: 'List learning records (Epic 10).',
    statusCodes: '200',
    uiIntegrated: true,
    uiNote: 'Learning page',
    clientFn: 'fetchLearningList()',
    sampleResponse: JSON.stringify(
      { ok: true, learning_record: { learning_id: 'LRN-…', outcome_status: 'pending' } },
      null,
      2,
    ),
    curl: `curl -s ${BASE}/learning`,
  },
  {
    id: 'lr-apply',
    method: 'POST',
    path: '/learning/apply',
    summary: 'Adjust recommendation confidence from historical learning.',
    statusCodes: '200',
    uiIntegrated: true,
    uiNote: 'Incident overview / reasoning — learning-adjusted recs',
    clientFn: 'applyLearning({ recommendations })',
    requestBody: JSON.stringify(
      {
        recommendations: [
          { recommendation: 'Expand aggregate capacity', confidence: 0.75 },
        ],
      },
      null,
      2,
    ),
    sampleResponse: JSON.stringify(
      { ok: true, recommendations: [{ rank: 1, adjusted_confidence: 0.5, learning_applied: true }] },
      null,
      2,
    ),
    curl: `curl -s -X POST ${BASE}/learning/apply -H 'Content-Type: application/json' -d '{"recommendations":[{"recommendation":"Expand capacity","confidence":0.75}]}'`,
  },
  {
    id: 'lr-feedback',
    method: 'POST',
    path: '/learning/{id}/feedback',
    summary: 'Record success/failure feedback (requires boolean success).',
    statusCodes: '200',
    uiIntegrated: true,
    uiNote: 'Learning page + incident overview panels',
    clientFn: 'submitLearningFeedback(id, { success })',
    requestBody: JSON.stringify({ success: true, rating: 5 }, null, 2),
    sampleResponse: JSON.stringify(
      { ok: true, learning_record: { outcome_status: 'success', confidence_after: 0.875 } },
      null,
      2,
    ),
    curl: `curl -s -X POST ${BASE}/learning/LRN-…/feedback -H 'Content-Type: application/json' -d '{"success":true}'`,
  },
  {
    id: 'ev-run',
    method: 'POST',
    path: '/evaluation/run',
    summary: 'Run an evaluation against a learning id (Epic 11).',
    statusCodes: '200',
    uiIntegrated: true,
    uiNote: 'Evaluation page + incident overview Run evaluation',
    clientFn: 'runEvaluation(body)',
    requestBody: JSON.stringify(
      {
        learning_id: 'LRN-749118C28398',
        evaluation_type: 'learning_outcome',
        created_by: 'destats-ui',
      },
      null,
      2,
    ),
    sampleResponse: JSON.stringify(
      { ok: true, evaluation: { evaluation_id: 'EVAL-…', overall_score: 0.85, status: 'completed' } },
      null,
      2,
    ),
    curl: `curl -s -X POST ${BASE}/evaluation/run -H 'Content-Type: application/json' -d '{"learning_id":"LRN-749118C28398","evaluation_type":"learning_outcome"}'`,
  },
  {
    id: 'ev-list',
    method: 'GET',
    path: '/evaluation',
    summary: 'List evaluations / history.',
    statusCodes: '200',
    uiIntegrated: true,
    uiNote: 'Evaluation page',
    clientFn: 'fetchEvaluations() / fetchEvaluationHistory()',
    sampleResponse: JSON.stringify([{ evaluation_id: 'EVAL-…', status: 'completed' }], null, 2),
    curl: `curl -s ${BASE}/evaluation`,
  },
];

const ALL_ENDPOINTS = [...ENDPOINTS, ...PLATFORM_ENDPOINTS];

const METHOD_STYLE: Record<HttpMethod, string> = {
  GET: 'bg-emerald-100 text-emerald-800',
  POST: 'bg-blue-100 text-blue-800',
  PATCH: 'bg-amber-100 text-amber-800',
};

function EndpointCard({ ep }: { ep: ApiEndpoint }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <span
          className={`mt-0.5 shrink-0 rounded px-2 py-0.5 font-mono text-[11px] font-bold ${METHOD_STYLE[ep.method]}`}
        >
          {ep.method}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <code className="font-mono text-sm font-semibold text-slate-800">{ep.path}</code>
            <span className="text-[11px] text-slate-400">HTTP {ep.statusCodes}</span>
            {ep.uiIntegrated ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" aria-hidden />
                In UI
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                API only
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">{ep.summary}</p>
        </div>
        {open ? (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        ) : (
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        )}
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-100 px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Client
              </p>
              <code className="mt-0.5 block font-mono text-xs text-slate-700">{ep.clientFn}</code>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                UI usage
              </p>
              <p className="mt-0.5 text-xs text-slate-600">{ep.uiNote}</p>
            </div>
          </div>

          {ep.requestBody && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Request body
              </p>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-100">
                {ep.requestBody}
              </pre>
            </div>
          )}

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Sample response
            </p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-100">
              {ep.sampleResponse}
            </pre>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              curl
            </p>
            <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700">
              {ep.curl}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function ApiDocs() {
  const inUi = ALL_ENDPOINTS.filter((e) => e.uiIntegrated).length;
  const apiOnly = ALL_ENDPOINTS.length - inUi;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-blue-600" aria-hidden />
          <h1 className="text-xl font-semibold text-slate-800">Platform API Docs</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Working REST endpoints proxied at{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">/incident-api</code>
          — Epic 2/3 incidents plus Epic 4/5/10/11 use cases, knowledge, learning, and evaluation.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Endpoints
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{ALL_ENDPOINTS.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            Used in UI
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{inUi}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            API only
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{apiOnly}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Base URL
        </p>
        <div className="mt-2 space-y-1.5 font-mono text-xs text-slate-700">
          <p>
            <span className="text-slate-400">Browser / app:</span> {BASE}
          </p>
          <p>
            <span className="text-slate-400">TDK server:</span> http://10.0.65.19:8088/incident-api
          </p>
          <p>
            <span className="text-slate-400">Local mock-api:</span> http://localhost:3090
          </p>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Auth: none. Knowledge offline fallback:{' '}
          <code className="font-mono">VITE_USE_MOCK_KNOWLEDGE=1</code>. Full smoke report:{' '}
          <code className="font-mono">docs/EPIC_4_5_10_11_API_TEST_REPORT.md</code>
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700">Epic 2 / 3 — Incidents</h2>
        {ENDPOINTS.map((ep) => (
          <EndpointCard key={ep.id} ep={ep} />
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700">
          Epic 4 / 5 / 10 / 11 — Use Cases, Knowledge, Learning, Evaluation
        </h2>
        {PLATFORM_ENDPOINTS.map((ep) => (
          <EndpointCard key={ep.id} ep={ep} />
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-medium text-slate-600">Notes</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>
            Demo incidents with <code className="font-mono">INC-*</code> IDs keep mock reasoning /
            planning / execution; live UUIDs use platform panels.
          </li>
          <li>
            Learning feedback requires <code className="font-mono">{'"success": true|false'}</code>.
          </li>
          <li>
            Smoke tests: <code className="font-mono">bash scripts/test-epic-apis.sh</code> and{' '}
            <code className="font-mono">bash scripts/test-epic-writes.sh</code>.
          </li>
        </ul>
      </div>
    </div>
  );
}
