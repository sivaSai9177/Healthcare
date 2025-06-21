# OAuth Redirect URLs Configuration

## Google OAuth Console Configuration

For Google OAuth to work properly, you need to add these redirect URLs to your Google Console:

### For Development (localhost)
```
http://localhost:8081/api/auth/callback/google
http://localhost:8081/auth-callback
```

### For Production
```
https://yourdomain.com/api/auth/callback/google
https://yourdomain.com/auth-callback
```

## Current Issue

The OAuth flow is working (user is created in database) but the session is not immediately available after redirect. This suggests:

1. The OAuth callback is successful (user created with role='guest' and needsProfileCompletion=true)
2. But the session cookie might not be properly set or immediately available
3. The auth-callback page can't find the session when it queries

## Debug Steps

1. Navigate to `/test-oauth` to test the OAuth flow
2. Click "Sign in with Google"
3. Complete Google sign-in
4. Check if you're redirected to `/auth-callback`
5. Check the debug info to see if session is created

## Fix Applied

1. Added delay parameter to OAuth redirect to ensure session is saved
2. Enhanced auth-callback page to handle OAuth timing better
3. Added debug endpoints to verify session state