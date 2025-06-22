#!/usr/bin/env tsx
import 'dotenv/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function testSessionEndpoint() {
  console.log('🔍 Testing getSession endpoint...\n');
  
  // Get the session token from the browser
  console.log('Please get your session token from the browser:');
  console.log('1. Open DevTools in your browser');
  console.log('2. Go to Application > Cookies');
  console.log('3. Find the cookie named "better-auth.session_token_multi-XXXXX"');
  console.log('4. Copy the value\n');
  
  // For testing, we'll use a hardcoded token - replace this with your actual token
  const sessionToken = process.env.TEST_SESSION_TOKEN || 'YOUR_SESSION_TOKEN_HERE';
  
  if (sessionToken === 'YOUR_SESSION_TOKEN_HERE') {
    console.log('❌ Please set TEST_SESSION_TOKEN in your .env.local file or update the script');
    process.exit(1);
  }
  
  try {
    const response = await fetch('http://localhost:8081/api/trpc/auth.getSession', {
      method: 'GET',
      headers: {
        'Cookie': `better-auth.session_token_multi-zkharsngdvttfl24mramupjy=${sessionToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    console.log('📦 Raw Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.result?.data?.json?.user) {
      const user = data.result.data.json.user;
      console.log('\n👤 User Data:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Organization ID:', user.organizationId);
      console.log('   Organization Name:', user.organizationName || '❌ MISSING');
      console.log('   Default Hospital ID:', user.defaultHospitalId);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSessionEndpoint();