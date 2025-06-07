#!/usr/bin/env bun

console.log('🔍 Testing Authentication on Mobile...\n');

// Test the debug endpoint
const apiUrl = 'http://localhost:8081/api/debug/auth-check';

console.log('📡 Making request to:', apiUrl);

fetch(apiUrl)
  .then(res => res.json())
  .then(data => {
    console.log('\n📋 API Response:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => console.error('❌ API call failed:', err));

// Also test the test session endpoint
const testUrl = 'http://localhost:8081/api/test/session';

console.log('\n📡 Testing session endpoint:', testUrl);

fetch(testUrl)
  .then(res => res.json())
  .then(data => {
    console.log('\n📋 Session Test Response:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => console.error('❌ Session test failed:', err));