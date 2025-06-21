# Healthcare Profile Error Fix Documentation

## Problem
Users were seeing a technical TRPC error when trying to access healthcare features without completing their profile:
```
[ERROR] [HEALTHCARE] TRPC query error: healthcare.getActiveAlerts
Hospital assignment required. Please complete your profile.
Code: FORBIDDEN (403)
```

## Root Cause
The `hospitalProcedure` middleware in TRPC requires users to have a hospital assignment. When users without complete profiles try to access healthcare features, they receive a 403 error that wasn't being handled gracefully.

## Solution Implemented

### 1. Error Detection Enhancement
**File:** `hooks/useErrorDetection.ts`
- Added new error type: `'profile-incomplete'`
- Enhanced `handleTRPCError` to detect 403 errors with profile completion messages
- Maps these errors to user-friendly messages

### 2. Error Recovery Strategy
**File:** `components/providers/ErrorProvider.tsx`
- Added recovery strategies for profile-incomplete errors
- Provides "Complete Profile" action that navigates to profile completion
- Includes "Cancel" option for users who want to continue without healthcare access

### 3. TRPC Error Link
**File:** `lib/api/trpc.tsx`
- Added global error link to TRPC client
- Automatically intercepts all TRPC errors
- Calls `handleTRPCError` from error detection hook
- Ensures consistent error handling across the app

### 4. Error UI Updates
**File:** `components/blocks/errors/ErrorRecovery.tsx`
- Added purple color scheme for profile-incomplete errors
- Uses `person.badge.plus` icon for clear visual indication
- Shows "Profile Incomplete" as the error title

### 5. Healthcare Query Wrapper
**File:** `hooks/healthcare/useHealthcareQuery.ts`
- Created wrapper hooks for healthcare queries and mutations
- Automatically handles profile-incomplete errors
- Options for custom handlers or automatic redirect to profile completion

### 6. Profile Incomplete Prompt Component
**File:** `components/blocks/healthcare/ProfileIncompletePrompt.tsx`
- Dedicated UI component for profile completion prompts
- Two variants: inline and full-screen
- Smooth animations and haptic feedback
- Clear call-to-action buttons

### 7. Global Error Store Setup
**Files:** 
- `hooks/healthcare/useGlobalErrorStore.ts`
- `components/RootErrorStoreSetup.tsx`
- Updated `app/_layout.tsx`

Sets up a global error store that TRPC can access, enabling automatic error handling.

## Usage Examples

### Using Healthcare Query Wrapper
```typescript
import { useHealthcareQuery } from '@/hooks/healthcare';
import { api } from '@/lib/api/trpc';

function HealthcareComponent() {
  const alertsQuery = useHealthcareQuery(
    api.healthcare.getActiveAlerts.useQuery(),
    {
      onProfileIncomplete: () => {
        console.log('User needs to complete profile');
      },
      redirectToProfile: true // Default behavior
    }
  );
  
  // Profile errors are handled automatically
  if (alertsQuery.isLoading) return <Loading />;
  if (alertsQuery.data) return <AlertList alerts={alertsQuery.data} />;
}
```

### Using Profile Incomplete Prompt
```typescript
import { ProfileIncompletePrompt } from '@/components/blocks/healthcare';

// Inline variant
<ProfileIncompletePrompt 
  message="Set up your hospital to view alerts"
  variant="inline"
/>

// Full-screen variant
<ProfileIncompletePrompt 
  variant="full"
  showCancel={false}
/>
```

## Benefits

1. **Better UX**: Users see a friendly prompt instead of technical errors
2. **Clear Actions**: Direct path to complete profile with obvious CTAs
3. **Consistent Handling**: All healthcare 403 errors handled the same way
4. **Developer Experience**: Simple hooks make error handling automatic
5. **Visual Clarity**: Purple theme distinguishes profile errors from other errors

## Testing

To test the implementation:
1. Log in as a user without hospital assignment
2. Try to access any healthcare feature (alerts, patients, etc.)
3. Verify you see the profile completion prompt
4. Click "Complete Profile" and verify navigation
5. Complete profile and verify healthcare access works

## Future Improvements

1. Add analytics to track profile completion rates
2. Implement partial profile completion states
3. Add role-specific profile requirements
4. Consider adding a progress indicator for multi-step profiles