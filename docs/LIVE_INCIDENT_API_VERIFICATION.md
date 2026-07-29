# Live Incident Service API Verification

**Date:** 2026-07-28  
**Base URL:** `http://10.0.65.19:8003`  
**Also verified via app proxy:** `http://localhost:8088/incident-api`

The Incident Service backend is live. RabbitMQ incidents are flowing in. List and stats are populated. Detail sub-resources work at the API level, but several response shapes do not match what the destats frontend expects today.

---

## Core responses

### `GET /health`

```json
{
  "status": "healthy"
}
```

No issue here.

### `GET /incidents/stats`

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

This is good. The frontend can use this for KPI tiles.

### `GET /incidents` (sample row)

```json
[
  {
    "incident_id": "790d69c5-0fbf-41ef-baac-c348d867ae86",
    "title": "Anomaly detected",
    "description": "",
    "severity": "CRITICAL",
    "priority": "Critical",
    "status": "New",
    "entity": "epic2-live-entity-20260728084006460159",
    "source": "RabbitMQ",
    "first_seen": "2026-07-28T08:40:06Z",
    "last_seen": "2026-07-28T08:40:06Z",
    "updated_at": "2026-07-28T08:40:06.484199+00:00",
    "alert_count": 1,
    "age_minutes": 256
  }
]
```

**Issue 1 — list schema mismatch**

The list response is missing `correlation_key`, but the frontend type expects it.

Frontend expects (`IncidentListItem`):

```json
{
  "incident_id": "...",
  "title": "...",
  "description": "...",
  "entity": "...",
  "severity": "...",
  "priority": "...",
  "status": "...",
  "first_seen": "...",
  "last_seen": "...",
  "alert_count": 1,
  "correlation_key": "..."
}
```

The list view should still render rows, but the schema is not an exact match.

---

## Signals

### `GET /signals` (sample)

```json
[
  {
    "signal_id": "52cec6de-aeab-4609-8d7b-3be356249943",
    "incident_id": "790d69c5-0fbf-41ef-baac-c348d867ae86",
    "asset_id": "1fa05507-56d5-407f-a3c4-6c915b8b7791",
    "alert_id": "epic2-live-20260728084006460159",
    "event_code": "unknown_event",
    "intent": "unknown_intent",
    "severity": "CRITICAL",
    "anomaly_score": null,
    "confidence": 0.87,
    "title": "Anomaly detected",
    "description": "",
    "observed_at": "2026-07-28T08:40:06Z",
    "created_at": "2026-07-28T08:40:06.490731+00:00",
    "raw_data": {
      "alert_id": "epic2-live-20260728084006460159",
      "entity": "epic2-live-entity-20260728084006460159",
      "severity": "CRITICAL",
      "metric_name": "cpu.utilization",
      "metric_value": 91.7,
      "metric_unit": "%",
      "risk": "cpu_overload",
      "risk_level": "High",
      "risk_score": 0.92,
      "recommendation": "Scale up CPU",
      "recommendation_key": "scale_cpu_live_validation",
      "confidence": 0.87,
      "timestamp": "2026-07-28T08:40:06Z"
    }
  }
]
```

**Issue 2 — signals not shown in UI**

This endpoint is populated and useful, but the frontend currently does not render it anywhere (`fetchIncidentSignals` exists; no page uses it).

---

## Detail

### `GET /incidents/2e6531d3-dbe5-409b-93a3-72d5811680a1`

```json
{
  "incident_id": "2e6531d3-dbe5-409b-93a3-72d5811680a1",
  "title": "Validation volume capacity warning",
  "description": "Controlled Epic 2 and Epic 3 validation alert",
  "source": "RabbitMQ",
  "entity": "validation-volume-01",
  "asset_type": "NetApp",
  "severity": "CRITICAL",
  "priority": "Critical",
  "status": "New",
  "owner": null,
  "first_seen": "2026-07-28T04:05:13.601070+00:00",
  "last_seen": "2026-07-28T04:12:17.649895+00:00",
  "closed_at": null,
  "closure_reason": null,
  "age_minutes": 531,
  "alert_count": 2,
  "related_alert_ids": [
    "epic-validation-001",
    "epic-validation-002"
  ],
  "correlation_key": "validation-volume-01:capacity_threshold:capacity_alert",
  "created_at": "2026-07-28T04:05:13.601070+00:00",
  "updated_at": "2026-07-28T04:12:17.649895+00:00",
  "raw_alerts": [],
  "assets": [],
  "signals": [],
  "metrics": [],
  "risks": [],
  "recommendations": [],
  "timeline": []
}
```

