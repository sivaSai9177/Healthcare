# Debug Guide: App Stuck Loading

## Changes Made

1. **Enhanced Hydration Timeout (auth-store.ts)**
   - Added a 500ms fallback timeout for all platforms
   - Prevents infinite waiting for storage hydration

2. **Improved Error Handling (SyncProvider.tsx)**
   - Added 404 error handling
   - Prevent network errors from blocking initial load

3. **Force Hydration Fallback (index.tsx)**
   - Added 2-second timeout to force proceed past loading screen
   - Logs error when force hydration is triggered

4. **Session Manager Delay (SessionProvider.tsx)**
   - Prevents session timeout manager from starting until auth is hydrated

## Debugging Steps

1. **Check Browser Console / Metro Logs**
   Look for these messages:
   - "Force hydration timeout reached" - indicates auth store didn't hydrate
   - "hydrationTimeout" - auth store forced hydration after 500ms
   - "Session sync error" - network/API issues

2. **Common Issues**

   **Storage Issues:**
   - Clear AsyncStorage: `npx expo start --clear`
   - Clear browser localStorage if on web

   **Network Issues:**
   - Check if API endpoint is accessible
   - Verify EXPO_PUBLIC_API_URL environment variable
   - Check for CORS issues on web

   **Auth State Issues:**
   - The auth store might have corrupted data
   - Try clearing all storage and restarting

3. **Quick Fixes to Try**
   ```bash
   # Clear all caches
   npx expo start --clear
   
   # If on web, clear browser data:
   # - Open DevTools
   # - Application tab
   # - Clear Storage > Clear site data
   ```

4. **Check Environment Variables**
   Ensure these are set correctly:
   - `EXPO_PUBLIC_API_URL`
   - `EXPO_PUBLIC_SESSION_TIMEOUT`
   - `EXPO_PUBLIC_REQUIRE_EMAIL_VERIFICATION`

## What the App Should Do

1. Show loading screen with progress bar
2. After max 2 seconds, proceed to auth check
3. If not authenticated → redirect to login
4. If authenticated → redirect to app

## Additional Debugging

If still stuck, add this to index.tsx temporarily:

```tsx
useEffect(() => {
  console.log('Auth State Debug:', {
    hasHydrated,
    isLoading,
    isAuthenticated,
    user: user?.id,
    forceHydrated,
    showLoadingScreen,
    shouldShowLoading: (!hasHydrated && !forceHydrated) || isLoading || showLoadingScreen
  });
}, [hasHydrated, isLoading, isAuthenticated, user, forceHydrated, showLoadingScreen]);
```