# Developer API Handoffs — Live Audit

**Captured:** 2026-08-09 (VPN)  
**Branch:** `docs/live-api-audit-refresh`  
**Source catalog:** [DEVELOPER_API_HANDOFFS.md](DEVELOPER_API_HANDOFFS.md)

This document records **live HTTP results** for every endpoint listed in the two developer handoffs. It is a verification pass, not a re-transcription of the PDFs.

## Bases used

| Part | Base curled | Result |
|------|-------------|--------|
| A — Incident Service | `http://10.0.65.19:8088/incident-api` | Live FastAPI-style JSON API |
| A — direct spot-check | `http://10.0.65.19:8003/health` | `{"status":"healthy"}` |
| B — Control Plane (handoff typo) | `http://10.0.65.19:8000` | **Attu** (Milvus UI SPA) — wrong host |
| B — Control Plane (**correct**) | `http://10.0.65.40:8000` | Live — full inventory **200** (verified 2026-08-10) |

IDs used during capture:

| Resource | Value |
|----------|-------|
| Use case | `1` (reads); created `24` for lifecycle writes |
| Incident (with recommendations) | `790d69c5-0fbf-41ef-baac-c348d867ae86` |
| Recommendation | `982d8851-c7b3-4e4b-b942-5fe42445c829` (“Scale up CPU”) |
| Knowledge | `1` (reprocess); ingest created `21`; upload created `22` |
| Learning | `LRN-457B9AD936D8` |
| Evaluation | `EVAL-073BDE16B0C0` (read); run created `EVAL-E9E096396390` |

Raw captures: `/tmp/destats-handoff-audit/` (local machine at audit time).

---

## Executive summary

| Area | Working | Partial / gap | Not available |
|------|--------:|--------------:|--------------:|
| Part A Epic 4 Use Cases | Most GET/POST/PATCH | Pagination filters ignored on list; `POST …/incidents` **405** (OpenAPI: GET only) | — |
| Part A Epic 5 Knowledge | List/search/ingest/similar/retrieve/reprocess/upload | Unfiltered list still plain array; upload needs multipart `file` | `GET /knowledge/health/dependencies` **404** |
| Part A Epic 10 Learning | List/stats/rankings/detail/feedback | `POST /learning/apply` returns empty ranked list; feedback requires `success` | `GET /learning/{id}/history` **404** |
| Part A Epic 11 Evaluation | Summary/history/detail/run | Summary lacks explicit partial/not-evaluable counts from handoff | — |
| Part B Control Plane (wrong host `.19:8000`) | — | — | Attu SPA / 404s (initial audit) |
| Part B Control Plane (**`.40:8000`**) | Full inventory (health, catalog GETs, AI/agent/policy POSTs, execution submit) | Admin policy mutations live but **not** in UI | Confirmed 2026-08-10 |

**Headline:** Incident Service Epics 4/5/10/11 are largely live behind `/incident-api`. Control Plane Epics 7/13/14 are live at **`http://10.0.65.40:8000`** (handoff originally listed `.19:8000` by mistake).

---

# Part A — Incident Service live results

Base: `INC=http://10.0.65.19:8088/incident-api`

## A.0 Health

### `GET /health` → **200**

```bash
curl -sS $INC/health
```

```json
{"status":"healthy"}
```

Same on `:8003`.

Also available: `GET $INC/openapi.json` (**200**, ~29 KB) and `GET $INC/docs` (**200** Swagger UI HTML).

---

## A.1 Epic 4 — Use Cases

### `GET /usecases` → **200** (array, 23 records)

Handoff claim: unfiltered list returns original array. **Confirmed.**

Sample (first record truncated):

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

### `GET /usecases?limit=2&offset=0` → **200**

Handoff claim: paginated envelope when filtering/pagination requested.  
**Gap:** Response is still the **full 23-item array** (same byte size as unfiltered). `limit`/`offset` appear **ignored** on this gateway build.

### `GET /usecases/search?q=capacity` → **200**

Envelope with search results:

```json
{
  "ok": true,
  "returned_records": 15,
  "records": [ { "id": 1, "title": "High Aggregate Utilization", "…" : "…" } ]
}
```

### `GET /usecases/export` → **200**

```json
{
  "ok": true,
  "export_type": "use_cases",
  "returned_records": 23,
  "records": [ "…" ]
}
```

### `GET /usecases/{id}` → **200** (id=`1`)

