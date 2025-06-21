#!/bin/bash

# Healthcare API Endpoint Tests using curl
API_URL="http://localhost:8081"

echo "🧪 Testing Healthcare API Endpoints"
echo "📍 API URL: $API_URL"
echo ""

# Test 1: Health Check
echo "1️⃣ Testing health endpoint..."
curl -s "$API_URL/api/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Test 2: Get Alerts Dashboard (no auth for simplicity)
echo "2️⃣ Testing alerts dashboard..."
curl -s -X POST "$API_URL/api/trpc/healthcare.getAlertsDashboard" \
  -H "Content-Type: application/json" \
  -d '{"json":null}' | jq '.result.data.json' || echo "❌ Dashboard failed"
echo ""

# Test 3: Get Active Alerts
echo "3️⃣ Testing active alerts..."
curl -s -X POST "$API_URL/api/trpc/healthcare.getActiveAlerts" \
  -H "Content-Type: application/json" \
  -d '{"json":{"hospitalId":"e60ef641-92bd-449b-b68c-2e16c1bd8326","limit":10}}' | jq '.result.data.json' || echo "❌ Active alerts failed"
echo ""

# Test 4: Get Patients List
echo "4️⃣ Testing patients list..."
curl -s -X POST "$API_URL/api/trpc/patient.getPatientsList" \
  -H "Content-Type: application/json" \
  -d '{"json":{"hospitalId":"e60ef641-92bd-449b-b68c-2e16c1bd8326","limit":10}}' | jq '.result.data.json' || echo "❌ Patients list failed"
echo ""

# Test 5: Create Alert (will fail without auth but tests endpoint)
echo "5️⃣ Testing alert creation (expected to fail without auth)..."
curl -s -X POST "$API_URL/api/trpc/healthcare.createAlert" \
  -H "Content-Type: application/json" \
  -d '{"json":{"roomNumber":"999","alertType":"medical_emergency","urgencyLevel":3,"description":"Test alert","hospitalId":"e60ef641-92bd-449b-b68c-2e16c1bd8326"}}' | jq '.' || echo "❌ Create alert failed"
echo ""

echo "✅ API endpoint tests completed!"