# Epic 4 / 5 / 10 / 11 API Smoke Test Report

**Date:** 2026-07-21  
**Prepared by:** Usman Malik (destats integration)  
**Base URL:** `http://10.0.65.19:8088/incident-api`  
**Auth:** none  
**Status:** **Pass** — GETs verified earlier; writes **16 passed / 0 failed / 3 skipped** (`scripts/test-epic-writes.sh`, run `20260721T135625Z`)

---

## Executive summary

Rayaan’s Epic 4/5/10/11 APIs are live behind the same destats nginx proxy as Epic 2/3 (`/incident-api`). Smoke tests confirm JSON APIs (not SPA HTML) for use cases, knowledge (Milvus embeddings), learning, and evaluation.

| Suite | Result |
|---|---|
| GET endpoints (prior pass) | Pass — HTTP 200 JSON |
| POST/PATCH writes (`test-epic-writes.sh`) | **16 passed, 0 failed, 3 skipped** |
| Skipped (by design) | `POST /knowledge/reprocess` (all embeddings), `POST /usecases/import`, `POST /knowledge/upload` |

**Created this run:** usecase `15`, knowledge `19`, learning `LRN-B82AA36043BE`, evaluation `EVAL-42FE3FC19E44`

**Side notes**

- `/incidents` / `/incidents/stats` on this gateway may be empty after the platform switch (Epic 2/3 data separate from Rayaan’s services).
- Feedback requires body field `"success": true|false` (not rating alone).
- Use-case workflow statuses observed: `draft` → `Pending Review` → `Approved`.

---

## How Rayaan configured it

| Item | Value |
|---|---|
| Base | `http://10.0.65.19:8088/incident-api` |
| Auth | none |
| Sample IDs | `usecase_id=1`, `learning_id=LRN-749118C28398`, `evaluation_id=EVAL-16A48330386F` |
| Knowledge | was empty initially; smoke creates now populate Milvus (`knowledge_items_minilm_v1`) |

---

## Write suite results (2026-07-21)

Script: [scripts/test-epic-writes.sh](../scripts/test-epic-writes.sh)

| # | Method | Path | HTTP | Result |
|---|---|---|---|---|
| 1 | POST | `/knowledge/retrieve` | 200 | Pass — semantic retrieve, 5 records |
| 2 | POST | `/learning/apply` | 200 | Pass — adjusted confidence / ranks |
| 3 | POST | `/evaluation/run` | 200 | Pass — `EVAL-42FE3FC19E44`, score 0.8532 |
| 4 | POST | `/usecases` | 200 | Pass — created id `15` |
| 5 | POST | `/knowledge` | 200 | Pass — id `19` + embedding stored |
| 6 | POST | `/knowledge/ingest` | 200 | Pass — document_id `20`, 1 chunk |
| 7 | POST | `/knowledge/similar` | 200 | Pass — 3 similar records |
| 8 | POST | `/learning` | 200 | Pass — `LRN-B82AA36043BE` |
| 9 | PATCH | `/usecases/15` | 200 | Pass — description updated |
| 10 | PATCH | `/usecases/15/submit` | 200 | Pass — status `Pending Review` |
| 11 | PATCH | `/usecases/15/approve` | 200 | Pass — status `Approved` |
| 12 | GET | `/usecases/15` | 200 | Pass — Approved |
| 13 | GET | `/knowledge/19` | 200 | Pass |
| 14 | POST | `/knowledge/19/reprocess` | 200 | Pass — embedding re-stored |
| 15 | GET | `/learning/LRN-B82AA36043BE` | 200 | Pass |
| 16 | POST | `/learning/…/feedback` | 200 | Pass — `success: true`, `confidence_after: 0.875` |
| — | POST | `/knowledge/reprocess` | — | Skipped (heavy) |
| — | POST | `/usecases/import` | — | Skipped (needs file) |
| — | POST | `/knowledge/upload` | — | Skipped (multipart) |

---

## Endpoint matrix

Legend: **Pass** = HTTP 2xx JSON. **Skip** = intentionally not run. **Archive** not exercised (avoid mutating seed permanently beyond smoke UC).

### Epic 4 — Use Case Repository

