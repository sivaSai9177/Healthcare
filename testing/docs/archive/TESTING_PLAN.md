# Migration Testing Plan

## Phase 1: Authentication Flow Testing

### 1.1 Login Flow
- [ ] Navigate to app → redirects to `/(public)/auth/login`
- [ ] Login form displays with SignIn block
- [ ] Email validation works
- [ ] Password validation works
- [ ] Remember me functionality
- [ ] Social login buttons (Google)
- [ ] Forgot password link → `/(public)/auth/forgot-password`
- [ ] Register link → `/(public)/auth/register`
- [ ] Successful login → redirects to appropriate dashboard

### 1.2 Registration Flow
- [ ] Register form displays with Register block
- [ ] Email validation and uniqueness check
- [ ] Password strength indicator
- [ ] Role selection (user, healthcare roles)
- [ ] Organization code/name fields
- [ ] Terms acceptance
- [ ] Successful registration → email verification or profile completion

### 1.3 Password Reset Flow
- [ ] Forgot password form with ForgotPassword block
- [ ] Email validation
- [ ] Success message display
- [ ] Back to login navigation

### 1.4 Email Verification
- [ ] Verify email screen displays for unverified users
- [ ] Resend email functionality
- [ ] Auto-redirect after verification

### 1.5 Profile Completion
- [ ] Profile completion for incomplete profiles
- [ ] Required fields validation
- [ ] Role-specific fields
- [ ] Successful completion → main app

## Phase 2: Role-Based Navigation Testing

### 2.1 Operator Role
- [ ] Login as operator → `/(app)/(tabs)/home` → operator dashboard
- [ ] Tab navigation shows: Home, Alerts, Settings
- [ ] Create alert button works → `/(modals)/create-alert`
- [ ] Escalation queue access → `/alerts/escalation-queue`
- [ ] Alert history access → `/alerts/history`
- [ ] Settings access

### 2.2 Healthcare Roles (Doctor/Nurse/Head Doctor)
- [ ] Login as healthcare → `/(app)/(tabs)/home` → healthcare dashboard
- [ ] Tab navigation shows: Home, Alerts, Patients, Settings
- [ ] Shift status displays
- [ ] Metrics overview loads
- [ ] Alert summary works
- [ ] Patient management access
- [ ] Shift handover → `/shifts/handover`

### 2.3 Admin Role
- [ ] Login as admin → `/(app)/(tabs)/home` → admin dashboard
- [ ] Access to admin features:
  - [ ] Audit logs → `/admin/audit`
  - [ ] System settings → `/admin/system`
  - [ ] User management → `/admin/users`
  - [ ] Organization management → `/admin/organizations`

### 2.4 Manager Role
- [ ] Login as manager → `/(app)/(tabs)/home` → manager dashboard
- [ ] Organization dashboard access → `/organization/dashboard`
- [ ] Organization settings → `/organization/settings`
- [ ] Team management features

### 2.5 Regular User Role
- [ ] Login as user → `/(app)/(tabs)/home` → default dashboard
- [ ] Limited tab access: Home, Settings
- [ ] Profile management
- [ ] Basic features only

## Phase 3: Feature Screen Testing

### 3.1 Alert Management
- [ ] Alert list displays with proper filters
- [ ] Alert detail navigation → `/alerts/[id]`
- [ ] Alert acknowledgment (healthcare roles)
- [ ] Alert resolution (doctors)
- [ ] Real-time updates via WebSocket
- [ ] Alert creation modal (operators)

### 3.2 Patient Management
- [ ] Patient list displays (healthcare only)
- [ ] Search and filter functionality
- [ ] Patient cards with details
- [ ] Department filtering
- [ ] Responsive layout

### 3.3 Organization Features
- [ ] Organization dashboard layout
- [ ] Member management
- [ ] Billing information
- [ ] Email settings
- [ ] Analytics display

### 3.4 Security Features
- [ ] Profile screen → `/profile`
- [ ] Change password → `/security/change-password`
- [ ] 2FA settings → `/security/2fa`
- [ ] Password strength validation

### 3.5 Analytics & Logs
- [ ] Response analytics → `/analytics/response-analytics`
- [ ] Activity logs → `/logs/activity-logs`
- [ ] Proper data visualization
- [ ] Export functionality

## Phase 4: Modal Testing

### 4.1 Create Alert Modal
- [ ] Modal presentation
- [ ] Form validation
- [ ] Urgency level selection
- [ ] Department selection
- [ ] Submit functionality
- [ ] Close/cancel behavior

### 4.2 Other Modals
- [ ] Escalation details modal
- [ ] Patient details modal
- [ ] Member details modal
- [ ] All modals have proper close buttons

## Phase 5: Cross-Platform Testing

### 5.1 iOS Testing
- [ ] SafeAreaView implementation
- [ ] Modal presentation style
- [ ] Haptic feedback
- [ ] Keyboard handling
- [ ] ScrollView behavior

### 5.2 Android Testing
- [ ] Back button handling
- [ ] Status bar styling
- [ ] Keyboard avoiding view
- [ ] Material design elements

### 5.3 Web Testing
- [ ] Responsive layouts
- [ ] No SafeAreaView on web
- [ ] Hover states
- [ ] Keyboard navigation
- [ ] Browser back/forward

## Phase 6: Performance & Error Testing

### 6.1 Performance
- [ ] Initial load time
- [ ] Route transition smoothness
- [ ] Image loading
- [ ] API response times
- [ ] Memory usage

### 6.2 Error Handling
- [ ] Network errors display properly
- [ ] Form validation errors
- [ ] 404 page for invalid routes
- [ ] Session timeout handling
- [ ] API error messages

## Phase 7: Import Verification

### 7.1 Check for Broken Imports
```bash
# Run these commands to check for issues
npm run typecheck
npm run lint
```

### 7.2 Verify No Old Path References
- [ ] No imports from `/(auth)`
- [ ] No imports from `/(healthcare)`
- [ ] No imports from old `/(home)`
- [ ] No imports from old `/(organization)`
- [ ] No imports from old `/(admin)`

## Test User Accounts

Create test accounts for each role:
1. **Operator**: operator@test.com
2. **Doctor**: doctor@test.com
3. **Nurse**: nurse@test.com
4. **Head Doctor**: headdoctor@test.com
5. **Admin**: admin@test.com
6. **Manager**: manager@test.com
7. **Regular User**: user@test.com

## Success Criteria

- [ ] All authentication flows work without errors
- [ ] Each role sees appropriate dashboard and features
- [ ] All navigation paths resolve correctly
- [ ] No console errors or warnings
- [ ] Consistent UI/UX across all screens
- [ ] Performance is acceptable on all platforms
- [ ] All features are accessible as intended