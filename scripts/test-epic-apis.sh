#!/usr/bin/env bash
# Smoke-test Epic 4/5/10/11 APIs (Use Case, Knowledge, Learning, Evaluation).
# Usage:
#   bash scripts/test-epic-apis.sh
#   EPIC_RUN_WRITES=1 bash scripts/test-epic-apis.sh
#
# Defaults target Rayaan's gateway on the TDK destats host.
set -euo pipefail

BASE="${EPIC_API_BASE:-http://10.0.65.19:8088/incident-api}"
TOKEN="${EPIC_API_TOKEN:-}"
INCIDENT_ID="${EPIC_INCIDENT_ID:-e94c2c19-7bc5-4448-ae0b-5b94fb4ff6b9}"
USECASE_ID="${EPIC_USECASE_ID:-1}"
LEARNING_ID="${EPIC_LEARNING_ID:-LRN-749118C28398}"
EVAL_ID="${EPIC_EVALUATION_ID:-EVAL-16A48330386F}"
KNOWLEDGE_ID="${EPIC_KNOWLEDGE_ID:-}"
RUN_WRITES="${EPIC_RUN_WRITES:-0}"
TS=$(date -u +%Y%m%dT%H%M%SZ 2>/dev/null || echo "test")

PASS=0
FAIL=0
SKIP=0
REQUEST_LAST_BODY=""

BASE="${BASE%/}"

is_json() {
  local body="$1"
  echo "$body" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null
}

is_html() {
  local body="$1"
  echo "$body" | head -c 20 | grep -qi '<!doctype\|<html'
}

curl_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local -a extra=(-H "Accept: application/json")
  if [[ -n "$TOKEN" ]]; then
    extra+=(-H "Authorization: Bearer ${TOKEN}")
  fi
  if [[ "$method" == "GET" ]]; then
    curl -sS -w "\n__HTTP__%{http_code}" "${extra[@]}" "$url"
  else
    curl -sS -w "\n__HTTP__%{http_code}" -X "$method" "${extra[@]}" \
      -H "Content-Type: application/json" \
      -d "$body" "$url"
  fi
}

# Accept any 2xx as success for flexible backends (200 or 201)
request() {
  local method="$1"
  local path="$2"
  local _expected="${3:-200}"  # kept for call-site compatibility
  local body="${4:-}"
  local url="${BASE}${path}"

  local response status resp_body
  response=$(curl_json "$method" "$url" "$body") || response=$'\n__HTTP__000'

  status=$(printf '%s\n' "$response" | tail -n1 | sed 's/__HTTP__//')
  resp_body=$(printf '%s\n' "$response" | sed '$d')
  REQUEST_LAST_BODY="$resp_body"

  local ok=0
  local note=""

  if is_html "$resp_body"; then
    note="got HTML (SPA/wrong host — not JSON API)"
    ok=0
  elif [[ "$status" =~ ^2 ]] && is_json "$resp_body"; then
    ok=1
    note="JSON OK"
  elif [[ "$status" =~ ^2 ]]; then
    note="HTTP OK but body is not JSON"
    ok=0
  else
    note="expected 2xx, got ${status}"
    ok=0
  fi

  if [[ $ok -eq 1 ]]; then
    PASS=$((PASS + 1))
    echo "PASS  ${method} ${path}  (HTTP ${status})"
    echo "$resp_body" | head -c 220
    echo ""
  else
    FAIL=$((FAIL + 1))
    echo "FAIL  ${method} ${path}  (HTTP ${status}) — ${note}"
    echo "$resp_body" | head -c 300
    echo ""
  fi
  echo "---"
}

get_last_body() {
  echo "$REQUEST_LAST_BODY"
}

skip() {
  local method="$1"
  local path="$2"
  local reason="$3"
  SKIP=$((SKIP + 1))
  echo "SKIP  ${method} ${path} — ${reason}"
  echo "---"
}

echo "Epic 4/5/10/11 API smoke test"
echo "Base: ${BASE}"
echo "Writes: ${RUN_WRITES}"
echo ""

echo "=== Phase 1: GET endpoints ==="
request GET "/health"
request GET "/usecases"; get_last_body > /tmp/epic_usecases.json || true
request GET "/usecases/search?q=capacity"
request GET "/usecases/export"
request GET "/usecases/${USECASE_ID}"
request GET "/usecases/${USECASE_ID}/versions"
request GET "/usecases/${USECASE_ID}/incidents"
request GET "/usecases/${USECASE_ID}/related"

request GET "/knowledge"; get_last_body > /tmp/epic_knowledge.json || true
request GET "/knowledge/search?q=runbook"

request GET "/learning"; get_last_body > /tmp/epic_learning.json || true
request GET "/learning/stats"
request GET "/learning/rankings"
request GET "/learning/incident/${INCIDENT_ID}"
request GET "/learning/${LEARNING_ID}"

request GET "/evaluation"
request GET "/evaluation/history"
request GET "/evaluation/${EVAL_ID}"

# Incident side-check (same gateway)
request GET "/incidents/stats"
request GET "/incidents"

