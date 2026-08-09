# Epics 4 / 5 / 10 / 11 — Integration vs Live Responses

**Captured:** 2026-08-09 (rechecked)  
**Base:** `http://10.0.65.19:8088/incident-api`  
**Sources:** handoff PDF (Epics 4, 5, 10, 11) + destats clients under `src/api/incident-service/`

This doc answers two questions:

1. Which handoff APIs has destats **already integrated** (client / UI)?  
2. What **live HTTP status + response** do we get today?

Related: [DEVELOPER_API_HANDOFFS.md](DEVELOPER_API_HANDOFFS.md), [DEVELOPER_API_LIVE_AUDIT.md](DEVELOPER_API_LIVE_AUDIT.md).

---

## Headline counts

Handoff catalog for Epics 4/5/10/11 = **33** endpoints.

| Category | Count | Notes |
|----------|------:|-------|
| **Integrated in destats client** | **25** | Wrapper exists in `src/api/incident-service/*` |
| **Not integrated yet** | **8** | No client wrapper |
| **Client exists + used by UI/hooks** | **~20** | Pages / `platform-api` hooks / incident panels |
| **Client only (no UI hook yet)** | **~5** | e.g. versions, usecase incidents GET, related, ingest, reprocess-by-id |
| **Live OK (2xx with useful body)** | **28** | Includes some not-yet-integrated routes |
| **Live broken / missing** | **3** | `405` or `404` |
| **Live odd** | **1** | `POST /learning/apply` → 200 but empty list |

---

## Quick matrix (all handoff endpoints)

Legend:

- **Client:** API wrapper in destats  
- **UI:** Called from hooks/pages today  
- **Live:** Rechecked against `:8088/incident-api`

| Epic | Method | Path | Client | UI | Live | Sample / note |
|------|--------|------|:------:|:--:|:----:|---------------|
| 4 | GET | `/usecases` | Yes | Yes | **200** | Plain array, 24 items |
| 4 | GET | `/usecases/search` | Yes | Yes | **200** | `{ok, returned_records, records}` |
| 4 | POST | `/usecases` | Yes | Yes | **200** | Creates Draft use case |
| 4 | PATCH | `/usecases/{id}` | Yes | Yes | **200** | Partial update |
| 4 | PATCH | `/usecases/{id}/submit` | Yes | Yes | **200** | → Pending Review |
| 4 | PATCH | `/usecases/{id}/approve` | Yes | Yes | **200** | → Approved |
| 4 | PATCH | `/usecases/{id}/archive` | **No** | No | **200** | Works live; not wired |
| 4 | GET | `/usecases/{id}/versions` | Yes | No | **200** | Empty records for id=1 |
| 4 | GET | `/usecases/{id}/incidents` | Yes | No | **200** | `{historical_incidents:[]}` |
| 4 | POST | `/usecases/{id}/incidents` | **No** | No | **405** | Method Not Allowed |
| 4 | GET | `/usecases/{id}/related` | Yes | No | **200** | Related use cases |
| 4 | GET | `/usecases/export` | **No** | No | **200** | Export envelope |
| 4 | POST | `/usecases/import` | **No** | No | **200** | Import OK |
| 5 | GET | `/knowledge` | Yes | Yes | **200** | Plain array, 22 items |
| 5 | GET | `/knowledge/search` | Yes | Yes | **200** | Envelope + records |
| 5 | POST | `/knowledge/ingest` | Yes | No | **200** | Chunks + Milvus embed |
| 5 | POST | `/knowledge/upload` | **No** | No | **200*** | Needs multipart `file` |
| 5 | POST | `/knowledge/similar` | Yes | Yes | **200** | `retrieval_type: semantic` |
| 5 | POST | `/knowledge/retrieve` | Yes | Yes | **200** | Context package |
| 5 | POST | `/knowledge/{id}/reprocess` | Yes | No | **200** | Re-embed OK |
| 5 | POST | `/knowledge/reprocess` | **No** | No | **200** | Bulk (empty `{}` ok) |
| 5 | GET | `/knowledge/health/dependencies` | **No** | No | **404** | Not found |
| 10 | POST | `/learning/apply` | Yes | Yes | **200** | Empty `recommendations: []` |
| 10 | POST | `/learning/{id}/feedback` | Yes | Yes | **200** | Needs `success` bool |
| 10 | GET | `/learning` | Yes | Yes | **200** | Envelope + records |
| 10 | GET | `/learning/{id}` | Yes | Yes | **200** | `{learning_record}` |
| 10 | GET | `/learning/{id}/history` | **No** | No | **404** | Not found |
| 10 | GET | `/learning/stats` | Yes | Yes | **200** | `{ok, stats[]}` |
| 10 | GET | `/learning/rankings` | Yes | Yes | **200** | `{ok, rankings[]}` |
| 11 | POST | `/evaluation/run` | Yes | Yes | **200** | Full evaluation + metrics |
| 11 | GET | `/evaluation` | Yes | Yes | **200** | Summary only |
| 11 | GET | `/evaluation/history` | Yes | Yes | **200** | History rows |
| 11 | GET | `/evaluation/{id}` | Yes | Yes | **200** | Detail + metrics |

