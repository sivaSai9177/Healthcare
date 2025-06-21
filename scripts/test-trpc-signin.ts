#!/usr/bin/env bun
/**
 * Test tRPC signin
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';

console.log('🔍 Testing tRPC Sign In');
console.log('API URL:', API_URL);
console.log('---\n');

// Test credentials - trying different users
const testUsers = [
  { email: 'operator@mvp.test', password: 'Operator123!' },
  { email: 'doctor@mvp.test', password: 'Doctor123!' },
  { email: 'nurse@mvp.test', password: 'Nurse123!' },
  { email: 'johncena@gmail.com', password: 'Operator123!' },
  { email: 'doremon@gmail.com', password: 'Nurse123!' },
];

// Try the first one
const { email: testEmail, password: testPassword } = testUsers[0];

async function testTrpcSignIn() {
  console.log('📡 tRPC Sign In');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword.replace(/./g, '*')}`);
  
  try {
    const response = await fetch(`${API_URL}/api/trpc/auth.signIn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      }),
      credentials: 'include'
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, Object.fromEntries([...response.headers.entries()].filter(([k]) => k.toLowerCase().includes('cookie') || k.toLowerCase().includes('auth'))));
    
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      console.log(`   Response:`, JSON.stringify(json, null, 2));
      
      if (json.result?.data?.success) {
        console.log('\n✅ Sign-in successful!');
        console.log('   User:', json.result.data.user);
        
        // Now test getSession
        console.log('\n📡 Testing getSession after sign-in...');
        const sessionResponse = await fetch(`${API_URL}/api/trpc/auth.getSession`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cookie': response.headers.get('set-cookie') || ''
          }
        });
        
        const sessionText = await sessionResponse.text();
        const sessionJson = JSON.parse(sessionText);
        console.log('   Session Response:', JSON.stringify(sessionJson, null, 2));
      }
    } catch (e) {
      console.log(`   Response (text):`, text);
    }
  } catch (error: any) {
    console.error(`   ❌ Error:`, error.message);
  }
}

// Run the test
testTrpcSignIn().catch(console.error);