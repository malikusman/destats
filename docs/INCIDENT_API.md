# Scorpius Incident Service API

Working API reference for the Incident Service endpoints integrated into the destats dashboard. Calls are made through Nginx at `/incident-api` and can target either the TDK gateway or local mock-api.

> **Not covered here:** Demo incidents with `INC-*` IDs are client-side mocks (`src/mocks`) — they are not HTTP APIs. This document covers only the REST Incident Service.

## Architecture

```
Browser / curl  →  Nginx :8088 /incident-api/*  →  mock-api container :3090
```

| Environment | Base URL |
|---|---|
| Deployed (TDK server) | `http://10.0.65.19:8088/incident-api` |
| Local mock-api | `http://localhost:3090` |
| Frontend client default | `/incident-api` (see `src/api/incident-service/client.ts`) |

**Implementation:** [`mock-api/server.mjs`](../mock-api/server.mjs)  
**TypeScript types:** [`src/types/incident-service.ts`](../src/types/incident-service.ts)  
**Client wrappers:** [`src/api/incident-service/incidents.ts`](../src/api/incident-service/incidents.ts)

When a real Incident Service backend is available, set `INCIDENT_API_TARGET` in Docker Compose. The same paths and JSON shapes are expected to work unchanged.

## Authentication

None. All endpoints are open (mock/dev environment).

## Common headers

| Header | When |
|---|---|
| `Accept: application/json` | All requests |
| `Content-Type: application/json` | POST and PATCH bodies |

## Error responses

| HTTP | Body | When |
|---|---|---|
| `404` | `{"error":"Incident not found"}` | Unknown `incident_id` on any `/:id` route |

---

## Endpoint summary

| Method | Path | HTTP | UI integrated | Client function |
|---|---|---|---|---|
| GET | `/health` | 200 | No | `fetchIncidentHealth` |
| GET | `/incidents/stats` | 200 | Yes — KPI tiles | `fetchIncidentStats` |
| GET | `/incidents` | 200 | Yes — incidents list (Live rows) | `fetchIncidentList` |
| GET | `/signals` | 200 | Yes — incidents source status panel | `fetchIncidentSignals` |
| GET | `/incidents/{id}` | 200 / 404 | Yes — UUID detail header + overview | `fetchIncidentById` |
| GET | `/incidents/{id}/timeline` | 200 / 404 | Yes — Overview timeline | `fetchIncidentTimeline` |
| GET | `/incidents/{id}/related` | 200 / 404 | Yes — Overview related section | `fetchRelatedIncidents` |
| GET | `/incidents/{id}/recommendations` | 200 / 404 | Yes — Overview recommendations | `fetchIncidentRecommendations` |
| GET | `/incidents/{id}/assets` | 200 / 404 | Yes — Overview linked assets section | `fetchIncidentAssets` |
| POST | `/incidents` | 201 / 200 | **No UI** | `createIncidentFromAlert` |
| PATCH | `/incidents/{id}` | 200 / 404 | **No UI** | `patchIncident` |

**Verified:** 2026-07-27 against `http://10.0.65.19:8088/incident-api`

Current gateway behavior during latest verification:
- `GET /incidents` returns `[]` and `GET /incidents/stats` returns all-zero counts.
- `GET /signals` and `GET /incidents/{id}/assets` return `200` with empty arrays when no data exists.
- This is treated as healthy-but-empty data in the UI (not an API failure).

---

## GET /health

Liveness check for the Incident Service.

### curl

```bash
curl -s http://10.0.65.19:8088/incident-api/health
```

### Response `200`

```json
{
  "status": "healthy"
}
```

### UI integration

Not used in the dashboard today. Available via `fetchIncidentHealth()`.

---

## GET /incidents/stats

Aggregate counts across **all** incidents (including resolved/closed). Used for KPI tiles on the Incidents page.

### curl

```bash
curl -s http://10.0.65.19:8088/incident-api/incidents/stats
```

### Response `200`

```json
{
  "total": 8,
  "new": 2,
  "investigating": 3,
  "resolved": 3,
  "closed": 0,
  "critical": 1,
  "high": 7,
  "medium": 0,
  "low": 0
}
```

### Response schema

