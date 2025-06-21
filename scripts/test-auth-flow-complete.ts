#!/usr/bin/env bun
/**
 * Comprehensive Auth Flow Test
 * Tests every aspect of authentication step by step
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
const TEST_USER = {
  email: 'demo@example.com',
  password: 'SecurePassword123!'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(`${title}`, colors.bright + colors.blue);
  console.log('='.repeat(60));
}

function logStep(step: string) {
  log(`\n▶ ${step}`, colors.cyan);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(label: string, value: any) {
  console.log(`${colors.yellow}${label}:${colors.reset}`, value);
}

// Helper to extract and display cookies
function displayCookies(headers: Headers) {
  const cookies = headers.get('set-cookie');
  if (cookies) {
    logInfo('Cookies Set', cookies.split(',').map(c => c.trim().split(';')[0]).join(', '));
  } else {
    logInfo('Cookies', 'None');
  }
  return cookies;
}

async function testAuthFlow() {
  logSection('COMPREHENSIVE AUTH FLOW TEST');
  logInfo('API URL', API_URL);
  logInfo('Test User', TEST_USER.email);
  
  let sessionCookies: string | null = null;
  let bearerToken: string | null = null;
  
  // ========== STEP 1: Initial State Check ==========
  logSection('STEP 1: INITIAL STATE CHECK');
  
  logStep('Checking if any session exists...');
  try {
    const response = await fetch(`${API_URL}/api/trpc/auth.getSession`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    logInfo('Response Status', response.status);
    logInfo('Session Data', data.result?.data || 'null');
    
    if (data.result?.data === null) {
      logSuccess('No session exists (as expected for fresh start)');
    } else {
      logError('Unexpected session found!');
      logInfo('Existing Session', JSON.stringify(data.result?.data, null, 2));
    }
  } catch (error) {
    logError(`Failed to check session: ${error.message}`);
  }
  
  // ========== STEP 2: Sign In Flow ==========
  logSection('STEP 2: SIGN IN FLOW');
  
  logStep('Attempting to sign in...');
  try {
    const response = await fetch(`${API_URL}/api/trpc/auth.signIn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(TEST_USER),
      credentials: 'include'
    });
    
    const data = await response.json();
    logInfo('Response Status', response.status);
    
    if (response.ok && data.result?.data?.success) {
      logSuccess('Sign in successful!');
      logInfo('User ID', data.result.data.user.id);
      logInfo('User Email', data.result.data.user.email);
      logInfo('User Role', data.result.data.user.role);
      logInfo('Needs Profile Completion', data.result.data.user.needsProfileCompletion);
      logInfo('Token Present', data.result.data.token ? 'Yes' : 'No');
      
      sessionCookies = displayCookies(response.headers);
      bearerToken = data.result.data.token;
    } else {
      logError('Sign in failed!');
      logInfo('Error', JSON.stringify(data.error, null, 2));
      return;
    }
  } catch (error) {
    logError(`Sign in request failed: ${error.message}`);
    return;
  }
  
  // ========== STEP 3: Session Verification ==========
  logSection('STEP 3: SESSION VERIFICATION');
  
  logStep('Checking session after sign in...');
  try {
    // Try with Bearer token since cookies aren't working
    const headers: any = {
      'Accept': 'application/json'
    };
    
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
      logInfo('Using Bearer token', 'Yes');
    } else if (sessionCookies) {
      headers['Cookie'] = sessionCookies;
      logInfo('Using Cookies', 'Yes');
    }
    
    const response = await fetch(`${API_URL}/api/trpc/auth.getSession`, {
      headers
    });
    
    const data = await response.json();
    logInfo('Response Status', response.status);
    
    if (data.result?.data) {
      logSuccess('Session exists after sign in!');
      logInfo('Session ID', data.result.data.session?.id);
      logInfo('User ID', data.result.data.user?.id);
      logInfo('Session Expires', data.result.data.session?.expiresAt);
      
      // Check session contents
      const session = data.result.data;
      logStep('Validating session contents...');
      
      if (session.user?.email === TEST_USER.email) {
        logSuccess('User email matches');
      } else {
        logError('User email mismatch!');
      }
      
      if (session.session?.userId === session.user?.id) {
        logSuccess('Session userId matches user id');
      } else {
        logError('Session userId mismatch!');
      }
    } else {
      logError('No session found after sign in!');
      logInfo('Response', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    logError(`Session check failed: ${error.message}`);
  }
  
  // ========== STEP 4: Cookie Analysis ==========
  logSection('STEP 4: COOKIE ANALYSIS');
  
  if (sessionCookies) {
    logStep('Analyzing cookies...');
    const cookieArray = sessionCookies.split(',').map(c => c.trim());
    
    cookieArray.forEach(cookie => {
      const [nameValue, ...attributes] = cookie.split(';').map(s => s.trim());
      const [name, value] = nameValue.split('=');
      
      logInfo(`Cookie: ${name}`, '');
      logInfo('  Value', value ? `${value.substring(0, 20)}...` : 'empty');
      
      attributes.forEach(attr => {
        if (attr) {
          const [key, val] = attr.split('=');
          logInfo(`  ${key}`, val || 'true');
        }
      });
    });
    
    // Check for required security attributes
    const cookieString = sessionCookies.toLowerCase();
    if (cookieString.includes('httponly')) {
      logSuccess('HttpOnly flag is set');
    } else {
      logError('HttpOnly flag is missing!');
    }
    
    if (cookieString.includes('samesite=')) {
      logSuccess('SameSite attribute is set');
    } else {
      logError('SameSite attribute is missing!');
    }
  }
  
  // ========== STEP 5: Protected Endpoint Test ==========
  logSection('STEP 5: PROTECTED ENDPOINT TEST');
  
  logStep('Testing access to protected endpoint...');
  try {
    // Test a protected tRPC endpoint (if available)
    const response = await fetch(`${API_URL}/api/trpc/organization.getUserOrganizations`, {
      headers: {
        'Accept': 'application/json',
        'Cookie': sessionCookies || ''
      }
    });
    
    const data = await response.json();
    logInfo('Response Status', response.status);
    
    if (response.ok) {
      logSuccess('Protected endpoint accessible');
      logInfo('Organizations', JSON.stringify(data.result?.data, null, 2));
    } else if (response.status === 401) {
      logError('Unauthorized - session not recognized');
    } else {
      logInfo('Response', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    logError(`Protected endpoint test failed: ${error.message}`);
  }
  
  // ========== STEP 6: Sign Out Flow ==========
  logSection('STEP 6: SIGN OUT FLOW');
  
  logStep('Attempting to sign out...');
  try {
    const response = await fetch(`${API_URL}/api/trpc/auth.signOut`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': sessionCookies || ''
      },
      body: '{}' // tRPC expects a body even if empty
    });
    
    const data = await response.json();
    logInfo('Response Status', response.status);
    
    if (response.ok) {
      logSuccess('Sign out successful');
      
      // Check for cookie clearing
      const clearCookies = response.headers.get('set-cookie');
      if (clearCookies && clearCookies.includes('Max-Age=0')) {
        logSuccess('Cookies cleared properly');
      } else {
        logError('Cookies may not be cleared!');
      }
    } else {
      logError('Sign out failed!');
      logInfo('Error', JSON.stringify(data.error, null, 2));
    }
  } catch (error) {
    logError(`Sign out failed: ${error.message}`);
  }
  
  // ========== STEP 7: Final Session Check ==========
  logSection('STEP 7: FINAL SESSION CHECK');
  
  logStep('Verifying session is cleared...');
  try {
    const response = await fetch(`${API_URL}/api/trpc/auth.getSession`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    logInfo('Response Status', response.status);
    logInfo('Session Data', data.result?.data || 'null');
    
    if (data.result?.data === null) {
      logSuccess('Session cleared successfully');
    } else {
      logError('Session still exists after sign out!');
      logInfo('Remaining Session', JSON.stringify(data.result?.data, null, 2));
    }
  } catch (error) {
    logError(`Final session check failed: ${error.message}`);
  }
  
  // ========== Summary ==========
  logSection('TEST SUMMARY');
  log('Auth flow test completed. Review the results above for any issues.', colors.bright);
}

// Run the test
testAuthFlow().catch(error => {
  logError(`Test failed: ${error.message}`);
  console.error(error);
});