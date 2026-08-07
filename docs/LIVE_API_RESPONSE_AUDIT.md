# Live API Response Audit

**Captured:** 2026-08-07 (VPN)  
**Branch:** `feature/tdk-ui-filters-drilldown`  
**Method:** GET only (write endpoints listed in appendix, not executed)

## Bases used by the application

| Browser path | Upstream curled | Config source |
|--------------|-----------------|---------------|
| `/api-proxy/*` | `http://10.0.65.40:8080` | `vite.config.ts` / `API_TARGET` |
| `/incident-api/*` | `http://10.0.65.19:8088/incident-api` | `vite.config.ts` / `INCIDENT_API_TARGET` default |

Also verified direct incident service: `http://10.0.65.19:8003/health` → `{"status":"healthy"}` (used on TDK host when `.env` overrides to avoid self-proxy).

**Exclusions:** mock-gated AI workflow modules (`src/api/scorpius/incidents|aiReasoning|planning|execution.ts`) when `VITE_USE_MOCK_INCIDENTS` is off.

Large payloads are truncated below (first record + count). Full captures were taken at audit time under `/tmp/destats-api-audit/`.

---

## Executive summary

| Status | Count | Notes |
|--------|------:|-------|
| HTTP 200 | 30 | All catalogued GETs succeeded except related |
| HTTP 404 | 1 | `GET /incidents/{id}/related` |
| Populated but **no UI** | 1 | `GET /signals` |
| Nested detail arrays ignored by UI | yes | Detail body has `assets/signals/metrics/risks/recommendations/timeline`; UI fetches sub-routes instead |
| Schema adapted in UI | yes | Timeline / assets / recommendations field renames via adapters |
| Cluster metrics values missing | yes | Only `timestamp` (+ `_links`); UI shows cadence sparkline |

---

## A. NetApp ingestion (`http://10.0.65.40:8080`)

### A1. `GET /health`

- **Client:** [`src/api/health.ts`](../src/api/health.ts)
- **UI:** System Status probe
- **Curl:** `curl -s http://10.0.65.40:8080/health`
- **Status:** 200

```json
{
  "ok": true,
  "service": "scorpius-netapp-ingestion-api",
  "time": "2026-08-07T14:03:46.156927+00:00"
}
```

| Shown | Not shown |
|-------|-----------|
| Mapped to healthy/down on System Status | `time` only used as last_check when present |

---

### A2. `GET /api/netapp/summary`

- **Client:** [`src/api/summary.ts`](../src/api/summary.ts)
- **UI:** Overview → Ingestion Health; System Status per-source cards
- **Status:** 200

```json
{
  "ok": true,
  "fetched_at": "2026-08-07T14:04:07.034524+00:00",
  "sources": {
    "ems": { "ok": true, "status_code": 200, "count": 8192, "source": "/support/ems/events?fields=*" },
    "volumes": { "ok": true, "status_code": 200, "count": 766, "source": "/storage/volumes?fields=*" },
    "aggregates": { "ok": true, "status_code": 200, "count": 6, "source": "/storage/aggregates?fields=*" },
    "nodes": { "ok": true, "status_code": 200, "count": 4, "source": "/cluster/nodes?fields=*" },
    "interfaces": { "ok": true, "status_code": 200, "count": 44, "source": "/network/ip/interfaces?fields=*" },
    "cluster_metrics": { "ok": true, "status_code": 200, "count": 240, "source": "/cluster/metrics" }
  }
}
```

| Shown | Not shown |
|-------|-----------|
| Source name, `ok`, `count`, `fetched_at` | `sources.*.source` ONTAP path string; `status_code` except as failure hint on System Status |

---

### A3. `GET /api/netapp/nodes/summary`

- **Client:** [`src/api/nodes.ts`](../src/api/nodes.ts)
- **UI:** Overview KPIs; TopBar health derivation
- **Status:** 200

