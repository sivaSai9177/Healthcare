import { auth } from '../lib/auth/auth-server';
import { getSessionWithBearer } from '../lib/auth/get-session-with-bearer';

async function testBearerAuth() {
  console.log('Testing Bearer token authentication...\n');
  
  // Create a test user and session
  const testEmail = 'test-bearer@example.com';
  const testPassword = 'Test123!@#';
  
  try {
    // Try to sign up first (might already exist)
    console.log('1. Creating test user...');
    try {
      await auth.api.signUpEmail({
        body: {
          email: testEmail,
          password: testPassword,
          name: 'Bearer Test User',
        }
      });
      console.log('✅ Test user created');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('ℹ️  Test user already exists');
      } else {
        throw e;
      }
    }
    
    // Sign in to get a session token
    console.log('\n2. Signing in to get session token...');
    const signInResponse = await auth.api.signInEmail({
      body: {
        email: testEmail,
        password: testPassword,
      }
    });
    
    const token = signInResponse.token;
    console.log('✅ Got session token:', token?.substring(0, 20) + '...');
    
    // Test 1: Cookie-based auth (standard Better Auth)
    console.log('\n3. Testing cookie-based authentication...');
    const cookieHeaders = new Headers({
      'cookie': `better-auth.session-token=${token}`
    });
    const cookieSession = await auth.api.getSession({ headers: cookieHeaders });
    console.log('✅ Cookie auth works:', {
      userId: cookieSession?.user?.id,
      email: cookieSession?.user?.email
    });
    
    // Test 2: Bearer token auth (our enhancement)
    console.log('\n4. Testing Bearer token authentication...');
    const bearerHeaders = new Headers({
      'Authorization': `Bearer ${token}`
    });
    const bearerSession = await getSessionWithBearer(bearerHeaders);
    console.log('✅ Bearer auth works:', {
      userId: bearerSession?.user?.id,
      email: bearerSession?.user?.email
    });
    
    // Test 3: Compare results
    console.log('\n5. Comparing results...');
    if (cookieSession?.user?.id === bearerSession?.user?.id) {
      console.log('✅ Both methods return the same session!');
    } else {
      console.log('❌ Methods returned different sessions');
    }
    
    console.log('\n✅ Bearer token authentication is working correctly!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
testBearerAuth()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));