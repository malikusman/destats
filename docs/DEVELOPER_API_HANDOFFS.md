# Developer API Handoffs

**Status:** Documentation of external developer PDFs (not a live verification)  
**Captured into destats:** 2026-08-09  
**Branch context:** `docs/live-api-audit-refresh`

This document consolidates what two developers shared so the dashboard team has a single durable reference before wiring or re-testing.

| Source document | Scope | Prepared for / date |
|-----------------|-------|---------------------|
| *Scorpius Incident Service — API Capabilities Summary* | Epics **4, 5, 10, 11** (Use Cases, Knowledge/RAG, Learning, Evaluation) | Scorpius Team — **August 8, 2026** |
| *TDK Epics 7 / 13 / 14 APIs* — Dashboard integration handoff | Epics **7, 13, 14** + execution support (AI Gateway, Agent, Policy, Execution Proxy) | Scorpius Networks / TDK Control Plane — **7 August 2026** |

> **Important:** Part A (Incident Service) and Part B (Control Plane) are **different applications**. Do not append Control Plane routes to `http://10.0.65.19:8088/incident-api`.

Live curl / VPN verification is **out of scope for this document**. See [Cross-references](#cross-references) for existing destats live-audit docs.

---

## Table of contents

1. [Part A — Incident Service (Epics 4, 5, 10, 11)](#part-a--incident-service-epics-4-5-10-11)
2. [Part B — Control Plane (Epics 7, 13, 14 + execution)](#part-b--control-plane-epics-7-13-14--execution)
3. [Cross-references](#cross-references)

---

# Part A — Incident Service (Epics 4, 5, 10, 11)

## A.0 Access context (destats)

These capabilities enrich the **Incident Service** already consumed by destats through `/incident-api`.

| Consumer | Base | Notes |
|----------|------|-------|
| Dashboard browser | `/incident-api/*` | Vite / Nginx proxy |
| Gateway (TDK) | `http://10.0.65.19:8088/incident-api` | App default `INCIDENT_API_TARGET` |
| Direct service (when gateway self-proxies) | `http://10.0.65.19:8003` | Common TDK host override |

Epics covered in the handoff:

- **Epic 4** — Use Case Repository  
- **Epic 5** — Knowledge Repository and RAG  
- **Epic 10** — Closed Learning Loop  
- **Epic 11** — Evaluation Framework  

---

## A.1 Epic 4 — Use Case Repository

Epic 4 evolved use-case APIs from basic record storage into a **searchable and versioned operational repository** with lifecycle management and incident relationships.

### API capabilities

| Endpoint | Enrichment |
|----------|------------|
| `GET /usecases` | Status, category, environment, tag, and minimum-confidence filters; limit/offset pagination; stable ascending or descending ordering; total and returned counts. |
| `GET /usecases/search` | Search across relevant text fields with tag, category, and status filters; pagination; stable ranking; escaped SQL wildcard characters; empty-query rejection. |
| `POST /usecases` | Structured validation, unknown-field rejection, confidence bounds, title requirement, problem-or-description requirement, and normalized string arrays. |
| `PATCH /usecases/{id}` | True partial updates, immutable-field protection, structured validation, and correct 404/422 handling. |
| `PATCH /usecases/{id}/submit` | Lifecycle: submit. Correct unknown-use-case handling. |
| `PATCH /usecases/{id}/approve` | Lifecycle: approve. Correct unknown-use-case handling. |
| `PATCH /usecases/{id}/archive` | Lifecycle: archive. Correct unknown-use-case handling. |
| `GET /usecases/{id}/versions` | Historical versions captured before an existing record changes. |
| `GET /usecases/{id}/incidents` | Validated incident relationships with duplicate prevention and backward-compatible legacy fields. |
| `POST /usecases/{id}/incidents` | Link incidents; same validation / duplicate rules as GET companion. |
| `GET /usecases/{id}/related` | Related-use-case discovery remains available. |
| `GET /usecases/export` | Repository export capability remains available. |
| `POST /usecases/import` | Repository import capability remains available. |

### Compatibility and data integrity

- Calling `GET /usecases` **without filters** continues to return the **original array** expected by current consumers.
- A **paginated envelope** is returned only when filtering or pagination is requested.
- A **normalized relationship table** provides reliable incident querying while **legacy JSON incident fields** remain available.
- Duplicate incident links return **HTTP 409**; unknown use cases or incidents return **HTTP 404**.
- Prior use-case versions support **auditability and historical review**.

---

## A.2 Epic 5 — Knowledge Repository and RAG

Epic 5 evolved the knowledge API from a basic list and substring search into a **persistent, chunked knowledge repository** with ranked keyword search, semantic retrieval, ingestion deduplication, provenance, and bounded RAG context.

### Knowledge model

Knowledge records now capture:

- Deterministic **content hash** and **parent-document** relationship  
- **Chunk index** and **chunk count**  
- Embedding **provider**, **model**, **dimension**, **version**, and **status**  
- **Source type**, **source reference**, **metadata**, and timestamps  
- Existing frontend fields including **title**, **content**, **source**, **document type**, and **tags**  

### API capabilities

| Endpoint | Enrichment |
|----------|------------|
| `GET /knowledge` | Pagination; tag, document-type, embedding-status, and creation-date filters; stable ordering; total and returned counts. |
| `GET /knowledge/search` | Parameterized SQL search with normalized queries, escaped wildcards, title-first ranking, filters, pagination, and explicit `retrieval_type: keyword`. |
| `POST /knowledge/ingest` | Validation, normalization, SHA-256 deduplication, bounded chunking, embedding generation, Milvus storage, provenance, and an ingestion summary. |
| `POST /knowledge/upload` | TXT and Markdown upload with file-type, decoding, tag, use-case, chunk-size, and overlap validation. |
| `POST /knowledge/similar` | Validated semantic search with limits, score threshold, filters, provider/model/collection reporting, provenance, and similarity scores. |
| `POST /knowledge/retrieve` | Semantic-first retrieval, keyword fallback, explicit strategy reporting, source-attributed chunks, incident/use-case context, and a bounded context package. |
| `POST /knowledge/{id}/reprocess` | Safe vector upsert, successful-version increments, duplicate prevention, failure rollback behavior, and 404 handling. |
| `POST /knowledge/reprocess` | Controlled **bulk** reprocessing using the same safe versioning behavior. |
| `GET /knowledge/health/dependencies` | Embedding and Milvus availability, model, dimension, URI, collection, and dependency errors. |

### Retrieval and resilience

- Chunking favors paragraph and sentence boundaries, supports configurable overlap, and preserves parent and chunk position.
- **Raw embedding vectors are never exposed** through public routes.
- Milvus initialization is **lazy**, so a vector-service outage does not prevent API startup or keyword search.
- Semantic failures are reported honestly; keyword fallback is **never presented as semantic retrieval**.
- RAG context respects a **maximum character budget** and avoids adding unrelated content only to fill a result limit.
- Embedding versions advance only after successful vector replacement; the previous valid state is preserved on failure.

---

## A.3 Epic 10 — Closed Learning Loop

Epic 10 evolved the learning APIs from current-value summaries into an **auditable workflow** that records recommendation applications, append-only feedback, confidence adjustments, statistics, and evidence-based rankings.

### Learning model and evidence

- Recommendation ID, application ID, and deterministic **deduplication key**  
- Exact **action taken**, **applied-by** identity, and application timestamp  
- Success score, feedback timestamp, and **calculation version**  
- Confidence **before** and **after** learning, stored separately  
- **Append-only feedback** with outcome, rating, comments, result, actor, timestamp, and deduplication key  

### API capabilities

| Endpoint | Enrichment |
|----------|------------|
| `POST /learning/apply` | Validates incident and recommendation references, preserves authoritative recommendation text, records the exact action, creates an incomplete learning record, and **does not execute remediation**. |
| `POST /learning/{id}/feedback` | Validates outcome and rating, requires result plus comments or rating, appends evidence, recalculates statistics/confidence/rankings, and returns adjustment evidence. |
| `GET /learning` | Pagination, stable ordering, incident/recommendation/outcome/success/creator/date/confidence filters, and total/returned counts. |
| `GET /learning/{id}` | Learning detail with append-only feedback history. |
| `GET /learning/{id}/history` | Stored chronological creation, application, feedback, ranking, and confidence-change events. |
| `GET /learning/stats` | Evidence-derived completed, successful, partial, failed, and incomplete attempts; rates; confidence; last outcome; timestamps; formula version. |
| `GET /learning/rankings` | Evidence-adjusted ranking using confidence and evidence sufficiency, with deterministic tie-breaking. |

### Confidence and ranking formulas

**Confidence model:** `bayesian-weighted-outcomes-v1`

**Outcome weights:**

| Outcome | Weight |
|---------|-------:|
| success | 1.0 |
| partial success | 0.5 |
| failure | 0.0 |

```
confidence = (prior_confidence × 2 + successes + 0.5 × partial_successes) / (2 + completed_attempts)

ranking_score = confidence_score × min(1, completed_attempts / 3)
```

Behavioral rules from the handoff:

- The prior weight prevents a single result from creating an extreme confidence change.
- Confidence is deterministic, consistently rounded, bounded from zero to one, and stored as before/after values.
- Recommendations with **fewer than three completed attempts** are marked as having **insufficient evidence**.
- Incomplete outcomes are reported separately and **excluded** from completed-attempt rate denominators.
- Application and feedback retries are **idempotent** and do not create duplicate records or audit events.

---

## A.4 Epic 11 — Evaluation Framework

Epic 11 evolved the evaluation API from a completed-only metric runner into a **versioned and traceable lifecycle** with evidence storage, partial and failed states, duplicate protection, filters, and accurate summaries.

### API capabilities

| Endpoint | Enrichment |
|----------|------------|
| `POST /evaluation/run` | Reference validation, running-state creation, evidence collection, metric calculation, null preservation, overall scoring, evidence storage, timing, versioning, and persisted final state. |
| `GET /evaluation` | Stored-data summary with completed, failed, partial, and not-evaluable counts; averages and metric counts calculated from database records. |
| `GET /evaluation/history` | Incident, learning, recommendation, type, status, score, date, and evaluator-version filters; pagination; stable ordering; lightweight rows. |
| `GET /evaluation/{id}` | Full references, status, metrics, overall score, evidence, failure reason, timing, evaluator version, and calculation details. |

---

## A.5 Part A endpoint index (quick list)

| Epic | Method | Path |
|------|--------|------|
| 4 | GET | `/usecases` |
| 4 | GET | `/usecases/search` |
| 4 | POST | `/usecases` |
| 4 | PATCH | `/usecases/{id}` |
| 4 | PATCH | `/usecases/{id}/submit` |
| 4 | PATCH | `/usecases/{id}/approve` |
| 4 | PATCH | `/usecases/{id}/archive` |
| 4 | GET | `/usecases/{id}/versions` |
| 4 | GET/POST | `/usecases/{id}/incidents` |
| 4 | GET | `/usecases/{id}/related` |
| 4 | GET | `/usecases/export` |
| 4 | POST | `/usecases/import` |
| 5 | GET | `/knowledge` |
| 5 | GET | `/knowledge/search` |
| 5 | POST | `/knowledge/ingest` |
| 5 | POST | `/knowledge/upload` |
| 5 | POST | `/knowledge/similar` |
| 5 | POST | `/knowledge/retrieve` |
| 5 | POST | `/knowledge/{id}/reprocess` |
| 5 | POST | `/knowledge/reprocess` |
| 5 | GET | `/knowledge/health/dependencies` |
| 10 | POST | `/learning/apply` |
| 10 | POST | `/learning/{id}/feedback` |
| 10 | GET | `/learning` |
| 10 | GET | `/learning/{id}` |
| 10 | GET | `/learning/{id}/history` |
| 10 | GET | `/learning/stats` |
| 10 | GET | `/learning/rankings` |
| 11 | POST | `/evaluation/run` |
| 11 | GET | `/evaluation` |
| 11 | GET | `/evaluation/history` |
| 11 | GET | `/evaluation/{id}` |

---

# Part B — Control Plane (Epics 7, 13, 14 + execution)

Source: *TDK Epics 7 / 13 / 14 APIs — Dashboard integration handoff* (7 August 2026).

## B.0 Access and integration

### Base URLs

| Consumer | Base URL | Notes |
|----------|----------|-------|
| Developer / VPN client | `http://10.0.65.40:8000` | Use with curl, Postman, or server-side code. **Corrected 2026-08-10** (handoff previously listed `.19:8000` by mistake). |
| Interactive OpenAPI | `http://10.0.65.40:8000/docs` | Browse schemas and try requests while on VPN. |
| OpenAPI JSON | `http://10.0.65.40:8000/openapi.json` | Useful for generated clients and dashboard typing. |
| Dashboard browser | `/control-plane-api/*` | Recommended proxy path; rewrite to port 8000. |
| Container on same VM | `http://host.docker.internal:8000` | Used by Planner/Resolution with host-gateway mapping. |

> **Note:** `http://10.0.65.19:8000` serves **Attu** (Milvus UI), not the Control Plane API. Do not use that host for AI/Agent/Policy/Execution.

### Critical warning

**Do not** append these routes to `http://10.0.65.19:8088/incident-api`. That is the Incident Service proxy. This control-plane API is a **different application on port 8000**.

### Recommended dashboard proxy

The API currently has **no CORS middleware**, so browser code should call it through the same-origin dashboard proxy. Vite-style configuration from the handoff:

```js
'/control-plane-api': {
  target: 'http://10.0.65.40:8000',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/control-plane-api/, ''),
}
```

Example browser call:

```js
fetch('/control-plane-api/ai/health')
```

### Authentication and exposure

- No authentication middleware is currently applied to these routes.
- Keep port **8000** restricted to the private VPN/network.
- Health/catalog GETs are appropriate for the dashboard.
- **Policy-rule mutations** and **execution submission** should be called only from a trusted backend until authentication, authorization, and CSRF protections are added.

---

## B.1 Endpoint inventory

| Owner | Method | Path | What it does | UI use | Current state |
|-------|--------|------|--------------|--------|---------------|
| Epic 13 | GET | `/ai/health` | AI Gateway health probe | System Status | Live |
| Epic 13 | GET | `/ai/models` | List configured model routes and availability | AI Models | Live catalog |
| Epic 13 | GET | `/ai/prompts` | List registered versioned prompt definitions | Prompt Catalog | Live / in memory |
| Epic 13 | GET | `/ai/logs` | Return AI request/response audit summaries | AI Audit | Live / in memory |
| Epic 13 | POST | `/ai/complete` | Validate a prompt request and return a structured completion contract | Workflow only | Live contract / stub output |
| Epic 13 | POST | `/ai/chat` | Structured assistant-message response for a chat request | Workflow only | Live contract / stub output |
| Epic 13 | POST | `/ai/evaluate` | Score a candidate output using the common AI response contract | Workflow only | Deterministic |
| Epic 13 | POST | `/ai/route` | Select the configured model route for a task | Workflow only | Deterministic |
| Epic 7 | GET | `/agent/health` | Agent Intelligence health probe | System Status | Live |
| Epic 7 | POST | `/agent/evaluate-incident` | Whether an incident contains usable identity and signal evidence | Incident analysis | Deterministic |
| Epic 7 | POST | `/agent/evaluate-plan` | Run a canonical plan through semantic, safety, dependency, RBAC, and risk evaluators | Plan decision | Deterministic |
| Epic 7 | POST | `/agent/evaluate-action` | Evaluate one proposed action without a complete plan | Action review | Deterministic |
| Epic 7 | POST | `/agent/rank-recommendations` | Rank candidate actions by approval requirement and risk | Recommendations | Deterministic |
| Epic 7 | POST | `/agent/confidence-score` | Calculate explainable confidence from supplied evidence | Confidence | Deterministic |
| Epic 7 | POST | `/agent/resolve` | Temporary canonical plan, evaluate, policy-check, prepare dry run | Backend workflow | Stub planner adapter / dry run |
| Epic 14 | GET | `/policy/health` | Policy Engine health probe | System Status | Live |
| Epic 14 | GET | `/policy/rules` | List enabled and disabled rules in evaluation order | Policy view | Live / in memory |
| Epic 14 | POST | `/policy/check-action` | Evaluate one proposed action against all active policy rules | Action decision | Deterministic |
| Epic 14 | POST | `/policy/check-plan` | Evaluate a candidate plan via the common policy request | Plan decision | Deterministic |
| Epic 14 | POST | `/policy/check-model` | Evaluate whether a model route/use is permitted | Model governance | Deterministic |
| Epic 14 | POST | `/policy/rules` | Create and activate an in-memory policy rule | Admin only | Live mutation / volatile |
| Epic 14 | PATCH | `/policy/rules/{rule_id}` | Partially update an existing in-memory rule | Admin only | Live mutation / volatile |
| Integration | GET | `/execution/health` | Execution Proxy health and configured mode | System Status | Live |
| Integration | POST | `/execution/submit` | Validate and safely simulate an approved Resolution execution request | Backend only | SAFE_SIMULATION |

---

## B.2 Epic 13 — AI Platform / AI Gateway

Central contract for model routing, prompt metadata, completions, chat, output evaluation, and request audit logs. The HTTP contracts are live; **inference currently returns deterministic stub-local output and does not call an external LLM**.

### `GET /ai/health`

| Field | Value |
|-------|-------|
| Purpose | AI Gateway health probe |
| Dashboard | System Status |
| State | Live |
| Request | No body |
| Response | `status`, `service` |

Representative response:

```json
{"status":"ok","service":"ai"}
```

**Implementation note:** Use for a dashboard health card. A successful response confirms the API route, **not** external model availability.

### `GET /ai/models`

| Field | Value |
|-------|-------|
| Purpose | List configured model routes and availability |
| Dashboard | AI Models |
| State | Live catalog |
| Request | No body |
| Response | Array of `{name, provider, available}` |

Representative response:

```json
[
  {"name":"stub-local","provider":"local","available":true},
  {"name":"gpt-5-mini","provider":"openai","available":false}
]
```

**Implementation note:** Authoritative way for the UI to show which model route is currently usable.

### `GET /ai/prompts`

| Field | Value |
|-------|-------|
| Purpose | List registered versioned prompt definitions |
| Dashboard | Prompt Catalog |
| State | Live / in memory |
| Request | No body |
| Response | Array of `PromptMetadata`: `prompt_id`, `name`, `purpose`, `version`, `model_preference`, `templates`, `required_inputs`, `output_schema`, timestamps |

**Implementation note:** Built-in prompt IDs are `incident_summary_v1` and `plan_evaluation_v1`. Registry contents are initialized when the API starts.

### `GET /ai/logs`

| Field | Value |
|-------|-------|
| Purpose | Return AI request/response audit summaries |
| Dashboard | AI Audit |
| State | Live / in memory |
| Request | No body. **No filters or pagination** currently |
| Response | Array of `AIRequestLog`: `request_id`, `component_name`, `prompt_id`/`version`, `model`, `input_summary`, `output_summary`, `latency_ms`, `status`, `error_message`, `created_at` |

**Implementation note:** Logs reset when the API container restarts. Input/output summaries are truncated to **500 characters**.

### `POST /ai/complete`

| Field | Value |
|-------|-------|
| Purpose | Validate a prompt request and return a structured completion contract |
| Dashboard | Workflow only |
| State | Live contract / stub output |
| Request | `component_name` (required), `prompt_id` (required), `inputs` object (default `{}`), `model` (optional) |
| Response | `AIResponse`: `request_id`, `model`, `output` object, `status` |

Example request:

```json
{
  "component_name": "planner",
  "prompt_id": "incident_summary_v1",
  "inputs": {
    "incident": {
      "incident_id": "INC-001",
      "title": "High CPU"
    }
  }
}
```

Representative response:

```json
{
  "request_id": "<uuid>",
  "model": "stub-local",
  "output": {
    "text": "Stub completion response.",
    "prompt_id": "incident_summary_v1",
    "inputs": {
      "incident": {
        "incident_id": "INC-001",
        "title": "High CPU"
      }
    }
  },
  "status": "SUCCESS"
}
```

**Implementation note:** Unknown prompt IDs or missing required inputs return **HTTP 422**. An explicitly supplied model name is **metadata today**; it does not invoke that provider.

### `POST /ai/chat`

| Field | Value |
|-------|-------|
| Purpose | Structured assistant-message response for a chat request |
| Dashboard | Workflow only |
| State | Live contract / stub output |
| Request | `component_name`, `prompt_id`, `messages[{role, content}]`, `model` (optional) |
| Response | `AIResponse`; `output` contains `message{role, content}` and `message_count` |

Example request:

```json
{
  "component_name": "dashboard",
  "prompt_id": "incident_summary_v1",
  "messages": [{"role": "user", "content": "Summarize INC-001"}]
}
```

**Implementation note:** Unknown prompt IDs return **HTTP 422**. Current assistant content is a deterministic stub response.

### `POST /ai/evaluate`

| Field | Value |
|-------|-------|
| Purpose | Score a candidate output using the common AI response contract |
| Dashboard | Workflow only |
| State | Deterministic |
| Request | `component_name`, `prompt`, `candidate` (all required strings) |
| Response | `AIResponse`; `output` contains `score`, `verdict`, `candidate` |

Example request:

```json
{
  "component_name": "planner",
  "prompt": "Evaluate this plan",
  "candidate": "Inspect the affected node"
}
```

**Implementation note:** Current result is deterministic: **score 0.75** and verdict `stub_evaluation_passed`.

### `POST /ai/route`

| Field | Value |
|-------|-------|
| Purpose | Select the configured model route for a task |
| Dashboard | Workflow only |
| State | Deterministic |
| Request | `component_name` and `task` (required strings) |
| Response | `AIResponse`; `output` contains `selected_model` and `routing_reason` |

Example request:

```json
{"component_name":"planner","task":"incident analysis"}
```

**Implementation note:** Currently always selects `stub-local`.

---

## B.3 Epic 7 — Agent Intelligence Layer

Canonical incident, plan, action, evaluation, recommendation-ranking, confidence, safety, dependency, risk, and RBAC contracts. These endpoints are **deterministic** and are already consumed by the Planner.

### `GET /agent/health`

| Field | Value |
|-------|-------|
| Purpose | Agent Intelligence health probe |
| Dashboard | System Status |
| State | Live |
| Response | `status`, `service` |

```json
{"status":"ok","service":"agent"}
```

### `POST /agent/evaluate-incident`

| Field | Value |
|-------|-------|
| Purpose | Determine whether an incident contains usable identity and signal evidence |
| Dashboard | Incident analysis |
| State | Deterministic |
| Request | `IncidentContext`. Required: `incident_id`, `title`, `description`, `tenant_id`. Optional/defaulted: `severity`, `status`, `asset_ids`, `signals`, `metadata`, `created_at` |
| Response | `EvaluationResult`: `accepted`, `evaluator`, `score`, `reasons`, `evidence`, `risk`, `created_at` |

Example request:

```json
{
  "incident_id": "INC-001",
  "title": "High CPU",
  "description": "CPU exceeded 95%",
  "severity": "high",
  "tenant_id": "tdk",
  "asset_ids": ["node-01"],
  "signals": [{"metric": "cpu_usage", "value": 97}]
}
```

**Implementation note:** Rejects when signals are empty or `tenant_id` is absent. Accepted score increases with signal count and is capped at **0.9**.

### `POST /agent/evaluate-plan`

| Field | Value |
|-------|-------|
| Purpose | Run a canonical plan through semantic, safety, dependency, RBAC, and risk evaluators |
| Dashboard | Plan decision |
| State | Deterministic |
| Request | `CandidatePlan`. Required: `plan_id`, `actions[]`, `objective`. Optional: `incident_id`, `risk`, `metadata`, `rbac`, `signatures` |
| Response | `EvaluationResult` with `accepted`, pipeline score, reasons, and normalized risk |

Example request:

```json
{
  "plan_id": "PLAN-001",
  "incident_id": "INC-001",
  "objective": "Investigate high CPU",
  "actions": [{
    "action_id": "A-1",
    "name": "investigate",
    "description": "Inspect CPU evidence",
    "estimated_risk": "LOW"
  }],
  "metadata": {"tenant_id": "tdk"},
  "rbac": {"roles": ["operator"]}
}
```

**Implementation note:** This is the Agent endpoint used by the **deployed Planner integration**.

### `POST /agent/evaluate-action`

| Field | Value |
|-------|-------|
| Purpose | Evaluate one proposed action without requiring a complete plan |
| Dashboard | Action review |
| State | Deterministic |
| Request | `CandidateAction`: `action_id`, `name`, `description`; optional `params`, `dependencies`, `estimated_risk`, `requires_approval`, `metadata` |
| Response | `EvaluationResult` from the action evaluator pipeline |

Example request:

```json
{
  "action_id": "A-1",
  "name": "investigate",
  "description": "Inspect node health",
  "estimated_risk": "LOW",
  "requires_approval": false
}
```

**Implementation note:** The standalone action path **skips** the plan-level identity/RBAC evaluator.

### `POST /agent/rank-recommendations`

| Field | Value |
|-------|-------|
| Purpose | Rank candidate actions by approval requirement and risk |
| Dashboard | Recommendations |
| State | Deterministic |
| Request | Object containing `actions[]`, each using the `CandidateAction` schema |
| Response | `RecommendationRanking`: `recommendations[{action_id, score, rank, reasons}]`, `ranking_method`, `created_at` |

Example request:

```json
{
  "actions": [
    {
      "action_id": "A-1",
      "name": "inspect",
      "description": "Read health",
      "estimated_risk": "LOW"
    },
    {
      "action_id": "A-2",
      "name": "remediation",
      "description": "Apply change",
      "estimated_risk": "HIGH",
      "requires_approval": true
    }
  ]
}
```

**Implementation note:** Low-risk actions that do not require approval rank first. Scores decrease by **0.1** per rank, with a **0.1** floor.

### `POST /agent/confidence-score`

| Field | Value |
|-------|-------|
| Purpose | Calculate explainable confidence from supplied evidence |
| Dashboard | Confidence |
| State | Deterministic |
| Request | At least one of `incident`, `plan`, or `action` is required; `evidence[]` is optional |
| Response | `score`, `level`, `reasons` |

Example request:

```json
{
  "action": {
    "action_id": "A-1",
    "name": "inspect",
    "description": "Inspect node"
  },
  "evidence": [
    {"source": "metric"},
    {"source": "timeline"},
    {"source": "asset"}
  ]
}
```

**Implementation note:** Score is `0.5 + 0.1` per evidence item, capped at **0.9**. Level is **HIGH** at **0.75** or above; otherwise **MEDIUM**.

### `POST /agent/resolve`

| Field | Value |
|-------|-------|
| Purpose | Generate a temporary canonical plan, evaluate it, policy-check it, and prepare a dry run |
| Dashboard | Backend workflow |
| State | Stub planner adapter / dry run |
| Request | `user_intent` (required) and `context` object. Recommended context: `incident_id`, `plan_id`, `tenant_id`, `user_id`, `roles`, `resource`, `evidence_complete`, `action_name`, `estimated_risk`, `requires_approval`, `policy_context` |
| Response | Variant object with `status`, `plan`, `reasons` and/or `policy_decision`; allowed paths also include `execution_result` in `DRY_RUN` mode |

Example request:

```json
{
  "user_intent": "Investigate high CPU",
  "context": {
    "incident_id": "INC-001",
    "tenant_id": "tdk",
    "user_id": "operator-1",
    "roles": ["operator"],
    "resource": "node-01",
    "evidence_complete": true
  }
}
```

**Implementation note:** Still uses the temporary **ArpAdapter** to generate one investigate action. The cross-repo Planner uses **`/agent/evaluate-plan` directly** instead. **No infrastructure is executed.**

---

## B.4 Epic 14 — Policy Engine

Fail-closed policy decisions for actions, plans, and model use, with identity, evidence, risk, approval, destructive-action, and audit metadata. Rules and runtime edits are currently held **in memory**.

### `GET /policy/health`

```json
{"status":"ok","service":"policy"}
```

Use for the Policy service health card.

### `GET /policy/rules`

| Field | Value |
|-------|-------|
| Purpose | List enabled and disabled rules in evaluation order |
| Dashboard | Policy view |
| State | Live / in memory |
| Response | Array of `PolicyRule` with `rule_id`, `name`, `description`, `rule_type`, `enabled`, `priority`, `conditions`, `outcome`, `risk_level`, approver/audit fields, timestamps |

**Implementation note:** **Six** built-in rules are recreated at startup. Runtime-created or edited rules are **lost when the API restarts**.

### `POST /policy/check-action`

| Field | Value |
|-------|-------|
| Purpose | Evaluate one proposed action against all active policy rules |
| Dashboard | Action decision |
| State | Deterministic |
| Request | `PolicyCheckRequest`: `component_name`, `tenant_id`, `user_id`; `roles[]`, `resource`, `action`, `model`, `context` |
| Response | `PolicyDecisionResponse`: `decision`, `reason`, `policy_id`, `risk_level`, `required_approver`, `audit_required`, `created_at` |

Example request:

```json
{
  "component_name": "agent",
  "tenant_id": "tdk",
  "user_id": "operator-1",
  "roles": ["operator"],
  "resource": "node-01",
  "action": "investigate",
  "context": {
    "risk_level": "LOW",
    "evidence_complete": true
  }
}
```

Representative response:

```json
{
  "decision": "ALLOWED",
  "reason": "Allow evidence-backed, read-only investigation actions.",
  "policy_id": "<rule-uuid>",
  "risk_level": "LOW",
  "required_approver": null,
  "audit_required": true,
  "created_at": "<timestamp>"
}
```

**Implementation note:** Missing tenant/user/roles adds a **human-review** decision. Destructive operations are **denied**. High-risk or remediation actions **require approval**.

### `POST /policy/check-plan`

| Field | Value |
|-------|-------|
| Purpose | Evaluate a candidate plan via the common policy request |
| Dashboard | Plan decision |
| State | Deterministic |
| Request | Same `PolicyCheckRequest` schema. Put `risk_level` and `evidence_complete` in `context`; `action` normally represents the leading plan action |
| Response | `PolicyDecisionResponse` |

**Implementation note:** Uses the same rule engine as check-action but labels the decision reason as a **plan** result when multiple conditions match. Used by the deployed Planner.

### `POST /policy/check-model`

| Field | Value |
|-------|-------|
| Purpose | Evaluate whether a model route/use is permitted |
| Dashboard | Model governance |
| State | Deterministic |
| Request | Same `PolicyCheckRequest`; supply `model` and relevant context |
| Response | `PolicyDecisionResponse` |

Example request:

```json
{
  "component_name": "ai-gateway",
  "tenant_id": "tdk",
  "user_id": "service-ai",
  "roles": ["service"],
  "model": "stub-local",
  "context": {
    "risk_level": "LOW",
    "evidence_complete": true
  }
}
```

**Implementation note:** No model-specific allow rule is built in yet, so unmatched requests **fail closed to human review** unless a matching rule is added.

### `POST /policy/rules`

| Field | Value |
|-------|-------|
| Purpose | Create and activate an in-memory policy rule |
| Dashboard | Admin only |
| State | Live mutation / volatile |
| Request | `PolicyRuleCreate`: `name`, `description`, `rule_type`; optional `enabled`, `priority`, `conditions`, `outcome`, `risk_level`, `required_approver`, `audit_required`. **`outcome` is required.** |
| Response | Created `PolicyRule` including generated `rule_id` and timestamps |

Example request:

```json
{
  "name": "Approve medium-risk changes",
  "description": "Require an operations approver.",
  "rule_type": "risk",
  "priority": 15,
  "conditions": {"risk_level": "MEDIUM"},
  "outcome": "REQUIRES_APPROVAL",
  "risk_level": "MEDIUM",
  "required_approver": "operations_manager"
}
```

**Implementation note:** Do **not** expose this directly in a browser UI until authentication and authorization are added. The rule is **not persisted** across restarts.

### `PATCH /policy/rules/{rule_id}`

| Field | Value |
|-------|-------|
| Purpose | Partially update an existing in-memory rule |
| Dashboard | Admin only |
| State | Live mutation / volatile |
| Request | Any mutable `PolicyRuleUpdate` fields: `name`, `description`, `enabled`, `priority`, `conditions`, `outcome`, `risk_level`, `required_approver`, `audit_required` |
| Response | Updated `PolicyRule`; **HTTP 404** when `rule_id` is unknown |

Example request:

```json
{"enabled": false}
```

**Implementation note:** There is currently **no** `GET`-by-ID or `DELETE` rule endpoint.

---

## B.5 Integration support — Safe Execution Boundary

Contract added to connect Resolution to the Data Pipeline boundary. It intentionally accepts or rejects requests in **`SAFE_SIMULATION`** mode and **never changes infrastructure**.

### `GET /execution/health`

| Field | Value |
|-------|-------|
| Purpose | Show Execution Proxy health and configured mode |
| Dashboard | System Status |
| State | Live |
| Response | `status`, `service`, `mode` |

```json
{"status":"ok","service":"execution-proxy","mode":"SAFE_SIMULATION"}
```

**Implementation note:** The mode **must be displayed** so users do not mistake simulated results for real execution.

### `POST /execution/submit`

| Field | Value |
|-------|-------|
| Purpose | Validate and safely simulate an approved Resolution execution request |
| Dashboard | Backend only |
| State | SAFE_SIMULATION |
| Request | Required: `execution_id`, `incident_id`, `plan_id`, `ordered_actions[]`. Optional/defaulted: `rollback_actions`, `approval_requirements`, `execution_constraints`, `priority`, `status`, `approval_granted`, `approved_by`, `approval_comment`. Each action requires `action_id`, `step_number >= 1`, `action_type`, `name`, `description` |
| Response | `ExecutionSubmissionResult`: `accepted`, `execution_id`, `status`, `mode`, `message`, `validation_status`, `rollback_status`, `action_results` |

Example request:

```json
{
  "execution_id": "EXEC-001",
  "incident_id": "INC-001",
  "plan_id": "PLAN-001",
  "ordered_actions": [{
    "action_id": "validate-1",
    "step_number": 1,
    "action_type": "validation",
    "name": "validate-node-health",
    "target": "node-01",
    "description": "Validate node health in safe simulation",
    "expected_result": "Health check passes"
  }],
  "approval_requirements": ["operations_manager"],
  "approval_granted": true,
  "approved_by": "ops-admin"
}
```

Representative response:

```json
{
  "accepted": true,
  "execution_id": "EXEC-001",
  "status": "submitted",
  "mode": "SAFE_SIMULATION",
  "message": "Execution request completed as an explicit safe simulation; no infrastructure was changed.",
  "validation_status": "SIMULATED_PASS",
  "rollback_status": "SIMULATED_NOT_AVAILABLE",
  "action_results": [{
    "action_id": "validate-1",
    "status": "SIMULATED",
    "target": "node-01",
    "expected_result": "Health check passes"
  }]
}
```

**Implementation note:** Rejects non-pending submissions, missing required approval evidence, and destructive terms such as `delete` / `destroy` / `drop` / `format` / `purge` / `wipe`. Idempotency is held **in memory** by `execution_id`. **No GET execution-history endpoint** exists yet.

---

## B.6 Suggested TDK dashboard wiring

| Dashboard area | Endpoint(s) | Recommended display |
|----------------|-------------|---------------------|
| System Status | `GET /ai/health`, `GET /agent/health`, `GET /policy/health`, `GET /execution/health` | Four service cards; always show Execution **mode**. |
| AI Models | `GET /ai/models` | Model, provider, availability badge. |
| Prompt Catalog | `GET /ai/prompts` | Prompt name, version, purpose, preferred model, required inputs. |
| AI Audit | `GET /ai/logs` | Component, prompt/model, latency, status, timestamp. Mark as **restart-volatile**. |
| Agent Evaluation | `POST /agent/evaluate-incident`, `POST /agent/evaluate-plan`, `POST /agent/evaluate-action` | Accepted/rejected, score, reasons, risk, evidence. |
| Recommendations | `POST /agent/rank-recommendations`, `POST /agent/confidence-score` | Rank, score, reasons, confidence explanation. |
| Policy | `GET /policy/rules`, `POST /policy/check-*` | Rule inventory and decision: allowed, denied, approval/review/evidence required. |
| Execution | `GET /execution/health`, `POST /execution/submit` | Mode and immediate simulation result. **Do not** label as real execution. |

---

## B.7 Known limitations and API gaps

- AI `complete` / `chat` / `evaluate` / `route` use **stub-local** output; no live LLM provider is connected.
- AI logs, Policy rules/edits, and Execution idempotency records are **in memory** and reset after an API restart.
- `GET /ai/logs` has no filtering, pagination, or single-request lookup.
- Policy has no `GET /rules/{id}`, `DELETE /rules/{id}`, persistent rule store, or authenticated admin boundary.
- Execution has no GET list/detail/history endpoint. The POST result is immediate and simulated.
- Agent evaluation and recommendation results are **not persisted** and have no history endpoints.
- Agent `/resolve` still uses a temporary deterministic plan adapter. The integrated Planner calls `/agent/evaluate-plan` instead.
- The API does not currently enable browser CORS; the dashboard should use a server/Vite proxy.
- No authentication middleware is applied. Keep the API on the private network and do not expose mutation routes publicly.
- The broader Planner currently generates network-focused plans even for some unrelated incident types; that is a **Planner generator gap**, not an Agent/Policy contract failure.

---

## B.8 Quick validation commands (for later testing)

Documented from the handoff. **Not executed as part of this write-up.**

```bash
BASE=http://10.0.65.40:8000

curl -fsS $BASE/health
curl -fsS $BASE/ai/health
curl -fsS $BASE/agent/health
curl -fsS $BASE/policy/health
curl -fsS $BASE/execution/health
curl -fsS $BASE/ai/models | python3 -m json.tool
curl -fsS $BASE/ai/prompts | python3 -m json.tool
curl -fsS $BASE/policy/rules | python3 -m json.tool
```

VPN required.

---

# Cross-references

This handoff doc does **not** replace existing destats references:

| Doc | Role |
|-----|------|
| [INCIDENT_API.md](INCIDENT_API.md) | Working Incident Service API reference used by the portal |
| [LIVE_API_RESPONSE_AUDIT.md](LIVE_API_RESPONSE_AUDIT.md) | Live GET samples + UI shown vs unused fields |
| [LIVE_INCIDENT_API_VERIFICATION.md](LIVE_INCIDENT_API_VERIFICATION.md) | Earlier live `:8003` verification notes |
| [EPIC_4_5_10_11_API_TEST_REPORT.md](EPIC_4_5_10_11_API_TEST_REPORT.md) | Prior smoke-test report for Epic 4/5/10/11 |
| [PLATFORM_API_UI_MAP.md](PLATFORM_API_UI_MAP.md) | Platform API → UI map |
| [INCIDENT_API_BACKEND_GAPS.md](INCIDENT_API_BACKEND_GAPS.md) | Backend gaps / acceptance asks |

## Follow-ups (deferred)

1. VPN live-test Control Plane on `http://10.0.65.40:8000` (confirmed healthy 2026-08-10).  
2. Re-audit Incident Service enriched filters/pagination envelopes against Part A.  
3. Wire destats `/control-plane-api` Vite + Nginx proxy and System Status cards for AI/Agent/Policy/Execution.

**Live verification (2026-08-09):** see [DEVELOPER_API_LIVE_AUDIT.md](DEVELOPER_API_LIVE_AUDIT.md).  
