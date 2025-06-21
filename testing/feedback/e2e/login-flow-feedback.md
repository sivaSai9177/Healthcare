# Login Flow E2E Test Feedback

**Test File**: `.maestro/login-flow.yaml`  
**Status**: ⏭️ NOT RUN  
**Last Run**: N/A  

## Test Overview

This E2E test validates the complete login flow from app launch to successful authentication.

## Test Steps

1. Launch app
2. Wait for login screen
3. Enter email credentials
4. Enter password
5. Submit login form
6. Verify navigation to dashboard
7. Verify user info displayed

## Prerequisites

### 1. Test User Setup
```sql
-- Ensure test user exists in database
INSERT INTO users (email, name, role, password_hash)
VALUES ('doctor@example.com', 'Dr. Test User', 'doctor', '$hash');
```

### 2. App Configuration
- Bundle ID: `com.hospital.alertsystem`
- Test environment API URL configured
- Test database seeded

### 3. Device Setup
- iOS Simulator or Android Emulator running
- Maestro CLI installed
- App installed on device

## Running the Test

```bash
# Run on iOS
maestro test .maestro/login-flow.yaml --platform ios

# Run on Android
maestro test .maestro/login-flow.yaml --platform android

# Run with specific device
maestro test .maestro/login-flow.yaml --device "iPhone 15"
```

## Expected Results

### Success Criteria
- ✅ Login screen appears within 5 seconds
- ✅ Email input accepts text
- ✅ Password input masks text
- ✅ Login button is enabled after input
- ✅ Navigation occurs after login
- ✅ Dashboard shows user name
- ✅ No error messages appear

### Failure Scenarios
- ❌ Login screen doesn't load
- ❌ Inputs not found (wrong test IDs)
- ❌ Login fails with valid credentials
- ❌ Navigation doesn't occur
- ❌ Dashboard doesn't load

## Common Issues

### 1. Element Not Found
```yaml
# Add wait commands
- waitForAnimationToEnd
- assertVisible:
    id: "email-input"
    timeout: 10000
```

### 2. Timing Issues
```yaml
# Add delays between actions
- tapOn:
    id: "email-input"
- wait: 500
- inputText: "doctor@example.com"
```

### 3. Keyboard Issues
```yaml
# Dismiss keyboard if needed
- hideKeyboard
- wait: 200
- tapOn:
    id: "login-button"
```

## Test IDs Required

Ensure these testIDs are set in components:

```typescript
// LoginScreen
<TextInput testID="email-input" />
<TextInput testID="password-input" />
<Button testID="login-button" />

// Dashboard
<Text testID="user-name">{user.name}</Text>
```

## Debugging

### Enable Screenshots
```yaml
- takeScreenshot: "before-login"
- tapOn:
    id: "login-button"
- takeScreenshot: "after-login"
```

### Add Assertions
```yaml
- assertNotVisible: "Error message"
- assertVisible: "Loading..."
- assertNotVisible: "Loading..."
- assertVisible: "Healthcare Dashboard"
```

## Related Tests

- `alert-creation-flow.yaml` - Depends on successful login
- `healthcare-navigation.yaml` - Requires authenticated user

## Priority: 🟡 HIGH

First E2E test to implement as it's required for all other authenticated flows.