// Simple auth test without complex imports
import { config } from 'dotenv';
import { getApiUrl } from '../../config/test-users';
config({ path: '.env.local' });

const BASE_URL = getApiUrl();

async function testAuth() {

  const testUsers = [
    { email: 'johndoe@gmail.com', password: 'test123', role: 'doctor' },
    { email: 'doremon@gmail.com', password: 'test123', role: 'nurse' },
  ];
  
  // Test auth health

  try {
    const health = await fetch(`${BASE_URL}/api/auth/health`);

    const data = await health.json();

  } catch (e: any) {

  }

  // Test different auth endpoints
  const endpoints = [
    '/api/auth/sign-in',
    '/api/auth/signin',
    '/api/auth/sign-in/email',
  ];
  
  for (const endpoint of endpoints) {

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUsers[0].email,
          password: testUsers[0].password,
        }),
      });

      const text = await response.text();
      
      if (response.ok) {

        try {
          const data = JSON.parse(text);

        } catch {

        }
      } else {

      }
    } catch (e: any) {

    }
  }
  
  // Test session endpoint

  try {
    const session = await fetch(`${BASE_URL}/api/auth/session`);

    if (session.ok) {
      const data = await session.json();

    }
  } catch (e: any) {

  }
}

testAuth().catch(console.error);
