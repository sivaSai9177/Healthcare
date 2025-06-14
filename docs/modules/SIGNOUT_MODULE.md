# Sign Out Module Documentation

## Overview

The sign out module provides a comprehensive, cross-platform solution for user logout functionality with proper session cleanup, error handling, and user experience considerations.

## Architecture

### Core Components

1. **SignOutManager** (`lib/auth/signout-manager.ts`)
   - Centralized sign out logic
   - Handles all cleanup operations
   - Prevents duplicate sign out attempts
   - Supports different sign out reasons

2. **SignOutButton** (`components/blocks/auth/SignOutButton`)
   - Reusable UI component
   - Configurable confirmation dialog
   - Loading states and error handling
   - Consistent across the app

3. **Session Cleanup**
   - Clears Better Auth session tokens
   - Removes all auth-related storage
   - Clears app-specific data (optional)
   - Handles platform differences

## Usage

### Basic Sign Out

```typescript
import { signOut } from '@/lib/auth/signout-manager';

// Simple sign out
await signOut();

// With options
await signOut({
  reason: 'user_initiated',
  showAlert: true,
  redirectTo: '/(auth)/login',
  clearAllData: false
});
```

### Using SignOutButton Component

```tsx
import { SignOutButton } from '@/components/blocks/auth';

// Default usage
<SignOutButton />

// Customized
<SignOutButton 
  variant="solid"
  colorScheme="destructive"
  showConfirmation={true}
  confirmationTitle="Sign Out"
  confirmationMessage="Are you sure you want to sign out?"
  showIcon={true}
  fullWidth
/>
```

### In Settings or Menus

```tsx
// Settings screen
<SignOutButton variant="solid" fullWidth />

// Dropdown menu
<DropdownMenuItem onPress={handleSignOut} destructive>
  <Symbol name="arrow.right.square" size={16} />
  <Text>Sign Out</Text>
</DropdownMenuItem>
```

## Sign Out Flow

1. **User Initiates Sign Out**
   - Clicks sign out button
   - Confirms action (if enabled)

2. **Local State Cleared**
   - Auth store cleared immediately
   - UI updates to logged out state

3. **Server Sign Out**
   - Better Auth API called
   - Session invalidated on server
   - Audit log created

4. **Storage Cleanup**
   - Session tokens removed
   - User data cleared
   - Optional: App preferences cleared

5. **Navigation**
   - Redirects to login screen
   - Shows success message

## Error Handling

- If server sign out fails, local state is still cleared
- User is always signed out locally
- Error messages are user-friendly
- No duplicate sign out attempts

## Sign Out Reasons

- `user_initiated` - User clicked sign out
- `session_expired` - Session timeout
- `security` - Security-related sign out
- `error` - Sign out due to error condition

## Platform Considerations

### Web
- Uses localStorage for session
- Shows toast notifications
- Smooth redirects

### Mobile (iOS/Android)
- Uses secure storage
- Native alerts
- Haptic feedback

## Testing

```typescript
// Test sign out flow
const result = await signOut({
  reason: 'user_initiated',
  showAlert: false
});

expect(result.success).toBe(true);
expect(authStore.isAuthenticated).toBe(false);
```

## Security Features

1. **Complete Session Cleanup**
   - All tokens removed
   - Multiple storage locations checked
   - Legacy keys cleaned up

2. **Audit Logging**
   - All sign outs logged
   - Includes reason and metadata
   - Server-side tracking

3. **State Consistency**
   - Local state cleared first
   - Server sync attempted
   - Always ends in logged out state

## Future Enhancements

1. **Sign Out from All Devices**
   - Server endpoint needed
   - Device management UI
   - Real-time session invalidation

2. **Two-Factor Authentication**
   - Additional security step
   - Device trust management
   - Recovery codes

3. **Session Management**
   - View active sessions
   - Revoke specific sessions
   - Device fingerprinting