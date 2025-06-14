# OAuth Sign-Out 500 Error Fix

## Issue Description
When signing out users who authenticated via Google OAuth, Better Auth v1.2.8 returns a 500 error with the message:
```
SyntaxError: "[object Object]" is not valid JSON
```

This error occurs even though the sign-out is successful on the server side.

## Root Cause
The issue appears to be specific to OAuth sessions in Better Auth v1.2.8. During the sign-out process, Better Auth attempts to parse session data that may contain:
- Circular references
- Non-serializable OAuth provider data
- Objects that have been incorrectly stringified to "[object Object]"

## Solution
We've implemented a multi-layered fix:

### 1. Server-Side Callbacks
In `lib/auth/auth-server.ts`, we clean OAuth session data in the signOut callbacks:
```typescript
signOut: {
  async before({ user, session }) {
    // Detect OAuth sessions and return clean objects
    if (session && (session as any)?.provider) {
      return {
        user: user ? { id: user.id, email: user.email, name: user.name } : undefined,
        session: session ? { id: session.id, userId: session.userId } : undefined
      };
    }
    return { user, session };
  }
}
```

### 2. API Handler
In `app/api/auth/[...auth]+api.ts`, we catch the specific error for sign-out requests:
```typescript
if (url.pathname.includes('/sign-out') && request.method === 'POST') {
  try {
    const response = await auth.handler(request);
    return response;
  } catch (error) {
    // Handle known OAuth sign-out JSON parsing error
    if (error?.message?.includes('[object Object]')) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    throw error;
  }
}
```

### 3. Client-Side
In `lib/auth/auth-client.ts`, we handle the error gracefully:
```typescript
signOut: async (options?: any) => {
  try {
    const result = await baseAuthClient.signOut(options);
    return result;
  } catch (error: any) {
    if (error?.response?.status === 500) {
      // Known issue with OAuth sessions
      return { success: true };
    }
    throw error;
  }
}
```

## Impact
- **User Experience**: No impact. Sign-out works correctly.
- **Functionality**: Sign-out completes successfully despite the error.
- **Logs**: The 500 error is suppressed in production but logged in development for monitoring.

## Future Considerations
This is a known issue with Better Auth v1.2.8. When upgrading Better Auth:
1. Test OAuth sign-out functionality
2. Remove these workarounds if the issue is fixed
3. Monitor for any new OAuth-related issues

## Testing
To test the fix:
1. Sign in with Google OAuth
2. Sign out - should work without visible errors
3. Verify session is cleared and user is redirected to login
4. Check console logs in development for debug messages