Note: nested arrays in the detail body may be empty even when sub-endpoints return data. The frontend fetches sub-resources separately rather than using these nested fields.

**Issue 3 — nested detail fields ignored**

The detail response now includes `assets`, `signals`, `metrics`, `risks`, `recommendations`, and `timeline`, but the frontend ignores them and calls `/incidents/{id}/assets`, `/timeline`, etc.

---

## Assets

### `GET /incidents/2e6531d3-dbe5-409b-93a3-72d5811680a1/assets`

```json
[
  {
    "asset_id": "0d27a6ac-e473-4fb7-8b06-db191ee4d3b6",
    "entity": "validation-volume-01",
    "hostname": "validation-volume-01",
    "asset_type": "NetAppVolume",
    "status": "Active",
    "cluster_name": null,
    "node_name": null,
    "created_at": "2026-07-28T04:05:13.606686+00:00",
    "updated_at": "2026-07-28T04:12:17.655454+00:00",
    "metadata": {
      "environment": "validation",
      "test": true
    }
  }
]
```

**Issue 4 — asset field names**

| Frontend expects | API returns |
|---|---|
| `name` | `entity` / `hostname` |
| `type` | `asset_type` |

The UI may fall back to showing the UUID `asset_id` instead of `validation-volume-01`.

---

## Timeline

### `GET /incidents/2e6531d3-dbe5-409b-93a3-72d5811680a1/timeline`

```json
[
  {
    "event_id": "871a99d2-af59-4444-b832-506071f83ac0",
    "incident_id": "2e6531d3-dbe5-409b-93a3-72d5811680a1",
    "event_type": "incident_created",
    "message": "Incident created from alert",
    "created_at": "2026-07-28T04:05:13.611585+00:00",
    "metadata": {
      "alert_id": "epic-validation-001",
      "correlation_key": "validation-volume-01:capacity_threshold:capacity_alert",
      "entity": "validation-volume-01"
    }
  },
  {
    "event_id": "e2547343-85e0-4d53-ac54-e00a22073c50",
    "incident_id": "2e6531d3-dbe5-409b-93a3-72d5811680a1",
    "event_type": "alert_correlated",
    "message": "Related alert correlated",
    "created_at": "2026-07-28T04:12:17.660883+00:00",
    "metadata": {
      "alert_id": "epic-validation-002",
      "entity": "validation-volume-01"
    }
  }
]
```

**Issue 5 — timeline field names**

| Frontend expects | API returns |
|---|---|
| `timestamp` | `created_at` |
| `event` | `event_type` |
| `details` | `message` |

Timeline will not map correctly without an adapter.

---

## Metrics

### `GET /incidents/790d69c5-0fbf-41ef-baac-c348d867ae86/metrics`

```json
[
  {
    "metric_id": "8e23e067-8e8d-4703-95d9-22577e4f79c1",
    "dedup_key": "02fea8974cfb64b12c6a63e5572b6bcea750c1316b763e04151d7c3eae25eb23",
    "incident_id": "790d69c5-0fbf-41ef-baac-c348d867ae86",
    "signal_id": "52cec6de-aeab-4609-8d7b-3be356249943",
    "asset_id": "1fa05507-56d5-407f-a3c4-6c915b8b7791",
    "alert_id": "epic2-live-20260728084006460159",
    "metric_name": "cpu.utilization",
    "metric_value": 91.7,
    "metric_unit": "%",
    "metric_type": null,
    "anomaly_score": null,
    "confidence": null,
    "severity": null,
    "priority": null,
    "reasoning": null,
    "raw_data": {
      "metric_name": "cpu.utilization",
      "metric_value": 91.7,
      "metric_unit": "%",
      "metric_type": null,
      "alert": "epic2-live-20260728084006460159"
    },
    "created_at": "2026-07-28T08:40:06.484199+00:00",
    "updated_at": "2026-07-28T08:40:06.513747+00:00"
  }
]
```

**Issue 6 — metrics UI missing**

Good data from the API. The frontend has no type, hook, or UI section for metrics yet.

Note: capacity-validation incidents return `[]` for metrics; CPU-style alerts populate this endpoint.

---

## Risks

### `GET /incidents/790d69c5-0fbf-41ef-baac-c348d867ae86/risks`