```json
{
  "ok": true,
  "status_code": 200,
  "observer": "node_observer",
  "source_type": "netapp_nodes_summary",
  "fetched_at": "2026-08-07T14:04:37.759364+00:00",
  "nodes_examined": 4,
  "state_counts": { "up": 4 }
}
```

| Shown | Not shown |
|-------|-----------|
| `state_counts` (up vs total) | `observer`, `source_type`, `status_code`, `nodes_examined` (except indirectly) |

---

### A4. `GET /api/netapp/nodes`

- **Client:** [`src/api/nodes.ts`](../src/api/nodes.ts)
- **UI:** Nodes page; TopBar/Sidebar cluster identity (`name` → strip `-NN`)
- **Status:** 200 — **4** records

**Sample (first node, truncated):** `uspdc-nac01-02`, model `FAS500f`, ONTAP `9.14.1P12`, `state: up`, rich `controller` / `ha` / `management_interfaces` / …

| Shown | Not shown |
|-------|-----------|
| `name`, `model`, `serial_number`, `version.full`, `uptime`, `state`, `controller` fans/PSU/temp/memory/CPU, `ha.partners`, interconnect/takeover, `nvram.battery_state`, SP fields used by Nodes cards; `location` if non-empty | `owner`, `date`, `membership`, `management_interfaces` / `cluster_interfaces` IPs, `storage_configuration`, `system_aggregate`, most `_links`, board name, etc. |

---

### A5. `GET /api/netapp/aggregates/summary`

- **Client:** [`src/api/aggregates.ts`](../src/api/aggregates.ts)
- **UI:** Overview Aggregate Fill + capacity KPIs; Capacity charts
- **Status:** 200 — 6 aggregates in summary list

| Shown | Not shown |
|-------|-----------|
| Per-agg `name`, `used_percent`, `full_threshold_percent`, size/used/available TiB; cluster `capacity.*`; `state_counts` | `observer`, `source_type`, `aggregates_with_space_data`, byte fields when TiB shown |

---

### A6. `GET /api/netapp/aggregates`

- **Client:** [`src/api/aggregates.ts`](../src/api/aggregates.ts)
- **UI:** Aggregates page cards
- **Status:** 200 — **6** records

| Shown | Not shown |
|-------|-----------|
| `name`, `state`, `node.name`, `volume_count`, block_storage size/used/%, efficiency ratios, disk type/count, `create_time` | Many nested efficiency flags, cloud_storage, snapshot file counters, home_node duplicate, `_links` |

---

### A7. `GET /api/netapp/volumes/summary`

- **Client:** [`src/api/volumes.ts`](../src/api/volumes.ts)
- **UI:** Overview capacity KPI; Capacity SVM charts
- **Status:** 200 — 766 volumes examined

| Shown | Not shown |
|-------|-----------|
| `capacity.used_percent` / TiB totals; `state_counts`; `svm_counts` for charts; `volumes_examined` | `observer`, `source_type`, byte fields when TiB shown |

---

### A8. `GET /api/netapp/volumes`

- **Client:** [`src/api/volumes.ts`](../src/api/volumes.ts)
- **UI:** Capacity top volumes table (paginated; first page 100)
- **Status:** 200 — **100** records this page (`max_records=100`)

| Shown | Not shown |
|-------|-----------|
| `name`, `svm.name`, aggregates, `space.size/used`, `type`, `snapmirror.is_protected` | `create_time`, snapshot policy, NAS export, analytics, style, most nested ONTAP fields, `_links` |

---

### A9. `GET /api/netapp/interfaces/summary`

- **Client:** [`src/api/interfaces.ts`](../src/api/interfaces.ts)
- **UI:** Overview Interfaces Up KPI
- **Status:** 200

```json
{
  "interfaces_examined": 44,
  "state_counts": { "up": 44 },
  "enabled_counts": { "True": 44 }
}
```

| Shown | Not shown |
|-------|-----------|
| `state_counts` | `enabled_counts`, `observer`, `source_type` |

---

### A10. `GET /api/netapp/interfaces`