if [[ -z "$KNOWLEDGE_ID" ]] && [[ -f /tmp/epic_knowledge.json ]]; then
  KNOWLEDGE_ID=$(python3 -c "
import json
try:
  d=json.load(open('/tmp/epic_knowledge.json'))
  items=d if isinstance(d,list) else d.get('knowledge',d.get('items',d.get('records',[])))
  print(items[0].get('knowledge_id', items[0].get('id','')) if items else '')
except Exception:
  print('')
" 2>/dev/null || echo "")
fi

if [[ -n "$KNOWLEDGE_ID" ]]; then
  request GET "/knowledge/${KNOWLEDGE_ID}"
else
  skip GET "/knowledge/{id}" "knowledge repo empty / no EPIC_KNOWLEDGE_ID"
fi

echo ""
echo "=== Phase 2: POST/PATCH endpoints ==="

if [[ "$RUN_WRITES" != "1" ]]; then
  echo "Skipping writes (set EPIC_RUN_WRITES=1 to enable)"
  echo "Or run: bash scripts/test-epic-writes.sh"
  SKIP=$((SKIP + 13))
else
  request POST "/knowledge/retrieve" "200" \
    '{"query":"aggregate utilization exceeded threshold","limit":5}'

  request POST "/learning/apply" "200" \
    '{"recommendations":[{"recommendation":"Expand aggregate capacity and verify utilization","confidence":0.75},{"recommendation":"Review storage utilization and investigate the affected resource","confidence":0.65}]}'

  request POST "/evaluation/run" "200" \
    '{"learning_id":"LRN-749118C28398","evaluation_type":"learning_outcome","retrieved_items":5,"relevant_retrieved_items":4,"total_known_relevant_items":5,"user_feedback_score":0.9,"response_time_ms":420,"response_time_threshold_ms":1000,"created_by":"usman-smoke"}'

  request POST "/usecases" "200" \
    "{\"title\":\"usman-smoke-uc-${TS}\",\"description\":\"smoke\",\"problem\":\"smoke\",\"environment\":\"lab\",\"category\":\"capacity\",\"status\":\"draft\"}"
  get_last_body > /tmp/epic_uc_created.json || true
  NEW_UC_ID=$(python3 -c "import json; d=json.load(open('/tmp/epic_uc_created.json')); print(d.get('id') or d.get('usecase_id') or '')" 2>/dev/null || echo "")

  request POST "/knowledge" "200" \
    "{\"title\":\"usman-smoke-kn-${TS}\",\"content\":\"Smoke knowledge about NetApp aggregate capacity thresholds.\",\"tags\":[\"smoke-test\"]}"
  get_last_body > /tmp/epic_kn_created.json || true
  NEW_KN_ID=$(python3 -c "
import json
d=json.load(open('/tmp/epic_kn_created.json'))
item=d.get('knowledge_item') or d
print(item.get('id') or item.get('knowledge_id') or d.get('id') or '')
" 2>/dev/null || echo "")

  request POST "/knowledge/ingest" "200" \
    "{\"title\":\"usman-smoke-ingest-${TS}\",\"content\":\"Ingested smoke test runbook for capacity.\",\"type\":\"runbook\"}"

  request POST "/knowledge/similar" "200" '{"query":"storage capacity","limit":3}'

  request POST "/learning" "200" \
    "{\"incident_id\":\"INC-SMOKE-${TS}\",\"usecase_id\":1,\"recommendation\":\"Smoke expand capacity\",\"outcome\":\"success\",\"notes\":\"smoke ${TS}\"}"
  get_last_body > /tmp/epic_lr_created.json || true
  NEW_LR_ID=$(python3 -c "
import json
d=json.load(open('/tmp/epic_lr_created.json'))
rec=d.get('learning_record') or d
print(rec.get('learning_id') or d.get('learning_id') or '')
" 2>/dev/null || echo "")

  echo "Created IDs: usecase=${NEW_UC_ID:-none} knowledge=${NEW_KN_ID:-none} learning=${NEW_LR_ID:-none}"

  if [[ -n "${NEW_UC_ID}" ]]; then
    request PATCH "/usecases/${NEW_UC_ID}" "200" '{"description":"Updated by usman smoke test"}'
    request PATCH "/usecases/${NEW_UC_ID}/submit" "200" '{}'
    request PATCH "/usecases/${NEW_UC_ID}/approve" "200" '{}'
    request GET "/usecases/${NEW_UC_ID}"
  fi

  if [[ -n "${NEW_KN_ID}" ]]; then
    request GET "/knowledge/${NEW_KN_ID}"
    request POST "/knowledge/${NEW_KN_ID}/reprocess" "200" '{}'
  fi

  if [[ -n "${NEW_LR_ID}" ]]; then
    request GET "/learning/${NEW_LR_ID}"
    request POST "/learning/${NEW_LR_ID}/feedback" "200" \
      '{"success":true,"rating":5,"comment":"smoke test feedback"}'
  fi

  skip POST "/usecases/import" "needs test file from Rayaan"
  skip POST "/knowledge/reprocess" "skipped — reprocesses all embeddings (heavy)"
  skip POST "/knowledge/upload" "skipped — needs multipart .txt/.md file"
fi

echo ""
echo "Results: ${PASS} passed, ${FAIL} failed, ${SKIP} skipped"
if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
