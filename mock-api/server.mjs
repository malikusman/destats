/**
 * Scorpius Incident Service — mock REST API (Epic 2 & 3).
 * Run: npm run mock-api  (default port 3090)
 */
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import {
  incidentDetails as seedDetails,
  timelines as seedTimelines,
  relatedIncidents as seedRelated,
  recommendations as seedRecommendations,
  toListItem,
  computeStats,
  isActive,
} from './data.mjs';

const PORT = Number(process.env.MOCK_API_PORT) || 3090;

// In-memory store (cloned from seed on startup)
let incidents = structuredClone(seedDetails);
let timelines = structuredClone(seedTimelines);
let relatedIncidents = structuredClone(seedRelated);
let recommendations = structuredClone(seedRecommendations);

const app = express();
app.use(cors());
app.use(express.json());

function findIncident(id) {
  return incidents.find((i) => i.incident_id === id);
}

function correlationKey(alert) {
  const entity = alert.entity ?? alert.host ?? 'unknown';
  const code = alert.event_code ?? 'unknown';
  const intent = alert.intent ?? 'general';
  return `${entity}:${code}:${intent}`;
}

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

// ---------------------------------------------------------------------------
// GET /incidents/stats  — must be before /:id
// ---------------------------------------------------------------------------
app.get('/incidents/stats', (_req, res) => {
  res.json(computeStats(incidents));
});

// ---------------------------------------------------------------------------
// GET /incidents
// ---------------------------------------------------------------------------
app.get('/incidents', (_req, res) => {
  const active = incidents.filter(isActive).map(toListItem);
  res.json(active);
});

// ---------------------------------------------------------------------------
// POST /incidents
// ---------------------------------------------------------------------------
app.post('/incidents', (req, res) => {
  const alert = req.body ?? {};
  const key = correlationKey(alert);
  const now = alert.timestamp ?? new Date().toISOString();

  let existing = incidents.find((i) => i.correlation_key === key);
  if (existing) {
    existing.last_seen = now;
    existing.alert_count = (existing.alert_count ?? 0) + 1;
    if (alert.alert_id && !existing.related_alert_ids.includes(alert.alert_id)) {
      existing.related_alert_ids.push(alert.alert_id);
    }
    return res.status(200).json(existing);
  }

  const incident_id = crypto.randomUUID();
  const created = {
    incident_id,
    title: alert.title ?? 'Untitled incident',
    description: alert.description ?? '',
    source: 'RabbitMQ',
    entity: alert.entity ?? alert.host ?? 'unknown',
    asset_type: 'NetApp',
    severity: alert.severity ?? 'WARNING',
    priority: 'Medium',
    status: 'New',
    owner: undefined,
    first_seen: now,
    last_seen: now,
    alert_count: 1,
    related_alert_ids: alert.alert_id ? [alert.alert_id] : [],
    correlation_key: key,
    raw_alerts: [alert],
  };

  incidents.push(created);
  timelines[incident_id] = [
    {
      timestamp: now,
      event: 'Incident created',
      details: 'Initial anomaly converted into incident',
    },
  ];
  relatedIncidents[incident_id] = [];
  recommendations[incident_id] = [];

  res.status(201).json(created);
});

// ---------------------------------------------------------------------------
// GET /incidents/:incident_id
// ---------------------------------------------------------------------------
app.get('/incidents/:incident_id', (req, res) => {
  const incident = findIncident(req.params.incident_id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });
  res.json(incident);
});

// ---------------------------------------------------------------------------
// PATCH /incidents/:incident_id
// ---------------------------------------------------------------------------
app.patch('/incidents/:incident_id', (req, res) => {
  const incident = findIncident(req.params.incident_id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const { status, owner, priority } = req.body ?? {};
  if (status !== undefined) incident.status = status;
  if (owner !== undefined) incident.owner = owner;
  if (priority !== undefined) incident.priority = priority;
  incident.last_seen = new Date().toISOString();

  if (status && timelines[incident.incident_id]) {
    timelines[incident.incident_id].push({
      timestamp: incident.last_seen,
      event: `Status changed to ${status}`,
      details: owner ? `Owner set to ${owner}` : 'Lifecycle update',
    });
  }

  res.json(incident);
});

// ---------------------------------------------------------------------------
// GET /incidents/:incident_id/timeline
// ---------------------------------------------------------------------------
app.get('/incidents/:incident_id/timeline', (req, res) => {
  const id = req.params.incident_id;
  if (!findIncident(id)) return res.status(404).json({ error: 'Incident not found' });
  res.json(timelines[id] ?? []);
});

// ---------------------------------------------------------------------------
// GET /incidents/:incident_id/related
// ---------------------------------------------------------------------------
app.get('/incidents/:incident_id/related', (req, res) => {
  const id = req.params.incident_id;
  if (!findIncident(id)) return res.status(404).json({ error: 'Incident not found' });
  res.json(relatedIncidents[id] ?? []);
});

// ---------------------------------------------------------------------------
// GET /incidents/:incident_id/recommendations
// ---------------------------------------------------------------------------
app.get('/incidents/:incident_id/recommendations', (req, res) => {
  const id = req.params.incident_id;
  if (!findIncident(id)) return res.status(404).json({ error: 'Incident not found' });
  res.json(recommendations[id] ?? []);
});

app.listen(PORT, () => {
  console.log(`Scorpius Incident Service mock API listening on http://localhost:${PORT}`);
});