\* Upload returns **422** for JSON body; **200** with multipart form `file=`.

### Not integrated (8)

1. `PATCH /usecases/{id}/archive`  
2. `POST /usecases/{id}/incidents` (also live **405**)  
3. `GET /usecases/export`  
4. `POST /usecases/import`  
5. `POST /knowledge/upload`  
6. `POST /knowledge/reprocess` (bulk)  
7. `GET /knowledge/health/dependencies` (also live **404**)  
8. `GET /learning/{id}/history` (also live **404**)  

> **Update 2026-08-09:** Items 1, 3–6 are now wired in the UI (Use Cases + Knowledge). Still deferred until backend is ready: **2, 7, 8**.

---

## Live responses we are getting

Base: `INC=http://10.0.65.19:8088/incident-api`

### Health

```bash
curl -sS $INC/health
```

```json
{"status": "healthy"}
```

---

### Epic 4 — Use Cases

#### `GET /usecases` → 200 (integrated)

Plain **array** (not envelope). Example first item:

```json
{
  "id": 1,
  "title": "High Aggregate Utilization",
  "description": "Storage aggregate is approaching capacity limits.",
  "problem": "Aggregate utilization exceeded recommended threshold.",
  "environment": "NetApp ONTAP",
  "status": "Archived",
  "confidence": 0.95,
  "category": "Storage Capacity",
  "tags": ["aggregate", "capacity", "storage"]
}
```

Count at recheck: **24**.

#### `GET /usecases/search?q=capacity` → 200 (integrated)

```json
{
  "ok": true,
  "returned_records": 15,
  "records": [ { "id": 1, "title": "High Aggregate Utilization", "…": "…" } ]
}
```

#### `GET /usecases/{id}/versions` → 200 (client only)

```json
{"ok": true, "usecase_id": 1, "returned_records": 0, "records": []}
```

#### `GET /usecases/{id}/incidents` → 200 (client only)

```json
{"ok": true, "usecase_id": 1, "historical_incidents": []}
```

#### `POST /usecases/{id}/incidents` → 405 (not integrated)

```json
{"detail": "Method Not Allowed"}
```

#### `GET /usecases/{id}/related` → 200 (client only)

```json
{
  "ok": true,
  "usecase_id": 1,
  "returned_records": 1,
  "records": [{ "id": 2, "title": "Critical EMS Event", "…": "…" }]
}
```

#### Lifecycle writes (integrated except archive)

Create → submit → approve work and return updated `status` (`Draft` → `Pending Review` → `Approved`). Archive works live but has **no destats client**.

---

### Epic 5 — Knowledge

#### `GET /knowledge` → 200 (integrated)

Plain array (**22** items). Example:

```json
{
  "id": 22,
  "title": "audit_upload",
  "document_type": "Document",
  "source": "Uploaded File",
  "content": "Live audit upload content about capacity.",
  "tags": ["audit"],
  "embedding_status": "completed",
  "parent_document_id": 22,
  "chunk_index": 0,
  "chunk_count": 1
}
```

#### `GET /knowledge/search?q=capacity` → 200 (integrated)

```json
{"ok": true, "returned_records": 22, "records": [ "…" ]}
```

#### `POST /knowledge/similar` → 200 (integrated)

```json
{
  "ok": true,
  "query": "capacity",
  "retrieval_type": "semantic",
  "provider": "sentence_transformers",
  "model": "sentence-transformers/all-MiniLM-L6-v2",
  "collection_name": "knowledge_items_minilm_v1",
  "returned_records": 1,
  "records": [ "…" ]
}
```