- **Client:** [`src/api/interfaces.ts`](../src/api/interfaces.ts)
- **UI:** Network page table
- **Status:** 200 — **44** records

| Shown | Not shown |
|-------|-----------|
| name, IP, state, enabled, scope, SVM, home node/port, service chips | Many `_links`, UUID-only metadata not displayed in columns |

---

### A11. `GET /api/netapp/ems/summary`

- **Client:** [`src/api/ems.ts`](../src/api/ems.ts)
- **UI:** Overview Errors+Alerts + EMS donut; Events severity KPIs; TopBar Degraded
- **Status:** 200

```json
{
  "events_examined": 1000,
  "severity_counts": {
    "informational": 607,
    "notice": 203,
    "debug": 135,
    "warning": 0,
    "error": 55,
    "alert": 0,
    "emergency": 0,
    "other": 0
  }
}
```

| Shown | Not shown |
|-------|-----------|
| All severity counts used for charts/KPIs; `events_examined` in subtitles | `observer`, `source_type` |

---

### A12. `GET /api/netapp/ems`

- **Client:** [`src/api/ems.ts`](../src/api/ems.ts)
- **UI:** Events page when mode=`all`
- **Status:** 200 — **100** records (first page)

| Shown | Not shown |
|-------|-----------|
| `time`, `message.severity`, `message.name`, `node.name`, `source`, `log_message`, `parameters` in expand | `_links`, `node.uuid` |

---

### A13. `GET /api/netapp/ems/errors?limit=1000`

- **Client:** [`src/api/ems.ts`](../src/api/ems.ts)
- **UI:** Events default errors feed; Overview recent errors
- **Status:** 200 — **55** records (`returned_records: 55`)

| Shown | Not shown |
|-------|-----------|
| Same event fields as EMS table | Envelope `observer` / `source_type`; unused severities filtered client-side |

---

### A14. `GET /api/netapp/cluster-metrics`

- **Client:** [`src/api/clusterMetrics.ts`](../src/api/clusterMetrics.ts)
- **UI:** Overview → Cluster Activity
- **Status:** 200 — **240** records

**Sample record:**

```json
{
  "timestamp": "2026-08-07T14:05:00Z",
  "_links": { "self": { "href": "/api/cluster/metrics/2026-08-07T14%3A05%3A00Z" } }
}
```

| Shown | Not shown |
|-------|-----------|
| `timestamp` cadence sparkline when IOPS/throughput/latency absent | `_links`; numeric metric groups **not present** in live payload |

---

## B. Platform / incidents (`http://10.0.65.19:8088/incident-api`)

Incident sub-resources used sample id  
`790d69c5-0fbf-41ef-baac-c348d867ae86` (“Anomaly detected”).

### B1. `GET /health`

- **Client:** [`src/api/incident-service/incidents.ts`](../src/api/incident-service/incidents.ts)
- **UI:** System Status
- **Status:** 200 → `{"status":"healthy"}`

---

### B2. `GET /incidents/stats`

- **Status:** 200

```json
{
  "total": 4,
  "new": 4,
  "open": 0,
  "investigating": 0,
  "resolved": 0,
  "closed": 0,
  "critical": 3,
  "high": 0,
  "medium": 1,
  "low": 0
}
```

| Shown | Not shown |
|-------|-----------|
| Active (= new+open+investigating), critical, high, resolved+closed via KPIs | Individual `medium`/`low`/`open` as separate tiles |

---

### B3. `GET /incidents`

- **Status:** 200 — **4** rows

**List keys:** `incident_id`, `title`, `description`, `entity`, `severity`, `priority`, `status`, `source`, `first_seen`, `last_seen`, `updated_at`, `alert_count`, `age_minutes`, `correlation_key`

| Shown | Not shown |
|-------|-----------|
| id (truncated), title, description, severity, status, entity as context, alert_count, sort by first_seen | `priority`, `source`, `last_seen`, `updated_at`, `age_minutes`, `correlation_key` on list row |

---

### B4. `GET /incidents/{id}`

