# Incident & Platform API — Backend Gaps (Action Request)

**Date:** 2026-07-29  
**Audience:** Backend / platform team + TDK stakeholders  
**Frontend status:** Switching to **live APIs only** (mocks kept inactive behind `VITE_USE_MOCK_INCIDENTS=1`)

This document lists what the Scorpius portal needs from the backend to meet operator trust requirements (Khai review + manager priorities). Raw curl audit: [`LIVE_INCIDENT_API_VERIFICATION.md`](./LIVE_INCIDENT_API_VERIFICATION.md).

---

## Active API URLs (in use now)

The portal calls upstream services through browser proxies:

| Data domain | Browser path | Upstream (default) | Used for |
|-------------|--------------|-------------------|----------|
| **NetApp ingestion** | `/api-proxy/*` | `http://10.0.65.40:8080` | Overview, Events, Nodes, Capacity, EMS |
| **Incidents / platform** | `/incident-api/*` | `http://10.0.65.19:8088/incident-api` | Incidents list/detail, knowledge, learning, evaluation |

**Docker:** `http://localhost:8088` → nginx proxies both paths (see `docker-compose.yml`, `nginx.conf.template`).

**Local dev:** `npm run dev` → Vite proxies to the same upstreams (`vite.config.ts`).

### Deferred — direct incident service (`:8003`)

We verified `http://10.0.65.19:8003` separately (see verification doc). **We are not switching the portal default to `:8003` yet** — waiting on developer review of schema gaps and gateway alignment. When ready:

```bash
INCIDENT_API_TARGET=http://10.0.65.19:8003
```

---

## What changed on the frontend

1. **Live-only by default** — demo `INC-*` incidents and mock AI reasoning/planning are disabled unless `VITE_USE_MOCK_INCIDENTS=1`.
2. **Dashboard drill-down** — Errors+Alerts, EMS severity filters, incident KPI tiles, degraded cluster context (from ingestion API).
3. **Response adapters** (frontend) — timeline, assets, and recommendations field mapping until backend aligns schemas.
4. **AI tabs** — Reasoning / Planning / Execution show an honest empty state for live UUID incidents until dedicated APIs exist.

---

## Priority order (manager / Khai)

| Priority | Theme | Owner |
|----------|-------|-------|
| 1 | Stop unsupported AI claims; evidence-based confidence | Backend + AI pipeline |
| 2 | Fix incident scope, affected assets, titles | Backend correlation |
| 3 | Traceable evidence (source, time, observed vs inferred) | Backend + ingestion |
| 4 | Correct SecD + cluster-peer logic and remediation plans | Backend + AI |
| 5 | ONTAP-specific knowledge retrieval | Backend / RAG |
| 6 | Dashboard drill-down + EMS noise | Frontend (mostly done) |

---

## Endpoint gaps

### Working — no change required

| Endpoint | Sample | UI |
|----------|--------|-----|
| `GET /health` | `{"status":"healthy"}` | — |
| `GET /incidents/stats` | `total`, `critical`, `new`, etc. | Incidents KPI tiles |
| `GET /incidents` | Array of incident rows | Incidents list |
| `GET /incidents/{id}` | Full detail header | Incident detail |

### Schema mismatches — please align OR confirm frontend adapters

#### Issue A — List missing `correlation_key`

Live list row (from `:8003` capture):

```json
{
  "incident_id": "790d69c5-0fbf-41ef-baac-c348d867ae86",
  "title": "Anomaly detected",
  "severity": "CRITICAL",
  "status": "New",
  "entity": "epic2-live-entity-20260728084006460159",
  "alert_count": 1
}
```

**Ask:** Add `correlation_key` to list rows (present on detail today).

#### Issue B — Assets field names

API returns:

```json
{
  "asset_id": "0d27a6ac-e473-4fb7-8b06-db191ee4d3b6",
  "entity": "validation-volume-01",
  "hostname": "validation-volume-01",
  "asset_type": "NetAppVolume"
}
```

Portal display expects `name` + `type`. **Frontend adapter maps `entity` → name, `asset_type` → type.** Prefer consistent naming in API long-term.

#### Issue C — Timeline field names

API returns:

```json
{
  "event_type": "incident_created",
  "message": "Incident created from alert",
  "created_at": "2026-07-28T04:05:13.611585+00:00",
  "metadata": { "alert_id": "epic-validation-001" }
}
```

Portal expects `timestamp`, `event`, `details`. **Frontend adapter maps fields.** Prefer stable contract documented in OpenAPI.

#### Issue D — Recommendations field names

API returns:

```json
{
  "recommendation_id": "982d8851-c7b3-4e4b-b942-5fe42445c829",
  "recommendation": "Scale up CPU",
  "confidence": 0.87,
  "risk_level": "High"
}
```

Portal expects `title`, `risk`. **Frontend adapter maps `recommendation` → title, `risk_level` → risk.**

---

