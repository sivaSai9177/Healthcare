# Fix for Google OAuth Redirect Issue

## Problem Analysis

Based on the logs, the OAuth flow is reaching the auth-callback page but no session is being created. The logs show:
- OAuth callback is detected
- No session data is returned from the API
- The auth cookie is not present
- After retries, it redirects to login

## Root Cause

The issue appears to be that the OAuth flow is not completing properly on the Better Auth side. Possible causes:

1. **OAuth Redirect URI Mismatch**: The redirect URI configured in Google Console might not match what Better Auth expects
2. **Session Creation Failure**: Better Auth might not be creating the session after successful OAuth
3. **Cookie Domain Issue**: The session cookie might be set on a different domain/path

## Solution Steps

### 1. Verify Google OAuth Configuration

Check your Google Cloud Console OAuth 2.0 Client:
- Go to https://console.cloud.google.com/apis/credentials
- Select your OAuth 2.0 Client ID
- Verify Authorized redirect URIs include:
  - `http://localhost:8081/api/auth/callback/google`
  - `http://localhost:8081/auth-callback`

### 2. Enable Debug Logging

In the browser console:
```javascript
// Enable Auth module debugging
window.debugger.enableModule('Auth')

// Check all Auth logs
window.debugger.getModuleLogs('Auth')

// Export logs for analysis
window.debugger.exportHistory()
```

### 3. Check Network Tab

1. Open browser DevTools Network tab
2. Click "Continue with Google"
3. Look for these requests:
   - `/api/auth/sign-in/social` (should return redirect URL)
   - Google OAuth flow
   - `/api/auth/callback/google` (Better Auth callback)
   - `/auth-callback` (your app callback)

### 4. Verify Cookie Settings

After OAuth, check cookies:
```javascript
document.cookie
```

Look for `better-auth.session_token` cookie.

### 5. Test Direct API

Test if Better Auth is working:
```bash
curl http://localhost:8081/api/auth/health
```

### 6. Check Better Auth Logs

The auth server logs should show:
- `[AUTH_SERVER] signIn.before callback triggered`
- `[AUTH_SERVER] signIn.after callback triggered`

If these aren't showing, the OAuth isn't reaching Better Auth.

## Immediate Fix

1. **Clear all cookies and local storage**:
```javascript
// Clear cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

// Clear storage
localStorage.clear();
sessionStorage.clear();
```

2. **Restart the dev server**:
```bash
# Stop all servers
pkill -f "bun\|node\|expo"

# Start fresh
bun run dev
```

3. **Try OAuth again** with debug logging enabled

## Alternative Approach

If the issue persists, try the test auth-callback page:
1. Navigate to `/auth-callback-fix`
2. This page has enhanced debugging and will try multiple methods to get the session

## Configuration Check

Ensure your `.env` file has:
```
BETTER_AUTH_BASE_URL=http://localhost:8081/api/auth
BETTER_AUTH_URL=http://localhost:8081
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Database Check

Run the database check:
```bash
bun run scripts/debug-oauth-session.ts
```

This will show if sessions are being created in the database.