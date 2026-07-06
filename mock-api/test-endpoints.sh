#!/usr/bin/env bash
# Verify all Epic 2/3 Incident Service mock endpoints.
set -euo pipefail

BASE="${MOCK_API_BASE:-http://localhost:3090}"
PRIMARY_ID="e94c2c19-7bc5-4448-ae0b-5b94fb4ff6b9"
PASS=0
FAIL=0

check() {
  local name="$1"
  local expected_status="$2"
  local url="$3"
  shift 3
  local response
  local status

  if [[ $# -gt 0 ]]; then
    response=$(curl -s -w "\n%{http_code}" "$@" "$url")
  else
    response=$(curl -s -w "\n%{http_code}" "$url")
  fi

  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [[ "$status" == "$expected_status" ]]; then
    echo "PASS  $name  (HTTP $status)"
    PASS=$((PASS + 1))
    echo "$body" | head -c 200
    echo ""
  else
    echo "FAIL  $name  (expected HTTP $expected_status, got $status)"
    FAIL=$((FAIL + 1))
    echo "$body"
  fi
  echo "---"
}

echo "Testing mock API at $BASE"
echo ""

check "GET /health" 200 "$BASE/health"
check "GET /incidents" 200 "$BASE/incidents"
check "GET /incidents/stats" 200 "$BASE/incidents/stats"
check "GET /incidents/:id" 200 "$BASE/incidents/$PRIMARY_ID"
check "GET /incidents/:id/timeline" 200 "$BASE/incidents/$PRIMARY_ID/timeline"
check "GET /incidents/:id/related" 200 "$BASE/incidents/$PRIMARY_ID/related"
check "GET /incidents/:id/recommendations" 200 "$BASE/incidents/$PRIMARY_ID/recommendations"

check "POST /incidents" 201 "$BASE/incidents" \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{
    "alert_id": "alert-test-999",
    "entity": "node-test",
    "host": "node-test",
    "severity": "WARNING",
    "title": "Test alert incident",
    "description": "Created by test-endpoints.sh",
    "event_code": "test.event",
    "intent": "testing",
    "timestamp": "2026-07-06T12:00:00Z"
  }'

check "PATCH /incidents/:id" 200 "$BASE/incidents/$PRIMARY_ID" \
  -X PATCH \
  -H 'Content-Type: application/json' \
  -d '{"status":"Investigating","owner":"Arman","priority":"High"}'

check "GET /incidents/:id (404)" 404 "$BASE/incidents/does-not-exist"

echo ""
echo "Results: $PASS passed, $FAIL failed"
if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