- **Status:** 200  
- **UI:** Incident header + Overview entity block

Detail includes nested `assets`, `signals`, `metrics`, `risks`, `recommendations`, `timeline` (each length 1 for this CPU incident).

| Shown | Not shown |
|-------|-----------|
| title, description, severity, status, priority, first_seen, source, owner, entity, asset_type, related_alert_ids, correlation_key | Nested arrays on detail body (**UI ignores**; uses sub-endpoints); `age_minutes`, `closed_at`, `closure_reason`, `created_at`/`updated_at` partially unused; `raw_alerts` not rendered as structured alerts |

---

### B5. `GET /incidents/{id}/timeline`

- **Status:** 200 — 1 event  
- **API fields:** `created_at`, `event_type`, `message`, `event_id`, `incident_id`, `metadata`  
- **UI adapter maps →** `timestamp`, `event`, `details`

| Shown | Not shown |
|-------|-----------|
| Adapted timestamp / event / details (message + metadata alert/entity) | Raw `event_id`; full metadata object |

---

### B6. `GET /incidents/{id}/assets`

- **Status:** 200 — 1 asset  
- **API:** `entity`, `hostname`, `asset_type`, `asset_id`, `status`, `cluster_name`, `node_name`, `metadata`, …  
- **Adapter →** `name`, `type`

| Shown | Not shown |
|-------|-----------|
| Display name + type | `cluster_name`/`node_name` (null here), `status`, `metadata`, timestamps |

---

### B7. `GET /incidents/{id}/recommendations`

- **Status:** 200 — 1 row (“Scale up CPU”)  
- **API:** `recommendation`, `risk_level`, `confidence`, `risk_score`, …  
- **Adapter →** `title`, `risk`, `confidence`

| Shown | Not shown |
|-------|-----------|
| title/recommendation text, confidence, risk (after learning apply on Overview) | `dedup_key`, `signal_id`, `asset_id`, `alert_id`, `recommendation_key`, `risk_score`, `reasoning` (null), `source_references`, `confidence_basis` (null), raw_data |

---

### B8. `GET /incidents/{id}/related`

- **Status:** **404** → `{"detail":"Not Found"}`  
- **UI:** “Related incidents are currently unavailable.”

---

### B9. `GET /signals`

- **Status:** 200 — **5** signals  
- **UI:** **None** (client `fetchIncidentSignals` unused)

Sample includes `signal_id`, `incident_id`, `severity`, `confidence`, `title`, `raw_data.metric_name/value`, etc.

| Shown | Not shown |
|-------|-----------|
| — | Entire payload |

---

### B10. `GET /knowledge`

- **Client:** [`src/api/incident-service/knowledge.ts`](../src/api/incident-service/knowledge.ts)
- **UI:** Knowledge page
- **Status:** 200 — **20** items (smoke-test docs)

| Shown | Not shown |
|-------|-----------|
| title, content, tags, embedding_status (via document mapping), ids | `chunk_index`/`chunk_count`, `parent_document_id`, `source_reference` object detail, `related_usecase_ids` |

---

### B11. `GET /knowledge/search?q=capacity`

- **Status:** 200 — `returned_records: 20`  
- **UI:** Knowledge search results

Same record shape as list; envelope `ok` / `returned_records` not prominently shown.

---

### B12. `GET /usecases`

- **Status:** 200 — **23** use cases  
- **UI:** Use Cases page

| Shown | Not shown |
|-------|-----------|
| title, status, category, environment, confidence, problem/resolution excerpts, tags | `approved_at`/`approved_by`, historical_incidents arrays depth, supporting_evidence full blobs depending on card |

---

### B13. `GET /learning`

- **Status:** 200 — envelope `{ ok, records[16], returned_records }`  
- **UI:** Learning list

| Shown | Not shown |
|-------|-----------|
| `learning_id`, recommendation, outcome_status, incident_id, confidence_after | `action_taken`, `result`, `user_feedback`, `created_by`, numeric `id` |

---