Full use-case object (same shape as list item).

### `GET /usecases/{id}/versions` → **200**

```json
{"ok": true, "usecase_id": 1, "returned_records": 0, "records": []}
```

Working route; empty history for this record.

### `GET /usecases/{id}/incidents` → **200**

```json
{"ok": true, "usecase_id": 1, "historical_incidents": []}
```

### `POST /usecases/{id}/incidents` → **405**

```json
{"detail": "Method Not Allowed"}
```

**Gap vs handoff:** PDF lists `GET/POST`. Live OpenAPI exposes **`GET` only** for `/usecases/{usecase_id}/incidents`. PUT also **405**.

### `GET /usecases/{id}/related` → **200**

```json
{
  "ok": true,
  "usecase_id": 1,
  "returned_records": 1,
  "records": [{ "id": 2, "title": "Critical EMS Event", "…" : "…" }]
}
```

### `POST /usecases` → **200** (created id `24`)

```json
{
  "id": 24,
  "title": "Audit smoke 1786281927",
  "status": "Draft",
  "confidence": 0.5,
  "category": "ops",
  "tags": ["audit"]
}
```

### `PATCH /usecases/{id}` → **200**

Partial update applied (`description` changed).

### Lifecycle on created id `24`

| Call | Status | Resulting `status` |
|------|--------|--------------------|
| `PATCH …/submit` | **200** | `Pending Review` |
| `PATCH …/approve` | **200** | `Approved` (`approved_by: "system"`) |
| `PATCH …/archive` | **200** | `Archived` |

### `POST /usecases/import` → **200**

Body `{"usecases":[]}`:

```json
{"ok": true, "imported_records": 0, "records": []}
```

---

## A.2 Epic 5 — Knowledge / RAG

### `GET /knowledge` → **200** (array, 20 records)

Still a **plain array** (not envelope). Sample fields include `embedding_status`, `parent_document_id`, `chunk_index`, `chunk_count`, `source_reference` (often sparse on older smoke rows).

### `GET /knowledge?limit=2&offset=0` → **200**

**Gap:** Identical full 20-item array — pagination params ignored on list (same as usecases).

### `GET /knowledge/search?q=capacity` → **200**

Envelope (`ok`, `returned_records`, `records`). Handoff mentions explicit `retrieval_type: keyword` — confirm on full body when present; search returns ranked keyword-style hits.

### `GET /knowledge/health/dependencies` → **404**

```json
{"detail": "Not Found"}
```

**Not deployed** on this gateway (or different path).

### `POST /knowledge/ingest` → **200**

Creates document + embedding summary:

```json
{
  "ok": true,
  "document_id": 21,
  "chunk_size": 800,
  "overlap": 100,
  "chunk_count": 1,
  "completed_embeddings": 1,
  "failed_embeddings": 0,
  "embedding_results": [{
    "provider": "sentence_transformers",
    "model": "sentence-transformers/all-MiniLM-L6-v2",
    "vector_dimension": 384,
    "collection_name": "knowledge_items_minilm_v1",
    "embedding_status": "stored"
  }]
}
```

**Vectors are not returned** in the public payload (matches handoff).

### `POST /knowledge/similar` → **200**

```json
{
  "ok": true,
  "query": "capacity planning",
  "retrieval_type": "semantic",
  "provider": "sentence_transformers",
  "model": "sentence-transformers/all-MiniLM-L6-v2",
  "collection_name": "knowledge_items_minilm_v1",
  "returned_records": 1,
  "records": [{ "id": 21, "similarity_score": "…", "…" : "…" }]
}
```

### `POST /knowledge/retrieve` → **200**

```json
{
  "ok": true,
  "retrieval_type": "semantic_context_package",
  "query": "capacity",
  "semantic_search": {
    "retrieval_type": "semantic",
    "returned_records": 2,
    "records": [ { "id": 21, "similarity_score": 0.35496 }, { "id": 5, "…" : "…" } ]
  }
}
```

### `POST /knowledge/{id}/reprocess` → **200** (id=`1`)

Re-embeds and upserts to Milvus; returns `knowledge_item` + `embedding_result`.

### `POST /knowledge/reprocess` (bulk) → **200**

```json
{
  "ok": true,
  "processed_records": 0,
  "completed_records": 0,
  "awaiting_provider_records": 0,
  "failed_records": 0,
  "results": []
}
```

