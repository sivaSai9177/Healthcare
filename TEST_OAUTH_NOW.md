# Test OAuth Flow - Instructions

Your app is already running on port 8081. Here's how to test the OAuth flow:

## 1. Clear Current Session

First, clear your existing session that has validation errors:

1. Open browser: http://localhost:8081/clear-session
2. Click "Clear Session & Logout"
3. This will remove all cookies and auth data

## 2. Enable Debug Logging

Open browser console (F12) and run:
```javascript
window.debugger.enableModule("Auth")
```

## 3. Test OAuth Flow

1. Go to: http://localhost:8081/test-oauth
2. Click "Test OAuth Flow"
3. Complete Google sign-in in the popup
4. Watch the console logs

## 4. Check the Following:

### In Browser Console:
- Look for `[AUTH_CALLBACK] OAuth Callback Debug`
- Check if `hasSessionData` is true or false
- Check if `hasAuthCookie` is true

### In Server Terminal:
- Look for `[AUTH_SERVER] signIn.before callback triggered`
- Look for `[AUTH_SERVER] signIn.after callback triggered`
- Look for `[AUTH_SERVER] Web OAuth successful, redirecting to auth-callback`

### In Network Tab:
1. Open Network tab before clicking OAuth
2. Look for these requests:
   - POST `/api/auth/sign-in/social` (should return 200)
   - GET `/api/auth/callback/google` (should return 302)
   - GET `/auth-callback` (your callback page)

## 5. Expected Flow:

1. Click Google OAuth → Opens Google consent
2. After consent → Redirects to `/api/auth/callback/google`
3. Better Auth processes → Creates session
4. Redirects to `/auth-callback`
5. auth-callback checks session → Finds user with `role: "guest"`
6. Redirects to `/complete-profile`

## 6. If It's Not Working:

Check these common issues:

### A. No Session After OAuth:
- Check cookies: `document.cookie` should contain `better-auth.session_token`
- Check database: Run `bun run scripts/debug-oauth-session.ts`

### B. Validation Error:
- The ID validation has been fixed, but you might need to restart the server

### C. Not Redirecting:
- Check if `[AUTH_SERVER] Web OAuth successful` log appears
- If not, the OAuth callback isn't being processed

## 7. Quick Database Check:

Run in a new terminal:
```bash
bun run scripts/debug-oauth-session.ts
```

This will show:
- Recent sessions in database
- Recent users
- OAuth accounts

## Need to Restart?

If you need to restart the server with the fixes:
1. Stop current server (Ctrl+C)
2. Run: `bun run local:healthcare`
3. Test OAuth again