# Debugging Guide - Healthcare Alert System

## Common Issues and Solutions

### 1. Infinite Render Loop After Google Auth
**Symptoms:**
- "Maximum update depth exceeded" error
- App crashes after Google login

**Root Cause:**
- Circular navigation between auth-callback and profile completion
- useAuthSecurity hook with circular dependencies

**Solution:**
- Fixed navigation logic in auth-callback.tsx
- Removed redundant profile completion check in (app)/_layout.tsx

### 2. 401 Unauthorized on listUserOrganizations
**Symptoms:**
- 401 error when accessing organization endpoints
- Happens during profile completion

**Root Cause:**
- API tries to fetch organizations before profile is complete
- User doesn't have proper permissions yet

**Solution:**
- This is expected behavior during profile completion
- The error will resolve after profile is completed
- Can be ignored during the profile completion flow

### 3. Session Fields Missing After Database Update
**Symptoms:**
- Errors about missing city, deviceFingerprint fields
- Sessions created before security update lack new fields

**Solution:**
- Run: `bun run scripts/database/fix-sessions-simple.ts`
- This adds default values to existing sessions

### 4. Network Timeout Errors
**Symptoms:**
- "AbortError: Aborted" after 30 seconds
- API calls timing out

**Root Cause:**
- Wrong IP address in environment config
- Network has changed

**Solution:**
- Update IP in lib/core/config/unified-env.ts
- Restart Expo with `bun run native`

## Debug Console Usage

### Accessing the Debug Console
1. Look for the floating bug icon (🐛) at bottom-left
2. Tap to open the debug panel
3. Red badge shows error count

### Debug Panel Features
- **Logs Tab**: View all app logs, filter by level
- **API Tab**: Monitor tRPC queries and mutations
- **WebSocket Tab**: Track real-time connections
- **Config Tab**: Toggle logging categories, theme settings

### Useful Debug Commands
```javascript
// In browser console
window.__APP_STATE__ // View current app state
window.__AUTH_STATE__ // View auth state
window.__LOGS__ // View all logs
```

## Monitoring Auth Flow
1. Enable Auth Logging in debug panel config
2. Watch console for auth state changes
3. Check for these key logs:
   - "Processing OAuth callback"
   - "Session data received"
   - "Profile completion needed"
   - "Navigating to..."

## Common Auth Flow Issues

### Google OAuth First-Time Login Flow
1. User clicks Google login
2. Redirected to Google
3. Returns to `/auth-callback`
4. If `needsProfileCompletion` → `/complete-profile`
5. After completion → `/home`

### Things to Check:
- Session has correct user data
- `needsProfileCompletion` flag is set correctly
- No circular redirects happening
- Profile completion actually updates the user

## Performance Issues

### Identifying Render Loops
1. Enable React DevTools Profiler
2. Look for components rendering repeatedly
3. Check useEffect dependencies
4. Watch for setState calls in render

### Common Causes:
- Unstable object/array dependencies
- Missing useCallback/useMemo
- Circular state updates
- Navigation loops

## Database Debugging

### Check User Session
```sql
SELECT u.email, u.role, u.needs_profile_completion, s.city, s.device_fingerprint 
FROM "user" u 
LEFT JOIN session s ON u.id = s.user_id 
WHERE u.email = 'your-email@example.com';
```

### Fix Missing Session Fields
```bash
bun run scripts/database/fix-sessions-simple.ts
```

## Network Debugging

### Test API Connectivity
```bash
# Check if API is reachable
curl http://localhost:8081/api/health

# Test with specific IP
curl http://192.168.2.1:8081/api/health
```

### Common Network Issues:
- Docker containers not running
- Wrong IP address after network change
- Firewall blocking ports
- Expo using cached network config

## Quick Fixes

### Clear All Caches
```bash
rm -rf .expo node_modules/.cache
watchman watch-del-all
expo start --clear
```

### Reset Database
```bash
docker-compose -f docker-compose.local.yml down -v
bun run db:push
bun run scripts/database/fix-sessions-simple.ts
```

### Force Logout
```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

## Device Fingerprint Errors

### Cannot read properties of undefined (reading 'toString')
**Symptoms:**
- Error in console about device fingerprint
- Happens on web platform

**Root Cause:**
- Platform.Version is undefined on some platforms

**Solution:**
- Fixed in device-fingerprint.ts with null checks
- The error is non-blocking and won't affect functionality

## When All Else Fails

1. Check Docker containers: `docker ps`
2. Restart everything: `bun run native`
3. Clear browser data completely
4. Check server logs: `docker logs myexpo-websocket-local`
5. Enable all debug logging in debug panel
6. Record the exact error and stack trace