(Empty selection with `{}` body — route works.)

### `POST /knowledge/upload`

| Attempt | Status | Notes |
|---------|--------|-------|
| JSON body | **422** | `Field required: body.file` |
| Multipart `file=@audit_upload.txt` | **200** | Created doc id `22`, embeddings stored |

Upload **works** with multipart form, not raw JSON.

---

## A.3 Epic 10 — Learning

### `GET /learning` → **200**

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

### `GET /learning?limit=2` → **200**

**Works:** `returned_records: 2` (unlike usecases/knowledge list).

### `GET /learning/stats` → **200**

Evidence-style stats per recommendation key (`total_attempts`, `success_count`, `success_rate`, `confidence_score`, …). Handoff’s partial/failed/incomplete breakdown fields are **not all present** as separate counters in this payload (has success/failure counts).

### `GET /learning/rankings` → **200**

```json
{"ok": true, "returned_records": 4, "rankings": [ "…" ]}
```

### `GET /learning/{id}` → **200**

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

### `GET /learning/{id}/history` → **404**

```json
{"detail": "Not Found"}
```

**Gap:** Handoff documents chronological history; route not available on this build.

### `POST /learning/apply` → **200** (but empty)

Tried with live `incident_id` + `recommendation_id`:

```json
{"ok": true, "returned_records": 0, "recommendations": []}
```

OpenAPI describes this as **“Rank candidate recommendations using historical learning”** — different from the handoff’s “create incomplete learning record / do not execute remediation” wording. Live behavior returned an **empty ranking**, not a new learning row.

### `POST /learning/{id}/feedback`

| Body | Status |
|------|--------|
| `{outcome, result, comments, rating}` | **422** — missing `success` |
| `{outcome, success:true, result, comments, rating}` | **200** |

Success response updates `result` / timestamps on the learning record. Handoff’s richer “adjustment evidence” envelope is thinner here (`ok` + `learning_record`).

---

## A.4 Epic 11 — Evaluation

### `GET /evaluation` → **200** (summary only)

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
    "metric_count": 190
  }
}
```

**Gap vs handoff:** No explicit `partial` / `not-evaluable` counts in this summary object.

### `GET /evaluation/history` → **200** (19 rows)

Lightweight rows with `evaluation_id`, `incident_id`, `learning_id`, `status`, `overall_score`, timing.

### `GET /evaluation/history?limit=2` → **200**

Pagination works (`returned_records: 2`).

### `GET /evaluation/{id}` → **200**

Full object including nested `metrics[]` (names like `resolution_success`, thresholds, `passed`, `calculation_method`).

### `POST /evaluation/run` → **200**

```json
{
  "ok": true,
  "evaluation": {
    "evaluation_id": "EVAL-E9E096396390",
    "incident_id": "790d69c5-0fbf-41ef-baac-c348d867ae86",
    "learning_id": "LRN-457B9AD936D8",
    "evaluation_type": "full",
    "status": "completed",
    "overall_score": 0.9445,
    "metrics": [ "…" ]
  }
}
```

Working end-to-end.

---

## Part A status matrix

| Method | Path | HTTP | Interpretation |
|--------|------|-----:|----------------|
| GET | `/health` | 200 | OK |
| GET | `/usecases` | 200 | OK — plain array |
| GET | `/usecases?limit=&offset=` | 200 | Gap — pagination ignored |
| GET | `/usecases/search` | 200 | OK — envelope |
| GET | `/usecases/export` | 200 | OK |
| GET | `/usecases/{id}` | 200 | OK |
| GET | `/usecases/{id}/versions` | 200 | OK — empty for sample |
| GET | `/usecases/{id}/incidents` | 200 | OK — empty historical |
| POST | `/usecases/{id}/incidents` | 405 | Gap — not allowed (OpenAPI GET-only) |
| GET | `/usecases/{id}/related` | 200 | OK |
| POST | `/usecases` | 200 | OK |
| PATCH | `/usecases/{id}` | 200 | OK |
| PATCH | `/usecases/{id}/submit\|approve\|archive` | 200 | OK lifecycle |
| POST | `/usecases/import` | 200 | OK |
| GET | `/knowledge` | 200 | OK — plain array |
| GET | `/knowledge?limit=` | 200 | Gap — pagination ignored |
| GET | `/knowledge/search` | 200 | OK |
| GET | `/knowledge/health/dependencies` | 404 | Missing |
| POST | `/knowledge/ingest` | 200 | OK + Milvus |
| POST | `/knowledge/upload` | 200* | OK with multipart (`422` if JSON) |
| POST | `/knowledge/similar` | 200 | OK semantic |
| POST | `/knowledge/retrieve` | 200 | OK context package |
| POST | `/knowledge/{id}/reprocess` | 200 | OK |
| POST | `/knowledge/reprocess` | 200 | OK (empty selection) |
| GET | `/learning` | 200 | OK + limit works |
| GET | `/learning/{id}` | 200 | OK |
| GET | `/learning/{id}/history` | 404 | Missing |
| GET | `/learning/stats` | 200 | OK |
| GET | `/learning/rankings` | 200 | OK |
| POST | `/learning/apply` | 200 | Odd — empty recommendations |
| POST | `/learning/{id}/feedback` | 200* | OK if `success` present |
| GET | `/evaluation` | 200 | OK summary |
| GET | `/evaluation/history` | 200 | OK + limit |
| GET | `/evaluation/{id}` | 200 | OK detail |
| POST | `/evaluation/run` | 200 | OK |

---

# Part B — Control Plane live results

## Correction (2026-08-10)

Handoff originally listed `http://10.0.65.19:8000`. That host serves **Attu** (Milvus UI).  
**Correct Control Plane base:** `http://10.0.65.40:8000`

