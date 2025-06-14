# OAuth Flow Test Plan with Organization Creation/Joining

## Overview
This document outlines the test plan for the complete OAuth flow, including profile completion and organization creation/joining.

## Test Scenarios

### 1. New User Sign-Up via Google OAuth

#### Steps:
1. Click "Sign in with Google" on the login screen
2. Complete Google authentication
3. Should be redirected to `/complete-profile`
4. Verify profile completion form shows:
   - Pre-filled name and email from Google
   - Role selection (User, Team Manager, Admin)
   - Step 1: Personal Information
   - Step 2: Account Setup
   - Step 3: Organization (for Manager/Admin roles)
   - Step 4: Terms & Conditions

#### Expected Results:
- ✅ Google profile data auto-populates
- ✅ Role selection works correctly
- ✅ Organization fields appear for Manager/Admin roles
- ✅ Guest role skips organization step

### 2. Manager Role with Organization Creation

#### Steps:
1. Sign in with Google (new user)
2. Select "Team Manager" role
3. Fill in personal information
4. On Organization step:
   - Enter organization name
   - Verify organization creation fields
5. Complete profile

#### Expected Results:
- ✅ Organization fields are required for managers
- ✅ Organization is created in database
- ✅ User is assigned to the organization
- ✅ Redirected to manager dashboard

### 3. Admin Role with Organization Creation

#### Steps:
1. Sign in with Google (new user)
2. Select "Admin" role
3. Complete personal information
4. Create organization
5. Complete profile

#### Expected Results:
- ✅ Admin can create organization
- ✅ Admin has full permissions in organization
- ✅ Redirected to admin dashboard

### 4. User Role with Organization Code

#### Steps:
1. Sign in with Google (new user)
2. Select "User" role
3. Enter organization join code (if available)
4. Complete profile

#### Expected Results:
- ✅ User can join existing organization
- ✅ Organization code is validated
- ✅ User is added to organization
- ✅ Redirected to user dashboard

### 5. Guest Role (No Organization)

#### Steps:
1. Sign in with Google (new user)
2. Select "Guest" role
3. Complete profile (no organization step)

#### Expected Results:
- ✅ No organization step shown
- ✅ Profile completion is faster
- ✅ Limited access to features
- ✅ Redirected to guest dashboard

### 6. Existing User Sign-In

#### Steps:
1. Sign in with Google (existing user)
2. Should skip profile completion
3. Directly to dashboard

#### Expected Results:
- ✅ No profile completion required
- ✅ Session restored correctly
- ✅ User data preserved
- ✅ Organization membership intact

### 7. Sign-Out Flow

#### Steps:
1. Click sign out button
2. Confirm sign out (if enabled)
3. Should clear session

#### Expected Results:
- ✅ Session cleared locally
- ✅ Redirected to login
- ✅ No 500 errors (OAuth issue fixed)
- ✅ Can sign in again successfully

## Test Checklist

### Authentication
- [ ] Google OAuth sign-in works
- [ ] Session is created correctly
- [ ] Tokens are stored securely
- [ ] Session persists on refresh

### Profile Completion
- [ ] Form validation works
- [ ] Role selection updates form steps
- [ ] Organization fields appear conditionally
- [ ] Terms acceptance is required
- [ ] Profile data is saved correctly

### Organization Management
- [ ] Organization creation works for Manager/Admin
- [ ] Organization data is stored in database
- [ ] User is assigned to organization
- [ ] Organization join code works (future feature)

### Navigation
- [ ] Redirect to profile completion for new users
- [ ] Skip profile completion for existing users
- [ ] Role-based dashboard routing
- [ ] Protected routes work correctly

### Error Handling
- [ ] Network errors are handled gracefully
- [ ] Validation errors show proper messages
- [ ] OAuth errors are caught and displayed
- [ ] Sign-out 500 error is suppressed

### Session Management
- [ ] Session timeout works
- [ ] Token refresh works
- [ ] Session persistence across app restarts
- [ ] Multi-device session handling

## Manual Testing Script

```bash
# 1. Start the development server
npm run dev

# 2. Open browser to http://localhost:8081

# 3. Test each scenario above

# 4. Check logs for any errors
# - Console logs in browser
# - Server logs in terminal

# 5. Verify database entries
# - Check users table
# - Check organizations table
# - Check sessions table
```

## Automated Testing (Future)

```typescript
// Example E2E test for OAuth flow
describe('OAuth Flow', () => {
  it('should complete profile after Google sign-in', async () => {
    // Navigate to login
    await page.goto('/login');
    
    // Click Google sign-in
    await page.click('[data-testid="google-signin"]');
    
    // Complete Google OAuth (mocked)
    await completeGoogleOAuth();
    
    // Should redirect to profile completion
    await expect(page).toHaveURL('/complete-profile');
    
    // Select role
    await page.selectOption('[name="role"]', 'manager');
    
    // Fill organization
    await page.fill('[name="organizationName"]', 'Test Hospital');
    
    // Complete profile
    await page.click('[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/(manager)/dashboard');
  });
});
```

## Known Issues & Workarounds

1. **OAuth Sign-Out 500 Error**
   - Status: Fixed
   - Workaround: Error is caught and handled gracefully

2. **Session Persistence on Mobile**
   - Status: Working
   - Uses secure storage for tokens

3. **Organization Join Code**
   - Status: Not implemented
   - Workaround: Manual organization assignment

## Success Criteria

The OAuth flow is considered fully functional when:
1. All test scenarios pass
2. No console errors during flow
3. Data is correctly stored in database
4. User experience is smooth
5. Security requirements are met