| Field | Type | Description |
|---|---|---|
| `total` | number | All incidents in store |
| `new` | number | Status = New |
| `investigating` | number | Status = Investigating |
| `resolved` | number | Status = Resolved |
| `closed` | number | Status = Closed |
| `critical` | number | Severity = CRITICAL |
| `high` | number | Severity = HIGH or High |
| `medium` | number | Severity = MEDIUM or Medium |
| `low` | number | Severity = LOW or Low |

### UI integration

Merged into KPI tiles via `useUnifiedIncidents` → `fetchIncidentStats`.

---

## GET /incidents

Returns **active** incidents only (excludes Resolved and Closed). Each item is a list-row shape.

### curl

```bash
curl -s http://10.0.65.19:8088/incident-api/incidents
```

### Response `200` (sample — first item)

```json
[
  {
    "incident_id": "e94c2c19-7bc5-4448-ae0b-5b94fb4ff6b9",
    "title": "High latency detected",
    "description": "Latency exceeded threshold",
    "entity": "node-01",
    "severity": "WARNING",
    "priority": "High",
    "status": "Investigating",
    "first_seen": "2026-07-02T00:00:00Z",
    "last_seen": "2026-07-08T17:04:29.373Z",
    "alert_count": 1,
    "correlation_key": "node-01:latency.high:storage_filesystem"
  }
]
```

### Response schema (`IncidentListItem`)

| Field | Type | Description |
|---|---|---|
| `incident_id` | string | UUID |
| `title` | string | Short title |
| `description` | string | Longer description |
| `entity` | string | Affected entity (node, aggregate, etc.) |
| `severity` | string | e.g. `WARNING`, `CRITICAL` |
| `priority` | string | e.g. `Medium`, `High` |
| `status` | string | e.g. `New`, `Investigating` |
| `first_seen` | string | ISO 8601 timestamp |
| `last_seen` | string | ISO 8601 timestamp |
| `alert_count` | number | Number of correlated alerts |
| `correlation_key` | string | Deduplication key |

### UI integration

Merged with demo `INC-*` incidents via `useUnifiedIncidents`. API rows show a **Live** badge.

---

## GET /incidents/{id}

Full incident detail for a single incident.

### curl

```bash
ID=e94c2c19-7bc5-4448-ae0b-5b94fb4ff6b9
curl -s "http://10.0.65.19:8088/incident-api/incidents/$ID"
```

### Response `200`

```json
{
  "incident_id": "e94c2c19-7bc5-4448-ae0b-5b94fb4ff6b9",
  "title": "High latency detected",
  "description": "Latency exceeded threshold",
  "source": "RabbitMQ",
  "entity": "node-01",
  "asset_type": "NetApp",
  "severity": "WARNING",
  "priority": "High",
  "status": "Investigating",
  "owner": "api-test",
  "first_seen": "2026-07-02T00:00:00Z",
  "last_seen": "2026-07-08T17:04:29.373Z",
  "alert_count": 1,
  "related_alert_ids": ["alert-101"],
  "correlation_key": "node-01:latency.high:storage_filesystem",
  "raw_alerts": []
}
```

### Response `404`

```json
{
  "error": "Incident not found"
}
```

### Extra fields vs list item

| Field | Type | Description |
|---|---|---|
| `source` | string | Origin system (e.g. `RabbitMQ`, `EMS`) |
| `asset_type` | string | e.g. `NetApp` |
| `owner` | string? | Assigned owner (optional) |
| `related_alert_ids` | string[] | Alert IDs grouped into this incident |
| `raw_alerts` | object[] | Original alert payloads |

### UI integration

`useIncidentDetail` on UUID incident pages (`IncidentDetail` → `IncidentOverviewApi`).

---

## GET /incidents/{id}/timeline

Chronological lifecycle events for an incident.

### curl

```bash
ID=e94c2c19-7bc5-4448-ae0b-5b94fb4ff6b9
curl -s "http://10.0.65.19:8088/incident-api/incidents/$ID/timeline"
```

### Response `200`

```json
[
  {
    "timestamp": "2026-07-02T00:00:00Z",
    "event": "Incident created",
    "details": "Initial anomaly converted into incident"
  },
  {
    "timestamp": "2026-07-02T00:03:00Z",
    "event": "Alert correlated",
    "details": "Related alert added"
  },
  {
    "timestamp": "2026-07-08T17:04:29.373Z",
    "event": "Status changed to Investigating",
    "details": "Owner set to api-test"
  }
]
```

