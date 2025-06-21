# Healthcare System Testing Instructions

## Initial Setup

### 1. Create Test User

Since the authentication is handled by Better Auth, you need to create the test user through the registration flow:

1. Open http://localhost:8081 in your browser
2. Click "Sign Up" or go to the registration page
3. Register with the following details:
   - Email: `doremon@gmail.com`
   - Password: Choose a secure password
   - Name: `Nurse Doremon`
   - Role: Select `Nurse`

### 2. Complete Profile (if needed)

After registration, if prompted:
1. Select your hospital assignment
2. Complete any required profile fields
3. Save your profile

## Testing the Healthcare Features

### 1. Login
- Email: `doremon@gmail.com`
- Password: (the password you set during registration)

### 2. Healthcare Dashboard
Once logged in, you should see:
- Shift Status card
- Metrics Overview (may show errors initially if no hospital assigned)
- Alert Summary
- Quick Actions

### 3. Fix Hospital Assignment (if needed)

If you see errors about hospital assignment:
1. Click on your profile/settings
2. Look for hospital assignment option
3. Select a hospital from the list
4. Save changes

### 4. Test Core Features

#### Shift Management
1. Click "Start Shift" button
2. Verify the button changes to "End Shift"
3. Check that the shift timer starts
4. Click "End Shift"
5. Add handover notes in the modal
6. Confirm shift ends

#### Alert System (if your role permits)
1. Look for the floating alert button
2. Click to create a new alert
3. Fill in:
   - Room Number (e.g., "205A")
   - Alert Type
   - Urgency Level
   - Description (optional)
4. Submit the alert
5. Verify it appears in the alert list

#### Real-time Features
1. Open the app in another browser tab
2. Create an alert in one tab
3. Verify it appears in the other tab

## Common Issues & Solutions

### "Hospital context required" Error
**Solution**: Ensure you have a hospital assigned in your profile

### "Failed to get on-duty staff" Error
**Solution**: This is normal if you're the only user. The query will work once multiple users are on duty.

### No Create Alert Button
**Solution**: Only certain roles (operator, head_doctor) can create alerts. Nurses can only acknowledge/view.

## Testing Checklist

- [ ] User registration works
- [ ] Login/logout works
- [ ] Healthcare dashboard loads
- [ ] Shift start/end works
- [ ] Hospital context is properly set
- [ ] Alert list displays (even if empty)
- [ ] Profile shows correct information
- [ ] No console errors in browser (F12)

## Database Verification

Run these scripts to verify setup:
```bash
# Check users in database
bun run scripts/check-users.ts

# Test healthcare queries
bun run scripts/test-healthcare-queries.ts

# Verify setup
bun run scripts/verify-setup.ts
```

## Next Steps

1. Create additional test users with different roles (doctor, admin)
2. Test multi-user scenarios
3. Test alert escalation with multiple users
4. Test on mobile devices using Expo Go