Dashboard proxy: `/control-plane-api` → `.40:8000`.

### Full inventory recheck (2026-08-10) — all **200**

Captures: `/tmp/cp40-full/` on the audit machine.

#### Health

| Method | Path | HTTP | Sample |
|--------|------|-----:|--------|
| GET | `/health` | 200 | `{"status":"ok"}` |
| GET | `/ai/health` | 200 | `{"status":"ok","service":"ai"}` |
| GET | `/agent/health` | 200 | `{"status":"ok","service":"agent"}` |
| GET | `/policy/health` | 200 | `{"status":"ok","service":"policy"}` |
| GET | `/execution/health` | 200 | `{"status":"ok","service":"execution-proxy","mode":"SAFE_SIMULATION"}` |

#### Catalog GETs (UI: AI Models, Prompt Catalog, AI Audit, Policy Rules)

| Method | Path | HTTP | Notes |
|--------|------|-----:|-------|
| GET | `/ai/models` | 200 | `stub-local` available; `gpt-5-mini` unavailable |
| GET | `/ai/prompts` | 200 | e.g. `incident_summary_v1`, `plan_evaluation_v1` |
| GET | `/ai/logs` | 200 | In-memory / **restart-volatile** |
| GET | `/policy/rules` | 200 | Ordered rules (deny destructive, high-risk approval, …) |
| GET | `/docs` | 200 | Swagger UI |

#### AI POSTs (stub-local SUCCESS — not wired as public “Try completion” UI yet)

| Method | Path | HTTP | Notes |
|--------|------|-----:|-------|
| POST | `/ai/complete` | 200 | Deterministic stub |
| POST | `/ai/chat` | 200 | Deterministic stub |
| POST | `/ai/evaluate` | 200 | Deterministic stub |
| POST | `/ai/route` | 200 | Selects stub-local |

#### Agent POSTs (UI: Incident detail → Control Plane tab)

| Method | Path | HTTP | Sample |
|--------|------|-----:|--------|
| POST | `/agent/evaluate-incident` | 200 | `accepted`, score ~0.6, reasons + evidence |
| POST | `/agent/evaluate-plan` | 200 | Deterministic pipeline |
| POST | `/agent/evaluate-action` | 200 | Deterministic pipeline |
| POST | `/agent/rank-recommendations` | 200 | `ranking_method: deterministic-risk` |
| POST | `/agent/confidence-score` | 200 | e.g. `level: HIGH`, score 0.8 |
| POST | `/agent/resolve` | 200 | Plan with `NOT_EXECUTED` — **not** exposed in UI (Phase 3) |

#### Policy POSTs

| Method | Path | HTTP | Sample / UI |
|--------|------|-----:|-------------|
| POST | `/policy/check-action` | 200 | `ALLOWED` / `REQUIRES_HUMAN_REVIEW` / `DENIED` — **Incident Control Plane tab** |
| POST | `/policy/check-plan` | 200 | Deterministic |
| POST | `/policy/check-model` | 200 | Fail-closed to human review when unmatched |
| POST | `/policy/rules` | 200 | **Admin only — no browser UI** |
| PATCH | `/policy/rules/{rule_id}` | 200 | **Admin only — no browser UI** |

