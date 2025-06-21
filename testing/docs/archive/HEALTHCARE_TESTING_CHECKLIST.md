# Healthcare Module Testing Checklist

## Prerequisites
- [ ] App is running: `npm run local:healthcare`
- [ ] Database is set up with test data
- [ ] Test user has hospital assignment: `npm run db:fix-hospital`
- [ ] WebSocket server is running (if testing real-time features)

## 1. Authentication Flow

### Login Screen `/(public)/auth/login`
- [ ] Navigate to login screen
- [ ] Enter invalid credentials → Should show error
- [ ] Enter valid credentials → Should navigate to dashboard
- [ ] Check "Remember me" → Should persist session
- [ ] Click "Forgot password" → Should navigate to reset screen

### Profile Completion `/(public)/auth/complete-profile`
- [ ] New user without hospital → Should see ProfileIncompletePrompt
- [ ] Select organization → Hospital dropdown should populate
- [ ] Select hospital → Should enable submit button
- [ ] Complete profile → Should navigate to dashboard
- [ ] Skip button → Should work but limit access

### Session Management
- [ ] Close app and reopen → Should maintain session
- [ ] Wait for timeout → Should show session expired error
- [ ] Network disconnect → Should show connection lost banner
- [ ] Logout → Should clear session and redirect

## 2. Dashboard & Navigation

### Home Dashboard `/(app)/(tabs)/home`
- [ ] MetricsOverview component loads
- [ ] Active alerts count is correct
- [ ] Shift status shows correctly
- [ ] Quick actions work (Create Alert, View Patients)
- [ ] Tab navigation works smoothly

### Error States
- [ ] No hospital assigned → ProfileIncompletePrompt appears
- [ ] Network error → ErrorBanner appears at top
- [ ] Server error → ErrorRecovery component shows

## 3. Alert Management

### Alert List `/(app)/(tabs)/alerts`
- [ ] All active alerts display
- [ ] Alert badges show correct urgency colors
- [ ] EscalationTimer counts up for unacknowledged alerts
- [ ] Filter by urgency level works
- [ ] Filter by status works
- [ ] Pull to refresh updates list

### Create Alert `/(modals)/create-alert`
- [ ] FloatingAlertButton opens modal
- [ ] Room number validation works
- [ ] Alert type dropdown populated
- [ ] Urgency slider works (1-5)
- [ ] Description is optional
- [ ] Submit creates alert and shows in list
- [ ] Form validation prevents empty submission

### Alert Details `/(modals)/alert-details`
- [ ] Tap alert → Opens details modal
- [ ] All alert information displays
- [ ] Timeline shows creation and updates
- [ ] Acknowledge button works for unacknowledged
- [ ] Complete button works for acknowledged
- [ ] Add notes functionality works
- [ ] Real-time updates if someone else acknowledges

### Alert Real-time Updates
- [ ] New alert appears without refresh
- [ ] Alert acknowledgment updates in real-time
- [ ] Alert completion updates in real-time
- [ ] Multiple users see same updates

## 4. Patient Management

### Patient List `/(app)/(tabs)/patients`
- [ ] Active patients display with cards
- [ ] Patient condition badges show correctly
- [ ] Room numbers display
- [ ] Add patient button works
- [ ] Edit patient information works
- [ ] Discharge patient works

### Patient Details
- [ ] Tap patient → Shows detailed view
- [ ] Medical notes display
- [ ] Update condition works
- [ ] Add notes works
- [ ] Alert history for patient shows

## 5. Shift Management

### Shift Status Component
- [ ] Current shift status displays
- [ ] Start shift button works when off duty
- [ ] End shift button works when on duty
- [ ] Shift timer shows duration
- [ ] Cannot start shift if already on duty

### Staff On Duty
- [ ] List of on-duty staff displays
- [ ] Staff roles show correctly
- [ ] Department filtering works
- [ ] Real-time updates when staff start/end shifts

## 6. Metrics & Analytics

### Metrics Overview
- [ ] Response time metrics display
- [ ] Alert count by type shows
- [ ] Acknowledgment rate calculates correctly
- [ ] Time range selector works (Today/Week/Month)
- [ ] Charts render properly

### Alert History
- [ ] Historical alerts load with pagination
- [ ] Date filtering works
- [ ] Export functionality works (if implemented)
- [ ] Search by room number works

## 7. Settings & Profile

### Settings Screen `/(app)/(tabs)/settings`
- [ ] User profile information displays
- [ ] Hospital assignment shows
- [ ] Department and role display
- [ ] Push notification toggle works
- [ ] Theme switcher works (if implemented)
- [ ] Logout button works

### Organization Settings
- [ ] Switch hospital (if multiple)
- [ ] View organization members
- [ ] Update profile information

## 8. Error Handling & Edge Cases

### Network Errors
- [ ] Turn off WiFi → Connection lost banner appears
- [ ] Try action while offline → Shows appropriate error
- [ ] Reconnect → Banner disappears, queued actions process

### Permission Errors  
- [ ] Access admin features as regular user → Access denied
- [ ] Try to acknowledge others' alerts → Permission error

### Data Validation
- [ ] Create alert with invalid room → Validation error
- [ ] Update patient with empty name → Validation error
- [ ] Set urgency outside 1-5 range → Prevented

### Recovery Flows
- [ ] Session timeout → Can refresh session or login
- [ ] Profile incomplete → Can complete or skip
- [ ] Server error → Can retry or go back
- [ ] Rate limited → Shows wait time

## 9. Performance & UX

### Loading States
- [ ] Skeleton screens while loading
- [ ] Pull-to-refresh indicators
- [ ] Button loading states during submission
- [ ] Smooth transitions between screens

### Animations
- [ ] Error banner slides in/out smoothly
- [ ] Modal presentations are smooth
- [ ] Tab transitions work well
- [ ] No janky animations

### Responsive Design
- [ ] Works on different screen sizes
- [ ] Landscape orientation handled
- [ ] Text is readable at all sizes
- [ ] Touch targets are adequate size

## 10. WebSocket Features

### Real-time Subscriptions
- [ ] Alert updates arrive instantly
- [ ] Multiple device sync works
- [ ] Connection indicator shows status
- [ ] Reconnection works after disconnect

## Test Automation Commands

Run these scripts to help with testing:

```bash
# Fix hospital assignments for existing users
npm run db:fix-hospital

# Run integration tests (if available)
npm run test:healthcare

# Check API health
curl http://localhost:8081/api/health

# Create test data
npm run db:seed:healthcare
```

## Debugging Tools

- [ ] Debug Panel shows logs
- [ ] Network requests logged
- [ ] Error states logged
- [ ] WebSocket events tracked
- [ ] Performance metrics available

## Sign-off Checklist

- [ ] All critical paths tested
- [ ] No console errors during normal use
- [ ] Error recovery works for all scenarios
- [ ] Real-time features work correctly
- [ ] Performance is acceptable
- [ ] Mobile experience is smooth
- [ ] Accessibility features work