```json
[
  {
    "risk_id": "ce925c7b-fd1c-40d2-a51b-74696d42a040",
    "dedup_key": "6d31c321e5ed84b5bc2a29f8735a4e9c4e2d97c010cce3f3063c1847101017d6",
    "incident_id": "790d69c5-0fbf-41ef-baac-c348d867ae86",
    "signal_id": "52cec6de-aeab-4609-8d7b-3be356249943",
    "asset_id": "1fa05507-56d5-407f-a3c4-6c915b8b7791",
    "alert_id": "epic2-live-20260728084006460159",
    "risk": "cpu_overload",
    "risk_level": "High",
    "risk_score": 0.92,
    "confidence": null,
    "reasoning": null,
    "severity": null,
    "priority": null,
    "raw_data": {
      "risk": "cpu_overload",
      "risk_level": "High",
      "risk_score": 0.92,
      "alert": "epic2-live-20260728084006460159"
    },
    "created_at": "2026-07-28T08:40:06.484199+00:00",
    "updated_at": "2026-07-28T08:40:06.513747+00:00"
  }
]
```

**Issue 7 — risks UI missing**

Good data from the API. The frontend has no UI for risks yet.

---

## Recommendations

### `GET /incidents/790d69c5-0fbf-41ef-baac-c348d867ae86/recommendations`

```json
[
  {
    "recommendation_id": "982d8851-c7b3-4e4b-b942-5fe42445c829",
    "dedup_key": "c06d5676dca5c9ea990cf37433d574581250c9641fe5beac7dca94ac49786cc3",
    "incident_id": "790d69c5-0fbf-41ef-baac-c348d867ae86",
    "signal_id": "52cec6de-aeab-4609-8d7b-3be356249943",
    "asset_id": "1fa05507-56d5-407f-a3c4-6c915b8b7791",
    "alert_id": "epic2-live-20260728084006460159",
    "recommendation": "Scale up CPU",
    "recommendation_key": "scale_cpu_live_validation",
    "confidence": 0.87,
    "risk_level": "High",
    "risk_score": 0.92,
    "reasoning": null,
    "severity": null,
    "priority": null,
    "raw_data": {
      "recommendation": "Scale up CPU",
      "recommendation_key": "scale_cpu_live_validation",
      "confidence": 0.87,
      "risk_level": "High",
      "risk_score": 0.92,
      "alert": "epic2-live-20260728084006460159"
    },
    "created_at": "2026-07-28T08:40:06.484199+00:00",
    "updated_at": "2026-07-28T08:40:06.513747+00:00"
  }
]
```

**Issue 8 — recommendation field names**

Frontend expects:

```json
{
  "recommendation_id": "...",
  "title": "Check storage latency",
  "confidence": 0.86,
  "risk": "Low"
}
```

API returns:

```json
{
  "recommendation": "Scale up CPU",
  "risk_level": "High",
  "risk_score": 0.92
}
```

Recommendation cards may show blank or incomplete text without an adapter.

---

## Related incidents

### `GET /incidents/2e6531d3-dbe5-409b-93a3-72d5811680a1/related`

```json
{
  "detail": "Not Found"
}
```

**Issue 9 — related endpoint not implemented**

Still returns 404. The frontend already treats this as unavailable.

---

## Summary checklist

| Area | API status | Frontend status | Action |
|---|---|---|---|
| Health | Works | Not used | None |
| List `/incidents` | Populated | Mostly works | Optional: add `correlation_key` to list rows |
| Stats | Populated | Works | None |
| Detail header | Populated | Works | None |
| Assets | Populated | Field mismatch | Map `entity`/`asset_type` to display |
| Timeline | Populated | Field mismatch | Map `created_at`/`message`/`event_type` |
| Recommendations | Populated (CPU alerts) | Field mismatch | Map `recommendation` → `title`, `risk_level` → `risk` |
| Metrics | Populated (CPU alerts) | No UI | Add client + UI |
| Risks | Populated (CPU alerts) | No UI | Add client + UI |
| Signals | Populated | No UI | Add display on list or detail |
| Related | 404 | Handled as unavailable | Backend gap |

---

## Suggested reply to backend contact

> Verified against `http://10.0.65.19:8003`. List and stats are populated (4 incidents). Detail, assets, timeline, and signals work at the API level. Metrics, risks, and recommendations populate for CPU-style alerts but return empty arrays for capacity validation alerts. Related incidents still 404. Frontend needs adapter updates for timeline/assets/recommendations field names, plus new UI for metrics/risks/signals.

---

## Frontend files involved

- Types: `src/types/incident-service.ts`
- API client: `src/api/incident-service/incidents.ts`
- List: `src/pages/Incidents.tsx`, `src/lib/incident-adapters.ts`
- Detail: `src/pages/IncidentOverviewApi.tsx`, `src/components/IncidentPlatformPanels.tsx`
- Docker proxy: `INCIDENT_API_TARGET=http://10.0.65.19:8003` in `docker-compose.yml`