| Method | Path | Working | Notes |
|---|---|---|---|
| GET | `/usecases` | Pass | list |
| POST | `/usecases` | Pass | returns numeric `id` |
| GET | `/usecases/search` | Pass | `?q=capacity` |
| GET | `/usecases/export` | Pass | |
| POST | `/usecases/import` | Skip | needs file |
| GET | `/usecases/{id}` | Pass | seed `1` + created `15` |
| PATCH | `/usecases/{id}` | Pass | on created `15` |
| GET | `/usecases/{id}/versions` | Pass | |
| PATCH | `/usecases/{id}/submit` | Pass | → `Pending Review` |
| PATCH | `/usecases/{id}/approve` | Pass | → `Approved`, `approved_by: system` |
| PATCH | `/usecases/{id}/archive` | Skip | not in write smoke |
| GET | `/usecases/{id}/incidents` | Pass | |
| GET | `/usecases/{id}/related` | Pass | |

### Epic 5 — Knowledge Repository

| Method | Path | Working | Notes |
|---|---|---|---|
| GET | `/knowledge` | Pass | may have been empty before smoke creates |
| POST | `/knowledge` | Pass | wraps `knowledge_item` + `embedding_result` |
| GET | `/knowledge/search` | Pass | |
| POST | `/knowledge/similar` | Pass | MiniLM + Milvus |
| POST | `/knowledge/retrieve` | Pass | `semantic_context_package` |
| POST | `/knowledge/reprocess` | Skip | all embeddings |
| POST | `/knowledge/ingest` | Pass | chunks + embeddings |
| POST | `/knowledge/upload` | Skip | multipart |
| POST | `/knowledge/{id}/reprocess` | Pass | single item |
| GET | `/knowledge/{id}` | Pass | created `19` |

### Epic 10 — Learning

| Method | Path | Working | Notes |
|---|---|---|---|
| POST | `/learning` | Pass | wraps `learning_record` |
| GET | `/learning` | Pass | |
| GET | `/learning/stats` | Pass | |
| GET | `/learning/rankings` | Pass | |
| GET | `/learning/incident/{id}` | Pass | |
| POST | `/learning/apply` | Pass | Rayaan body shape |
| GET | `/learning/{id}` | Pass | |
| POST | `/learning/{id}/feedback` | Pass | requires `"success": boolean` |

### Epic 11 — Evaluation

| Method | Path | Working | Notes |
|---|---|---|---|
| POST | `/evaluation/run` | Pass | Rayaan metrics body |
| GET | `/evaluation` | Pass | |
| GET | `/evaluation/history` | Pass | |
| GET | `/evaluation/{id}` | Pass | seed + new runs |

---

## Sample responses (writes)

### `POST /learning/apply` (excerpt)

```json
{
  "ok": true,
  "returned_records": 2,
  "recommendations": [
    {
      "recommendation": "Expand aggregate capacity and verify utilization",
      "confidence": 0.75,
      "adjusted_confidence": 0.5,
      "learning_applied": true,
      "rank": 2
    }
  ]
}
```

### `POST /evaluation/run` (excerpt)

```json
{
  "ok": true,
  "evaluation": {
    "evaluation_id": "EVAL-42FE3FC19E44",
    "learning_id": "LRN-749118C28398",
    "status": "completed",
    "overall_score": 0.8532,
    "created_by": "usman-smoke"
  }
}
```

### `POST /learning/{id}/feedback` (excerpt)

```json
{
  "ok": true,
  "learning_record": {
    "learning_id": "LRN-B82AA36043BE",
    "outcome_status": "success",
    "success": true,
    "confidence_after": 0.875
  }
}
```

---

## Re-run

```bash
# GET + optional writes
bash scripts/test-epic-apis.sh
EPIC_RUN_WRITES=1 bash scripts/test-epic-apis.sh

# Writes only (what produced this report’s write table)
bash scripts/test-epic-writes.sh
```

Defaults: `EPIC_API_BASE=http://10.0.65.19:8088/incident-api`.

---

## Integration follow-up

1. Add TypeScript clients under `src/api/` (mirror incident-service).
2. Replace [src/mocks/knowledge.ts](../src/mocks/knowledge.ts) with live Knowledge API.
3. Wire Use Case / Learning / Evaluation UI when product prioritizes it.
4. Extend [src/pages/ApiDocs.tsx](../src/pages/ApiDocs.tsx) with Epic 4/5/10/11 routes.
5. Confirm Epic 2/3 incident data path if `/incidents` stays empty on this gateway.

---

## Conclusion

**Live APIs work** at `/incident-api` for Epics 4, 5, 10, and 11. Write smoke: **16/16 exercised endpoints passed**; 3 heavy/file endpoints intentionally skipped. Ready for UI/client integration when that work is scheduled.
