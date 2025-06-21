#!/usr/bin/env bun
/**
 * Reproduce the exact error from the user's report
 */

// The error stack shows:
// SyntaxError: "[object Object]" is not valid JSON
// at JSON.parse (<anonymous>)
// at parseBody (file:///Users/.../node_modules/better-call/dist/index.mjs:152:21)

// This suggests the body is being sent as "[object Object]" string

// Let's test different scenarios
async function testScenarios() {
  console.log('Testing different body scenarios...\n');
  
  const scenarios = [
    {
      name: 'Valid JSON string',
      body: JSON.stringify({ provider: 'google', callbackURL: '/auth-callback' }),
      contentType: 'application/json'
    },
    {
      name: 'Object (should fail)',
      body: { provider: 'google', callbackURL: '/auth-callback' } as any,
      contentType: 'application/json'
    },
    {
      name: 'String "[object Object]" (reproduces error)',
      body: '[object Object]',
      contentType: 'application/json'
    },
    {
      name: 'toString() result',
      body: { provider: 'google' }.toString(),
      contentType: 'application/json'
    },
    {
      name: 'String() result',
      body: String({ provider: 'google' }),
      contentType: 'application/json'
    }
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n=== ${scenario.name} ===`);
    console.log('Body:', scenario.body);
    console.log('Body type:', typeof scenario.body);
    
    try {
      const response = await fetch('http://localhost:8081/api/auth/sign-in/social', {
        method: 'POST',
        headers: {
          'Content-Type': scenario.contentType
        },
        body: scenario.body
      });
      
      console.log('Status:', response.status);
      const text = await response.text();
      console.log('Response:', text.substring(0, 100));
      
      // Try to parse as JSON
      try {
        const json = JSON.parse(text);
        console.log('Parsed successfully');
      } catch {
        console.log('Response is not JSON');
      }
    } catch (error: any) {
      console.error('Error:', error.message);
    }
  }
  
  // Now test what could cause this
  console.log('\n\n=== INVESTIGATION ===');
  
  // Common ways "[object Object]" can happen:
  const obj = { provider: 'google' };
  console.log('obj.toString():', obj.toString());
  console.log('String(obj):', String(obj));
  console.log('`${obj}`:', `${obj}`);
  console.log('obj + "":', obj + '');
  
  // Check if any of these match
  console.log('\nAll produce "[object Object]":', 
    obj.toString() === '[object Object]' &&
    String(obj) === '[object Object]' &&
    `${obj}` === '[object Object]' &&
    (obj + '') === '[object Object]'
  );
}

testScenarios().catch(console.error);