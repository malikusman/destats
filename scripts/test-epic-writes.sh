#!/usr/bin/env bash
# Epic 4/5/10/11 POST/PATCH smoke tests (Rayaan live API).
# Run in your own terminal (VPN on), then paste the full output back to Cursor.
#
#   bash scripts/test-epic-writes.sh
#
set -u

BASE="${EPIC_API_BASE:-http://10.0.65.19:8088/incident-api}"
BASE="${BASE%/}"
TS="$(date -u +%Y%m%dT%H%M%SZ 2>/dev/null || echo test)"

PASS=0
FAIL=0
SKIP=0
LAST_BODY=""

hr() { echo "----------------------------------------"; }

check() {
  local name="$1"
  local method="$2"
  local path="$3"
  shift 3
  local url="${BASE}${path}"
  local response status body

  echo "TEST  ${name}"
  echo "      ${method} ${url}"

  if [[ $# -gt 0 ]]; then
    response=$(curl -sS -w "\n__HTTP__%{http_code}" -X "$method" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      "$@" \
      "$url" 2>&1) || true
  else
    response=$(curl -sS -w "\n__HTTP__%{http_code}" -X "$method" \
      -H "Accept: application/json" \
      "$url" 2>&1) || true
  fi

  status=$(printf '%s\n' "$response" | tail -n1 | sed 's/__HTTP__//')
  body=$(printf '%s\n' "$response" | sed '$d')
  LAST_BODY="$body"

  if [[ "$status" =~ ^2 ]]; then
    echo "PASS  HTTP ${status}"
    PASS=$((PASS + 1))
  else
    echo "FAIL  HTTP ${status}"
    FAIL=$((FAIL + 1))
  fi
  printf '%s\n' "$body" | python3 -m json.tool 2>/dev/null | head -n 40 \
    || printf '%s\n' "$body" | head -c 500
  echo ""
  hr
}

echo "Epic 4/5/10/11 WRITE smoke test"
echo "Base: ${BASE}"
echo "Timestamp: ${TS}"
hr

# --- Rayaan-provided sample POSTs ---
check "POST /knowledge/retrieve" POST "/knowledge/retrieve" \
  -d '{"query":"aggregate utilization exceeded threshold","limit":5}'

check "POST /learning/apply" POST "/learning/apply" \
  -d '{"recommendations":[{"recommendation":"Expand aggregate capacity and verify utilization","confidence":0.75},{"recommendation":"Review storage utilization and investigate the affected resource","confidence":0.65}]}'

check "POST /evaluation/run" POST "/evaluation/run" \
  -d '{"learning_id":"LRN-749118C28398","evaluation_type":"learning_outcome","retrieved_items":5,"relevant_retrieved_items":4,"total_known_relevant_items":5,"user_feedback_score":0.9,"response_time_ms":420,"response_time_threshold_ms":1000,"created_by":"usman-smoke"}'

# --- Create flows ---
check "POST /usecases (create)" POST "/usecases" \
  -d "{\"title\":\"usman-smoke-uc-${TS}\",\"description\":\"smoke\",\"problem\":\"smoke\",\"environment\":\"lab\",\"category\":\"capacity\",\"status\":\"draft\"}"

NEW_UC_ID=$(printf '%s' "$LAST_BODY" | python3 -c "import sys,json
try:
 d=json.load(sys.stdin); print(d.get('id') or d.get('usecase_id') or '')
except Exception: print('')" 2>/dev/null)

check "POST /knowledge (create)" POST "/knowledge" \
  -d "{\"title\":\"usman-smoke-kn-${TS}\",\"content\":\"Smoke knowledge about NetApp aggregate capacity thresholds.\",\"tags\":[\"smoke-test\"]}"

NEW_KN_ID=$(printf '%s' "$LAST_BODY" | python3 -c "import sys,json
try:
 d=json.load(sys.stdin)
 item=d.get('knowledge_item') or d
 print(item.get('id') or item.get('knowledge_id') or d.get('id') or '')
except Exception: print('')" 2>/dev/null)

check "POST /knowledge/ingest" POST "/knowledge/ingest" \
  -d "{\"title\":\"usman-smoke-ingest-${TS}\",\"content\":\"Ingested smoke test runbook for capacity.\",\"type\":\"runbook\"}"

check "POST /knowledge/similar" POST "/knowledge/similar" \
  -d '{"query":"storage capacity","limit":3}'

check "POST /learning (create)" POST "/learning" \
  -d "{\"incident_id\":\"INC-SMOKE-${TS}\",\"usecase_id\":1,\"recommendation\":\"Smoke expand capacity\",\"outcome\":\"success\",\"notes\":\"smoke ${TS}\"}"

NEW_LR_ID=$(printf '%s' "$LAST_BODY" | python3 -c "import sys,json
try:
 d=json.load(sys.stdin)
 rec=d.get('learning_record') or d
 print(rec.get('learning_id') or d.get('learning_id') or '')
except Exception: print('')" 2>/dev/null)

echo "Created IDs: usecase=${NEW_UC_ID:-none} knowledge=${NEW_KN_ID:-none} learning=${NEW_LR_ID:-none}"
hr

# --- PATCH workflow on new use case (not seed id=1) ---
if [[ -n "${NEW_UC_ID}" ]]; then
  check "PATCH /usecases/{id}" PATCH "/usecases/${NEW_UC_ID}" \
    -d '{"description":"Updated by usman smoke test"}'
  check "PATCH /usecases/{id}/submit" PATCH "/usecases/${NEW_UC_ID}/submit" -d '{}'
  check "PATCH /usecases/{id}/approve" PATCH "/usecases/${NEW_UC_ID}/approve" -d '{}'
  check "GET created usecase" GET "/usecases/${NEW_UC_ID}"
else
  echo "SKIP  usecase PATCH workflow — create did not return an id"
  SKIP=$((SKIP + 4))
  hr
fi

if [[ -n "${NEW_KN_ID}" ]]; then
  check "GET created knowledge" GET "/knowledge/${NEW_KN_ID}"
  check "POST /knowledge/{id}/reprocess" POST "/knowledge/${NEW_KN_ID}/reprocess" -d '{}'
else
  echo "SKIP  knowledge get/reprocess — create did not return an id"
  SKIP=$((SKIP + 2))
  hr
fi

if [[ -n "${NEW_LR_ID}" ]]; then
  check "GET created learning" GET "/learning/${NEW_LR_ID}"
  # feedback requires boolean field "success"
  check "POST /learning/{id}/feedback" POST "/learning/${NEW_LR_ID}/feedback" \
    -d '{"success":true,"rating":5,"comment":"smoke test feedback"}'
else
  echo "SKIP  learning feedback — create did not return an id"
  SKIP=$((SKIP + 2))
  hr
fi

echo "SKIP  POST /knowledge/reprocess (all embeddings — heavy)"
echo "SKIP  POST /usecases/import (needs file)"
echo "SKIP  POST /knowledge/upload (multipart)"
SKIP=$((SKIP + 3))
hr

echo "Results: ${PASS} passed, ${FAIL} failed, ${SKIP} skipped"
echo ""
echo "Paste this whole terminal output back into Cursor."
if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
