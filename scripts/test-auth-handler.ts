/**
 * Test auth handler directly
 */

// Set NODE_ENV to avoid client-side imports
process.env.NODE_ENV = 'production';

async function testAuthHandler() {
  try {
    console.log('Testing auth handler...\n');
    
    // Import auth
    const { auth } = await import('../lib/auth/auth-server');
    
    console.log('Auth imported successfully');
    console.log('Auth type:', typeof auth);
    console.log('Auth handler type:', typeof auth?.handler);
    console.log('Auth keys:', Object.keys(auth || {}));
    
    if (auth && auth.handler) {
      // Create a test request
      const testRequest = new Request('http://localhost:8081/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('\nCalling auth.handler...');
      const response = await auth.handler(testRequest);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log('Response body:', text);
    } else {
      console.error('Auth handler not available!');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAuthHandler();