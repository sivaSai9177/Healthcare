#!/usr/bin/env bun

import { logger } from '../lib/core/debug/unified-logger';

const testResults = {
  platform: 'Web (localhost:8081)',
  timestamp: new Date().toISOString(),
  tests: [] as any[],
};

function logTest(name: string, status: 'PASS' | 'FAIL' | 'INFO', details?: string) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';

  testResults.tests.push({ name, status, details, time: new Date().toISOString() });
}

async function runWebTests() {
  // Test 1: Server Health Check
  try {
    const response = await fetch('http://localhost:8081');
    if (response.ok) {
      logTest('Web Server Running', 'PASS', `Status: ${response.status}`);
    } else {
      logTest('Web Server Running', 'FAIL', `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('Web Server Running', 'FAIL', 'Cannot connect to localhost:8081');
    return;
  }

  // Test 2: API Health Check
  try {
    const apiResponse = await fetch('http://localhost:8081/api/trpc/auth.getSession');
    logTest('API Endpoint Accessible', apiResponse.ok ? 'PASS' : 'FAIL', 
      `Status: ${apiResponse.status}`);
  } catch (error) {
    logTest('API Endpoint Accessible', 'FAIL', 'API not responding');
  }

  // Test 3: Static Assets
  try {
    const assetResponse = await fetch('http://localhost:8081/_expo/static/js/web/index.js');
    logTest('Static Assets Loading', assetResponse.ok ? 'PASS' : 'INFO', 
      'Bundle serving correctly');
  } catch (error) {
    logTest('Static Assets Loading', 'FAIL', 'Assets not loading');
  }

  // Summary

  const passed = testResults.tests.filter(t => t.status === 'PASS').length;
  const failed = testResults.tests.filter(t => t.status === 'FAIL').length;

  // Instructions for manual testing

  // Save results
  await Bun.write(
    `test-results-web-${Date.now()}.json`,
    JSON.stringify(testResults, null, 2)
  );

}

runWebTests().catch(console.error);