### Response schema (`TimelineEvent`)

| Field | Type | Description |
|---|---|---|
| `timestamp` | string | ISO 8601 |
| `event` | string | Event label |
| `details` | string | Human-readable detail |

### UI integration

`useIncidentTimeline` → Overview tab timeline section.

---

## GET /incidents/{id}/related

Other incidents related to this one (by correlation / history).

### curl

```bash
ID=e94c2c19-7bc5-4448-ae0b-5b94fb4ff6b9
curl -s "http://10.0.65.19:8088/incident-api/incidents/$ID/related"
```

### Response `200`

```json
[
  {
    "incident_id": "inc-related-001",
    "title": "Storage latency anomaly",
    "severity": "WARNING",
    "status": "Resolved"
  }
]
```

### Response schema (`RelatedIncident`)

| Field | Type |
|---|---|
| `incident_id` | string |
| `title` | string |
| `severity` | string |
| `status` | string |

### UI integration

`useRelatedIncidents` → Overview tab related incidents section.

---

## GET /incidents/{id}/recommendations

Suggested remediation actions for an incident.

### curl

```bash
ID=e94c2c19-7bc5-4448-ae0b-5b94fb4ff6b9
curl -s "http://10.0.65.19:8088/incident-api/incidents/$ID/recommendations"
```

### Response `200`

```json
[
  {
    "recommendation_id": "rec-001",
    "title": "Check storage latency",
    "confidence": 0.86,
    "risk": "Low"
  }
]
```

### Response schema (`Recommendation`)

| Field | Type | Description |
|---|---|---|
| `recommendation_id` | string | Unique ID |
| `title` | string | Action description |
| `confidence` | number | 0–1 score |
| `risk` | string | e.g. `Low`, `Medium`, `High` |

### UI integration

`useIncidentRecommendations` → Overview tab recommendations section.

---

## POST /incidents

Create a new incident from an alert payload, or correlate into an existing incident if the **correlation key** already exists.

### Correlation key

Computed as:

```
{entity}:{event_code}:{intent}
```

- `entity` falls back to `host`, then `"unknown"`
- `event_code` falls back to `"unknown"`
- `intent` falls back to `"general"`

If an incident with the same `correlation_key` exists, the API **updates** it (`alert_count++`, `last_seen` updated) and returns **HTTP 200** instead of creating a duplicate.

### Request body (`AlertPayload`)

| Field | Type | Required | Description |
|---|---|---|---|
| `alert_id` | string | No | Source alert identifier |
| `entity` | string | No | Affected entity (or use `host`) |
| `host` | string | No | Alias for `entity` |
| `severity` | string | No | Default `WARNING` |
| `title` | string | No | Default `Untitled incident` |
| `description` | string | No | Default `""` |
| `event_code` | string | No | Part of correlation key |
| `intent` | string | No | Part of correlation key |
| `timestamp` | string | No | ISO 8601; default now |

### curl — create new (`201`)

```bash
curl -s -X POST http://10.0.65.19:8088/incident-api/incidents \
  -H 'Content-Type: application/json' \
  -d '{
    "alert_id": "alert-api-test-001",
    "entity": "node-test",
    "severity": "WARNING",
    "title": "API test incident",
    "description": "Created by endpoint check",
    "event_code": "test.latency",
    "intent": "testing",
    "timestamp": "2026-07-08T12:00:00Z"
  }'
```

### Response `201` (sample)

```json
{
  "incident_id": "c0a4e864-76bf-4322-9aa2-cb1c22b333a2",
  "title": "API doc test incident",
  "description": "Created for INCIDENT_API.md",
  "source": "RabbitMQ",
  "entity": "node-doc",
  "asset_type": "NetApp",
  "severity": "WARNING",
  "priority": "Medium",
  "status": "New",
  "first_seen": "2026-07-09T18:00:00Z",
  "last_seen": "2026-07-09T18:00:00Z",
  "alert_count": 1,
  "related_alert_ids": ["doc-test-20260709T175908Z"],
  "correlation_key": "node-doc:doc.test.20260709T175908Z:documentation",
  "raw_alerts": [{ "...": "original alert payload" }]
}
```

