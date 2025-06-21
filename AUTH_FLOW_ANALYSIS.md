# Auth Flow Analysis & Issues

## Current State

### What Works:
1. ✅ tRPC sign-in endpoint works (`/api/trpc/auth.signIn`)
2. ✅ Returns a Bearer token on successful login
3. ✅ Bearer token works when passed in Authorization header
4. ✅ User can authenticate with demo@example.com / SecurePassword123!

### What's Broken:
1. ❌ No cookies are set after sign-in
2. ❌ Session is not persisted (getSession returns null after sign-in)
3. ❌ Better Auth endpoints return 404 (e.g., `/api/auth/session`)
4. ❌ Web app gets redirected to login with "No session found"

## Root Cause

The app is using **tRPC** for authentication instead of **Better Auth's native endpoints**:

- tRPC endpoint: `/api/trpc/auth.signIn` (works but doesn't set cookies)
- Better Auth endpoint: `/api/auth/sign-in/email` (returns 404)

tRPC can only return data, it cannot set HTTP-only cookies. Only Better Auth's native handler can set the secure session cookies.

## Architecture Mismatch

1. **Backend**: 
   - Has Better Auth configured at `/api/auth/[...auth]+api.ts`
   - Has tRPC auth router that calls Better Auth APIs internally
   
2. **Frontend**:
   - Uses tRPC mutations for sign-in
   - Expects cookies to be set automatically
   - SyncProvider uses tRPC to check sessions

## Solutions

### Option 1: Fix Better Auth Endpoints (Recommended)
1. Debug why Better Auth routes return 404
2. Ensure the catch-all route properly passes requests to Better Auth
3. Update frontend to use Better Auth endpoints directly

### Option 2: Make tRPC Set Cookies
1. After successful sign-in via tRPC, manually set cookies in the response
2. This requires modifying the tRPC context to have access to response headers
3. Less secure than Better Auth's built-in cookie management

### Option 3: Hybrid Approach
1. Use tRPC for API calls
2. Use Better Auth endpoints for auth operations (sign-in, sign-out, session)
3. This is how it's supposed to work

## Immediate Fix

To get auth working now:
1. The Bearer token from tRPC sign-in works
2. We need to ensure the token is stored and sent with requests
3. On web, we need to manually manage the session

## Test Results

```
Sign In: ✅ Works via tRPC
Token: ✅ Returned in response  
Cookies: ❌ Not set
Session Check: ❌ Returns null
Bearer Auth: ✅ Works when token passed
```

## Next Steps

1. Fix the Better Auth endpoint routing issue
2. Add proper cookie management
3. Ensure session persistence
4. Test the complete flow end-to-end