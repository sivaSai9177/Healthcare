/**
 * Test Better Auth endpoints
 */

async function testAuthEndpoints() {
  const baseUrl = 'http://localhost:8081';
  
  console.log('Testing Better Auth endpoints...\n');
  
  const endpoints = [
    { method: 'GET', path: '/api/auth' },
    { method: 'GET', path: '/api/auth/session' },
    { method: 'POST', path: '/api/auth/sign-in/email' },
    { method: 'POST', path: '/api/auth/sign-in/social' },
    { method: 'GET', path: '/api/auth/callback/google' },
    { method: 'POST', path: '/api/auth/sign-up/email' },
    { method: 'POST', path: '/api/auth/sign-out' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: endpoint.method === 'POST' ? '{}' : undefined,
      });
      
      console.log(`${endpoint.method} ${endpoint.path}: ${response.status} ${response.statusText}`);
      
      if (response.status === 500) {
        const text = await response.text();
        if (text) {
          console.log(`  Error: ${text}`);
        }
      }
    } catch (error: any) {
      console.log(`${endpoint.method} ${endpoint.path}: ERROR - ${error.message}`);
    }
  }
}

testAuthEndpoints().catch(console.error);