### Response `200` (correlate — same correlation key)

Same `IncidentDetail` shape as above, with incremented `alert_count` and updated `last_seen`. No new `incident_id`.

### Side effects

- Appends initial timeline event: `"Incident created"`
- Initializes empty related/recommendations arrays for new incidents

### UI integration

**Not wired to UI.** Client function `createIncidentFromAlert()` exists but no create-incident form or button calls it yet.

---

## PATCH /incidents/{id}

Update incident lifecycle fields. Partial updates supported — only include fields you want to change.

### Request body (`IncidentPatch`)

| Field | Type | Description |
|---|---|---|
| `status` | string? | e.g. `New`, `Investigating`, `Resolved` |
| `owner` | string? | Assignee |
| `priority` | string? | e.g. `Medium`, `High` |

### curl

```bash
ID=523fa7be-fe7d-42ea-99f1-82611c064486
curl -s -X PATCH "http://10.0.65.19:8088/incident-api/incidents/$ID" \
  -H 'Content-Type: application/json' \
  -d '{"status":"Investigating","owner":"api-doc","priority":"High"}'
```

### Response `200` (sample)

```json
{
  "incident_id": "523fa7be-fe7d-42ea-99f1-82611c064486",
  "title": "API test incident",
  "status": "Investigating",
  "owner": "api-doc",
  "priority": "High",
  "last_seen": "2026-07-09T17:59:10.225Z"
}
```

(Full `IncidentDetail` object is returned.)

### Response `404`

```json
{
  "error": "Incident not found"
}
```

### Side effects

When `status` is provided, appends a timeline event:

```json
{
  "timestamp": "<last_seen>",
  "event": "Status changed to <status>",
  "details": "Owner set to <owner>" 
}
```

(`details` is `"Lifecycle update"` if no owner is set.)

### UI integration

**Not wired to UI.** Client function `patchIncident()` exists but no edit controls on the incident detail page call it yet.

---

## Field reference (observed values)

| Field | Example values |
|---|---|
| `severity` | `WARNING`, `CRITICAL` |
| `status` | `New`, `Investigating`, `Resolved`, `Closed` |
| `priority` | `Medium`, `High` |
| `source` | `RabbitMQ`, `EMS` |
| `asset_type` | `NetApp` |

Active incidents (`GET /incidents`) exclude `Resolved` and `Closed`. Stats (`GET /incidents/stats`) count all statuses.

---

## Re-run tests

### From laptop (VPN connected)

```bash
BASE=http://10.0.65.19:8088/incident-api

curl -s $BASE/health | python3 -m json.tool
curl -s $BASE/incidents/stats | python3 -m json.tool
curl -s $BASE/incidents | python3 -m json.tool
curl -s $BASE/incidents/e94c2c19-7bc5-4448-ae0b-5b94fb4ff6b9/timeline | python3 -m json.tool
```

### On TDK server (SSH)

```bash
curl -s http://localhost:8088/incident-api/incidents/stats | python3 -m json.tool
```

### Locally (mock-api running)

```bash
npm run mock-api          # terminal 1 — starts server on :3090
npm run test:mock-api     # terminal 2 — runs mock-api/test-endpoints.sh
```

The test script checks all 9 endpoints including POST, PATCH, and 404 cases.

---

## UI consumption map

| Dashboard area | Data source | API endpoints used |
|---|---|---|
| Incidents list — Live rows | Incident Service API | `GET /incidents` |
| Incidents list — KPI tiles | Demo mocks + API (merged) | `GET /incidents/stats` |
| UUID incident detail header | Incident Service API | `GET /incidents/{id}` |
| Overview — timeline | Incident Service API | `GET /incidents/{id}/timeline` |
| Overview — related | Incident Service API | `GET /incidents/{id}/related` |
| Overview — recommendations | Incident Service API | `GET /incidents/{id}/recommendations` |
| `INC-*` incidents | Client mocks (`src/mocks`) | None (not REST) |

---

## Future: real Incident Service

When the production Incident Service is deployed:

1. Set `INCIDENT_API_TARGET` in `docker-compose.yml` to the real backend URL.
2. Re-run the curl commands above against `/incident-api`.
3. Confirm JSON shapes still match the types in `src/types/incident-service.ts`.

No frontend code changes should be needed if the contract is unchanged.
