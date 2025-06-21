import { auth } from '../lib/auth/auth-server';
import { getSessionWithBearer } from '../lib/auth/get-session-with-bearer';

async function testBearerAuth() {

  // Create a test user and session
  const testEmail = 'test-bearer@example.com';
  const testPassword = 'Test123!@#';
  
  try {
    // Try to sign up first (might already exist)

    try {
      await auth.api.signUpEmail({
        body: {
          email: testEmail,
          password: testPassword,
          name: 'Bearer Test User',
        }
      });

    } catch (e: any) {
      if (e.message?.includes('already exists')) {

      } else {
        throw e;
      }
    }
    
    // Sign in to get a session token

    const signInResponse = await auth.api.signInEmail({
      body: {
        email: testEmail,
        password: testPassword,
      }
    });
    
    const token = signInResponse.token;

    // Test 1: Cookie-based auth (standard Better Auth)

    const cookieHeaders = new Headers({
      'cookie': `better-auth.session-token=${token}`
    });
    const cookieSession = await auth.api.getSession({ headers: cookieHeaders });

    // Test 2: Bearer token auth (our enhancement)

    const bearerHeaders = new Headers({
      'Authorization': `Bearer ${token}`
    });
    const bearerSession = await getSessionWithBearer(bearerHeaders);

    // Test 3: Compare results

    if (cookieSession?.user?.id === bearerSession?.user?.id) {

    } else {

    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
testBearerAuth()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));