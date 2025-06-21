// Test auth via tRPC endpoints
import { config } from 'dotenv';
config({ path: '.env.local' });

const BASE_URL = 'http://localhost:8081';

async function testAuthViaTRPC() {

  const testUser = { 
    email: 'doremon@gmail.com', 
    password: 'test123' 
  };
  
  // Test 1: Sign in via tRPC

  try {
    const response = await fetch(`${BASE_URL}/api/trpc/auth.signIn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      }),
      credentials: 'include'
    });

    const text = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(text);

      // Extract session cookie
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {

        // Test 2: Get session

        const sessionResponse = await fetch(`${BASE_URL}/api/trpc/auth.getSession`, {
          headers: {
            'Cookie': setCookie
          }
        });
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();

        }
      }
    } else {

    }
  } catch (e: any) {

  }
  
  // Test 3: Direct auth health check

  try {
    const health = await fetch(`${BASE_URL}/api/auth/health`);
    const data = await health.json();

  } catch (e: any) {

  }
}

testAuthViaTRPC().catch(console.error);