### Populated but not shown in UI yet

| Endpoint | Notes | Ask |
|----------|-------|-----|
| `GET /signals` | 5 signals in capture | Expose on incident detail or list; document schema |
| `GET /incidents/{id}/metrics` | Populated for CPU alerts, `[]` for capacity | Confirm when empty vs populated; stable schema |
| `GET /incidents/{id}/risks` | Same pattern as metrics | Same |

Sample signal:

```json
{
  "signal_id": "52cec6de-aeab-4609-8d7b-3be356249943",
  "incident_id": "790d69c5-0fbf-41ef-baac-c348d867ae86",
  "event_code": "unknown_event",
  "severity": "CRITICAL",
  "confidence": 0.87,
  "title": "Anomaly detected",
  "raw_data": {
    "metric_name": "cpu.utilization",
    "metric_value": 91.7,
    "recommendation": "Scale up CPU"
  }
}
```

---

### Missing or broken

| Endpoint | Status | Impact |
|----------|--------|--------|
| `GET /incidents/{id}/related` | **404** | Related incidents panel empty |
| AI reasoning / evidence API | **Not implemented** | Reasoning tab placeholder only |
| Remediation planning API | **Not implemented** | Planning tab placeholder only |
| Execution / run tracking API | **Not implemented** | Execution placeholder only |

---

## Khai acceptance blockers (backend-owned)

These cannot be fixed by frontend copy alone:

### 1. Incident scope and affected assets

- **SecD:** Scope should be cluster admin vserver (multi-node), not a single node title; LDAP/TLS cert mismatch — not data SVM outage.
- **Cluster peer:** Stale intercluster LIF address; degraded SnapMirror — not necessarily full replication failure.
- **Ask:** Correlation must distinguish reporting node vs affected vserver vs true asset scope. Return structured fields: `reporting_nodes[]`, `affected_vserver`, `scope` (`cluster` | `node` | `vserver`).

### 2. Evidence provenance

Every evidence item shown to operators should include:

- `source_system`, `source_type`, `collected_at`, `record_id`
- `observation_type`: `observed` | `inferred` | `simulated`
- `relevance_score` with calculation basis

Do not return narrative-only evidence without backing records.

### 3. AI confidence calibration

Confidence must drop when:

- Required telemetry is missing
- Causal claims are inferred
- Sources conflict
- Asset scope is uncertain
- Knowledge match is weak / generic Linux advice

Return `confidence` + `confidence_basis` (array of strings explaining score).

### 4. Knowledge / RAG quality

- Prioritize ONTAP-specific docs and approved TDK runbooks
- Filter by platform, object type, ONTAP version, incident type
- Return: `document_title`, `source`, `version`, `section`, `similarity_score`, `platform_match`

### 5. Remediation plan structure

Plans should separate:

- `verification` steps
- `corrective_configuration` steps
- `optional_validation` steps
- `exceptional_recovery` steps (e.g. SnapMirror resync only when validation fails)

---

## Questions for the team (please reply in writing)

1. Should every AI statement and evidence item trace to a live TDK data source, with simulated/inferred labeled?
2. For SecD-style incidents, is cluster admin vserver the preferred scope with nodes as reporters only?
3. Which EMS event families should create incidents vs remain EMS-only?
4. Should repeated EMS events across nodes consolidate into one cluster incident when signature + vserver match?
5. What is the acceptable basis for AI confidence scores?
6. Which TDK / NetApp docs are authoritative for knowledge retrieval?
7. For cluster-peer mismatch, is the normal plan verify → update peer address → validate, with resync only if needed?
8. Which items are **acceptance blockers** vs post-delivery UI enhancements?

---

## Gateway vs `:8003` direct

| Route | Notes |
|-------|-------|
| `http://10.0.65.19:8088/incident-api` | **Current portal default** — platform gateway |
| `http://10.0.65.19:8003` | Direct incident service — verified populated; pending developer alignment |

**Ask:** Confirm whether gateway and `:8003` return identical schemas for `/incidents`, `/timeline`, `/assets`, `/recommendations`. If not, document which is canonical.

---

## Frontend files (for reference)

- Ingestion client: `src/api/client.ts` → `/api-proxy`
- Incident client: `src/api/incident-service/client.ts` → `/incident-api`
- Unified list: `src/api/incidents/unified.ts`
- Detail UI: `src/pages/IncidentOverviewApi.tsx`
- Overview / Events: `src/pages/Overview.tsx`, `src/pages/Events.tsx`

---

## Suggested email snippet

> We have switched the Scorpius portal to live APIs only (ingestion at `10.0.65.40:8080`, platform at `10.0.65.19:8088/incident-api`). Demo incidents are disabled. Please review **`docs/INCIDENT_API_BACKEND_GAPS.md`** for schema mismatches, missing endpoints, and Khai acceptance items we need from the backend. Direct service at `:8003` is documented for later once gateway alignment is confirmed.
