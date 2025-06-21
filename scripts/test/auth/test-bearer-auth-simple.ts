// Test Bearer authentication without React Native dependencies
import 'dotenv/config';

async function testBearerAuth() {
  const apiUrl = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:8081/api/auth';

  const testEmail = 'bearer-test@example.com';
  const testPassword = 'Test123!@#';
  
  try {
    // Sign in to get a token

    const signInResponse = await fetch(`${apiUrl}/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    
    if (!signInResponse.ok) {
      // Try to create the user first

      const signUpResponse = await fetch(`${apiUrl}/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Bearer Test',
        }),
      });
      
      if (!signUpResponse.ok) {
        const error = await signUpResponse.text();
        throw new Error(`Sign up failed: ${error}`);
      }
      
      // Try sign in again
      const retrySignIn = await fetch(`${apiUrl}/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });
      
      if (!retrySignIn.ok) {
        throw new Error('Sign in failed after signup');
      }
      
      const data = await retrySignIn.json();

      const token = data.token;

      // Continue with the Bearer test
      await testBearerWithToken(token);
      return;
    }
    
    const data = await signInResponse.json();
    const token = data.token;

    await testBearerWithToken(token);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

async function testBearerWithToken(token: string) {
  try {
    // Test Bearer token with tRPC endpoint

    const trpcUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
    const trpcResponse = await fetch(`${trpcUrl}/api/trpc/auth.getSession`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const trpcData = await trpcResponse.json();

    if (trpcData.result?.data) {

    } else {

    }
  } catch (error) {
    console.error('\n❌ Bearer test failed:', error);
  }
}

// Run the test
testBearerAuth()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));