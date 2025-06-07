# Mobile Authentication Persistence Fix

## Issue
When a logged-in user refreshes the mobile app, they were being logged out despite the session being stored in SecureStore. The logs showed:
- Session was successfully stored in SecureStore
- Session was loaded on app refresh
- But API calls were returning 401 (Unauthorized) errors
- "No session found in tRPC context" in server logs

## Root Cause
The tRPC client was not including authentication headers for mobile requests. While web uses cookies (with `credentials: 'include'`), mobile needs to explicitly add the Bearer token to request headers.

## Solution
1. **Updated tRPC client** to include authentication headers for mobile:
   - Added session token from sessionManager to request headers
   - Only applies to non-web platforms

2. **Updated auth store** to properly store sessions in sessionManager:
   - When updateAuth is called, it now stores the session in sessionManager for mobile
   - When clearAuth is called, it clears the session from sessionManager

## Changes Made

### 1. lib/trpc.tsx
```typescript
headers() {
  const baseHeaders = {
    'Content-Type': 'application/json',
  };
  
  // On mobile, add the session token from storage
  if (Platform.OS !== 'web') {
    try {
      const { sessionManager } = require('./auth/auth-session-manager');
      return sessionManager.addAuthHeaders(baseHeaders);
    } catch (error) {
      log.api.error('Failed to add auth headers', error);
      return baseHeaders;
    }
  }
  
  return baseHeaders;
}
```

### 2. lib/stores/auth-store.ts
```typescript
// In updateAuth function
if (Platform.OS !== 'web' && session) {
  try {
    const { sessionManager } = await import('@/lib/auth/auth-session-manager');
    await sessionManager.storeSession(session);
    if (user) {
      await sessionManager.storeUserData(user);
    }
    log.store.update('Session stored in session manager');
  } catch (error) {
    log.store.debug('Failed to store session in session manager', error);
  }
}

// In clearAuth function
if (Platform.OS !== 'web') {
  try {
    const { sessionManager } = await import('@/lib/auth/auth-session-manager');
    await sessionManager.clearSession();
    log.store.update('Session cleared from session manager');
  } catch (error) {
    log.store.debug('Failed to clear session from session manager', error);
  }
}
```

## Result
- Mobile app now maintains authentication state across refreshes
- Session token is properly included in all API requests
- Users remain logged in until they explicitly log out or the session expires
- Consistent behavior between web and mobile platforms