#### Execution

| Method | Path | HTTP | Notes |
|--------|------|-----:|-------|
| POST | `/execution/submit` | 200 | `SAFE_SIMULATION` accepted — **not** exposed in public UI yet |

### Dashboard integration status

| Surface | Status |
|---------|--------|
| System Status health cards | Done (four Control Plane health GETs) |
| `/ai-models`, `/prompt-catalog`, `/ai-audit`, `/policy-rules` | Done (read-only) |
| Incident → **Control Plane** tab (evaluate / rank / confidence / check-action) | Done |
| Policy rule create/patch | **Skipped** until auth exists |
| AI complete/chat demos, agent resolve, execution submit | Deferred (Phase 3) |

---

## Historical note — wrong host `.19:8000` (2026-08-09)

At first audit, `GET http://10.0.65.19:8000/` returned the **Attu** SPA (`<title>Attu</title>`). All Control Plane paths on that host returned **404**. That finding stands for **`.19` only**.

---

## Gaps vs handoff claims (consolidated)

1. **Control Plane handoff host typo** — use `.40:8000`, not `.19:8000` (Attu).  
2. **`GET /knowledge/health/dependencies`** — documented, **404**.  
3. **`GET /learning/{id}/history`** — documented, **404**.  
4. **`POST /usecases/{id}/incidents`** — documented, live **405** / OpenAPI GET-only.  
5. **Pagination envelope for `/usecases` and `/knowledge` list** — handoff says envelope when paginating; live **ignores** `limit`/`offset` and still returns full arrays. Learning/evaluation history **do** honor `limit`.  
6. **`POST /learning/apply`** — live OpenAPI semantics = rank recommendations; returned empty list for a known recommendation (needs payload shape clarification from backend).  
7. **Feedback schema** — requires boolean `success` (handoff emphasized outcome/rating/comments).  
8. **Upload** — multipart `file` required (not JSON).  
9. **Evaluation summary** — missing partial/not-evaluable counts called out in Epic 11 handoff.
10. **Policy admin mutations** — live but **intentionally not** in the dashboard UI (no auth boundary yet).

---

## Appendix — reproduce

```bash
INC=http://10.0.65.19:8088/incident-api
CP=http://10.0.65.40:8000

# Part A health + samples
curl -fsS $INC/health
curl -fsS "$INC/usecases/search?q=capacity" | python3 -m json.tool | head
curl -fsS $INC/learning/stats | python3 -m json.tool | head
curl -fsS $INC/evaluation | python3 -m json.tool

# Part B Control Plane (correct host) — catalog
curl -fsS $CP/ai/health
curl -fsS $CP/agent/health
curl -fsS $CP/policy/health
curl -fsS $CP/execution/health
curl -fsS $CP/ai/models | python3 -m json.tool
curl -fsS $CP/ai/prompts | python3 -m json.tool | head
curl -fsS $CP/ai/logs | python3 -m json.tool | head
curl -fsS $CP/policy/rules | python3 -m json.tool | head

# Agent / policy probes (deterministic)
curl -fsS -X POST $CP/agent/evaluate-incident -H 'Content-Type: application/json' \
  -d '{"incident_id":"INC-001","title":"High CPU","description":"CPU exceeded 95%","severity":"high","tenant_id":"tdk","signals":[{"metric":"cpu_usage","value":97}]}'
curl -fsS -X POST $CP/policy/check-action -H 'Content-Type: application/json' \
  -d '{"component_name":"agent","tenant_id":"tdk","user_id":"operator-1","roles":["operator"],"resource":"node-01","action":"investigate","context":{"risk_level":"LOW","evidence_complete":true}}'
```

VPN required.

## Related docs

- [DEVELOPER_API_HANDOFFS.md](DEVELOPER_API_HANDOFFS.md) — PDF transcription (contracts)  
- [LIVE_API_RESPONSE_AUDIT.md](LIVE_API_RESPONSE_AUDIT.md) — earlier NetApp + core incident GET audit  
- [EPIC_4_5_10_11_API_TEST_REPORT.md](EPIC_4_5_10_11_API_TEST_REPORT.md) — prior smoke report  
