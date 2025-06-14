# Google Auth Redirect to Complete-Profile Fix

## Issue Description

Google OAuth users were not being redirected to the complete-profile screen after authentication. Instead, they were being sent directly to the home screen, bypassing the profile completion flow.

## Root Cause

The issue was caused by a mismatch between:
1. **Database defaults**: New users were created with `role: "user"` by default
2. **Auth logic**: The system only checked for `role: "guest"` to trigger profile completion
3. **OAuth callback**: New OAuth users weren't properly marked as needing profile completion

## Solution Applied

### 1. Updated Better Auth Configuration
- Changed the default role from `"user"` to `"guest"` in `lib/auth/auth-server.ts`
- This ensures new OAuth users are created with the correct role

### 2. Enhanced Auth Callback Logic
- Added a 1.5-second delay in `app/auth-callback.tsx` to ensure the database is updated before fetching session
- Added comprehensive debugging logs to track the OAuth flow

### 3. Improved Data Handling
- Updated the `toAppUser` function in `lib/stores/auth-store.ts` to properly handle boolean values
- Ensures `needsProfileCompletion` is preserved correctly

### 4. Enhanced Session Query
- Added logging to the `getSession` query in `src/server/routers/auth.ts`
- Improved the logic to check for incomplete profiles

## Debug Points Added

The following debug logs have been added to help diagnose issues:

1. **auth-server.ts**:
   - `[AUTH_SERVER] signIn.before callback triggered`
   - `[AUTH_SERVER] signIn.after callback triggered`

2. **auth-callback.tsx**:
   - `[AUTH_CALLBACK] OAuth Callback Debug`
   - Shows session data, user role, and needsProfileCompletion flag

3. **auth router (getSession)**:
   - `[AUTH_ROUTER] getSession called`
   - `[AUTH_ROUTER] Database user query result`

4. **toAppUser function**:
   - `[AUTH_STORE] toAppUser conversion`
   - Shows input/output data transformation

## Testing the Fix

1. **Check existing users**:
   ```bash
   bun run scripts/test-google-auth-redirect.ts
   ```

2. **Fix existing OAuth users** (if needed):
   ```bash
   # Dry run to see affected users
   bun run scripts/fix-oauth-users.ts
   
   # Apply fixes
   bun run scripts/fix-oauth-users.ts --fix
   ```

3. **Test the OAuth flow**:
   - Sign out if currently logged in
   - Click "Continue with Google"
   - Use a new Google account or one that hasn't completed profile
   - Check browser console for debug logs
   - Verify redirect to `/(auth)/complete-profile`

## Expected Behavior

1. New Google OAuth users should:
   - Have `role: "guest"`
   - Have `needsProfileCompletion: true`
   - Be redirected to complete-profile screen

2. The complete-profile screen should:
   - Show the profile completion form
   - Update user role and set `needsProfileCompletion: false` on submission
   - Redirect to appropriate dashboard based on selected role

## Troubleshooting

If the redirect still doesn't work:

1. **Check browser console** for debug logs
2. **Verify database state**:
   - User should have `role: "guest"`
   - User should have `needsProfileCompletion: true`
3. **Clear browser cache** and cookies
4. **Check network tab** for API calls to `/api/trpc/auth.getSession`

## Related Files

- `/lib/auth/auth-server.ts` - Auth configuration
- `/app/auth-callback.tsx` - OAuth callback handler
- `/app/(auth)/complete-profile.tsx` - Profile completion screen
- `/src/server/routers/auth.ts` - Auth API endpoints
- `/lib/stores/auth-store.ts` - Auth state management