#### `POST /knowledge/retrieve` → 200 (integrated)

```json
{
  "ok": true,
  "retrieval_type": "semantic_context_package",
  "query": "capacity",
  "semantic_search": {
    "retrieval_type": "semantic",
    "returned_records": 1,
    "records": [ "…" ]
  },
  "context_package": {
    "knowledge_matches": [ "…" ],
    "returned_records": 1
  }
}
```

#### `GET /knowledge/health/dependencies` → 404 (not integrated)

```json
{"detail": "Not Found"}
```

---

### Epic 10 — Learning

#### `GET /learning` → 200 (integrated)

```json
{
  "ok": true,
  "returned_records": 16,
  "records": [{
    "learning_id": "LRN-457B9AD936D8",
    "incident_id": "790d69c5-0fbf-41ef-baac-c348d867ae86",
    "recommendation": "Scale up CPU",
    "outcome_status": "success",
    "success": true,
    "confidence_after": 0.6667
  }]
}
```

#### `GET /learning/stats` → 200 (integrated)

```json
{
  "ok": true,
  "stats": [{
    "recommendation": "Smoke expand capacity",
    "total_attempts": 6,
    "success_count": 6,
    "failure_count": 0,
    "success_rate": 1.0,
    "confidence_score": 0.875
  }]
}
```

#### `GET /learning/rankings` → 200 (integrated)

```json
{"ok": true, "returned_records": 4, "rankings": [ "…" ]}
```

#### `GET /learning/{id}` → 200 (integrated)

```json
{
  "ok": true,
  "learning_record": {
    "learning_id": "LRN-457B9AD936D8",
    "recommendation": "Scale up CPU",
    "outcome_status": "success",
    "confidence_after": 0.6667
  }
}
```

#### `GET /learning/{id}/history` → 404 (not integrated)

```json
{"detail": "Not Found"}
```

#### `POST /learning/apply` → 200 (integrated, odd)

```json
{"ok": true, "returned_records": 0, "recommendations": []}
```

#### `POST /learning/{id}/feedback` → 200 (integrated)

Requires `success` in body. Returns updated `learning_record`.

---

### Epic 11 — Evaluation

#### `GET /evaluation` → 200 (integrated)

```json
{
  "ok": true,
  "summary": {
    "total_evaluations": 20,
    "completed_evaluations": 20,
    "failed_evaluations": 0,
    "average_overall_score": 0.785,
    "metric_count": 194
  }
}
```

#### `GET /evaluation/history` → 200 (integrated)

```json
{
  "ok": true,
  "returned_records": 20,
  "records": [{
    "evaluation_id": "EVAL-…",
    "incident_id": "790d69c5-…",
    "learning_id": "LRN-…",
    "status": "completed",
    "overall_score": 0.4282
  }]
}
```

#### `POST /evaluation/run` → 200 (integrated)

```json
{
  "ok": true,
  "evaluation": {
    "evaluation_id": "EVAL-DF6958936831",
    "evaluation_type": "full",
    "status": "completed",
    "overall_score": 0.9445,
    "metrics": [ "…" ]
  }
}
```

---

## Gaps to remember

| Gap | Detail |
|-----|--------|
| Pagination on `/usecases` & `/knowledge` lists | `?limit=2` still returns full array |
| Learning list pagination | `?limit=2` **does** work |
| `POST /learning/apply` | Returns empty recommendations |
| 3 missing/broken live routes | deps 404, learning history 404, usecase incident POST 405 |
| 8 handoff routes not in destats client | See list above |

---

## Where destats uses the integrated ones

| Area | Main wiring |
|------|-------------|
| Use Cases page | `useUseCases`, search/create/patch/submit/approve |
| Knowledge page | `fetchKnowledge` / search via scorpius → incident-service |
| Learning page | list, stats, rankings, feedback |
| Evaluation page | evaluations + history + run |
| Incident panels | `applyLearning`, create learning, retrieve/similar knowledge |

Client files:

- [`src/api/incident-service/usecases.ts`](../src/api/incident-service/usecases.ts)  
- [`src/api/incident-service/knowledge.ts`](../src/api/incident-service/knowledge.ts)  
- [`src/api/incident-service/learning.ts`](../src/api/incident-service/learning.ts)  
- [`src/api/incident-service/evaluation.ts`](../src/api/incident-service/evaluation.ts)  