### B14. `GET /learning/stats`

- **Status:** 200 — `{ ok, stats: [...] }`  
- **UI:** Learning KPI / stats panels

| Shown | Not shown |
|-------|-----------|
| recommendation, attempts, success/failure rates, confidence_score | Some timestamp fields depending on card |

---

### B15. `GET /learning/rankings`

- **Status:** 200 — 4 rankings  
- **UI:** Learning rankings section

Same shape as stats rows; fully used for ranking display.

---

### B16. `GET /evaluation`

- **Status:** 200 — summary-only

```json
{
  "ok": true,
  "summary": {
    "total_evaluations": 19,
    "completed_evaluations": 19,
    "failed_evaluations": 0,
    "average_overall_score": 0.776,
    "average_recommendation_quality": 0.817,
    "average_retrieval_quality": 0.779,
    "average_resolution_success": 0.842,
    "average_response_time_ms": 432.1,
    "average_confidence_accuracy": 0.691,
    "average_precision": 0.779,
    "average_recall": 0.779,
    "average_f1_score": 0.779,
    "metric_count": 190
  }
}
```

| Shown | Not shown |
|-------|-----------|
| Client falls through to history for list rows; summary may feed KPI strip if wired | Individual average_* fields not all rendered |

---

### B17. `GET /evaluation/history`

- **Status:** 200 — **19** records  
- **UI:** Evaluation history list

| Shown | Not shown |
|-------|-----------|
| evaluation_id, overall_score, status, learning_id, incident_id, type | Some timing fields; internal numeric `id` |

---

## Cross-cutting gaps

1. **`/related` still 404** — UI handles gracefully.  
2. **`/signals` populated, no UI.**  
3. **Detail nested `metrics` / `risks`** present on `GET /incidents/{id}` but no dedicated clients/sections (unlike assets/timeline/recs sub-routes).  
4. **Recommendation / asset / timeline** live field names differ from original frontend types — adapters in [`src/lib/incident-api-adapters.ts`](../src/lib/incident-api-adapters.ts) bridge this.  
5. **Cluster metrics** lack IOPS/throughput/latency values.  
6. **Knowledge corpus** is still largely smoke-test content (low operational value — aligns with Khai feedback).  
7. **TDK host note:** curling `http://10.0.65.19:8088/incident-api` works when the portal Nginx proxies to a real upstream (e.g. `:8003`). If `INCIDENT_API_TARGET` points at itself, Incidents UI shows “temporarily unavailable.”

---

## Appendix — integrated non-GET endpoints (not curled)

Used by UI for actions / retrieve; skipped per GET-mostly audit:

| Method | Path | Usage |
|--------|------|--------|
| POST | `/knowledge/retrieve` | Incident Overview knowledge context |
| POST | `/knowledge/similar`, `/knowledge/ingest`, `/knowledge/{id}/reprocess` | Knowledge tooling |
| POST | `/learning`, `/learning/apply`, `/learning/{id}/feedback` | Incident + Learning pages |
| POST | `/evaluation/run` | Evaluation / incident panels |
| POST | `/incidents` | Create from alert (client exists) |
| PATCH | `/incidents/{id}` | Status/owner patch (client exists) |
| POST/PATCH | `/usecases…` | Create / submit / approve |

Mock-only (not live): scorpius AI Reasoning, Planning, Execution, demo `INC-*` list.

---

## Reproduce

```bash
# Ingestion
curl -s http://10.0.65.40:8080/health
curl -s http://10.0.65.40:8080/api/netapp/summary
# … paths listed above

# Platform (app default base)
curl -s http://10.0.65.19:8088/incident-api/health
curl -s http://10.0.65.19:8088/incident-api/incidents/stats
ID=$(curl -s http://10.0.65.19:8088/incident-api/incidents | python3 -c 'import sys,json; print(json.load(sys.stdin)[0]["incident_id"])')
curl -s "http://10.0.65.19:8088/incident-api/incidents/$ID/timeline"
```

VPN required.
