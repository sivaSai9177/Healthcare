# Healthcare Alert System - UI Testing Guide

## 🎯 What UI Testing Means

UI testing ensures your app works correctly from a user's perspective. It includes:

1. **Visual Testing**: Does the app look correct?
2. **Functional Testing**: Do buttons, forms, and features work?
3. **Navigation Testing**: Can users move between screens properly?
4. **Integration Testing**: Does the app communicate with the backend correctly?

## 🚀 Quick Start - Test Your App Now

### 1. Access the Web App
```bash
# Open in your browser
open http://localhost:8081
```

### 2. Test Login Flow
Use these test credentials:
- **Operator**: `operator@hospital.com` / `password123`
- **Nurse**: `doremon@gmail.com` / `password123`
- **Doctor**: `doctor@hospital.com` / `password123`
- **Admin**: `admin@hospital.com` / `password123`

### 3. Test Mobile App (iOS Simulator)
```bash
# In the Expo terminal, press 'i' to open iOS simulator
# Or run:
docker exec -it healthcare-app expo start --ios
```

### 4. Test Mobile App (Android)
```bash
# In the Expo terminal, press 'a' to open Android emulator
# Or run:
docker exec -it healthcare-app expo start --android
```

## 📱 Testing Checklist

### Authentication Flow
- [ ] Login page loads correctly
- [ ] Login with valid credentials works
- [ ] Invalid credentials show error message
- [ ] Logout functionality works
- [ ] Session persistence (refresh page, still logged in)
- [ ] Password reset flow (if implemented)

### Healthcare Dashboard (Main Features)
- [ ] Dashboard loads after login
- [ ] User role is displayed correctly
- [ ] Navigation menu shows appropriate options for role
- [ ] Real-time WebSocket connection indicator
- [ ] Alert creation form works (for authorized roles)
- [ ] Alert list displays properly
- [ ] Patient information is accessible

### Navigation Testing
- [ ] All menu items navigate to correct screens
- [ ] Back button works properly
- [ ] Deep linking works (if implemented)
- [ ] Protected routes redirect to login when not authenticated
- [ ] Role-based route protection works

### WebSocket/Real-time Features
- [ ] Real-time alerts appear without refresh
- [ ] Alert acknowledgment updates in real-time
- [ ] Connection status indicator works
- [ ] Reconnection works after network interruption

## 🧪 Manual Testing Steps

### Step 1: Test Authentication
1. Go to http://localhost:8081
2. You should see the login screen
3. Try logging in with wrong credentials - should see error
4. Login with `operator@hospital.com` / `password123`
5. You should be redirected to the dashboard

### Step 2: Test Role-Based Access
1. Login as different users and verify:
   - **Operator**: Can see operational dashboard
   - **Nurse**: Can see patient alerts, create basic alerts
   - **Doctor**: Can see all alerts, create medical alerts
   - **Admin**: Can access all features including settings

### Step 3: Test Alert System
1. Login as a nurse or doctor
2. Navigate to Alerts section
3. Create a new alert:
   - Select urgency level
   - Enter patient details
   - Submit the alert
4. Verify alert appears in the list
5. Open another browser/tab, login as different user
6. Verify they can see the alert (real-time update)

### Step 4: Test Mobile Responsiveness
1. In Chrome, open Developer Tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different screen sizes:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Desktop (1920x1080)

## 🔍 Common Issues & Solutions

### Can't Login
- Check if backend is running: `docker ps`
- Verify database has users: `docker exec healthcare-scripts bun scripts/users/manage-users.ts list`
- Check browser console for errors (F12)

### WebSocket Not Connecting
- Check WebSocket logs: `docker logs -f healthcare-websocket`
- Verify port 3002 is accessible
- Check browser console for WebSocket errors

### Blank Screen After Login
- Check Expo logs: `docker logs -f healthcare-app`
- Clear browser cache and cookies
- Check for JavaScript errors in console

## 🛠️ Advanced Testing

### API Testing with cURL
```bash
# Test API health
curl http://localhost:8081/api/health

# Test authenticated endpoint (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" http://localhost:8081/api/user/profile
```

### WebSocket Testing
```bash
# Test WebSocket connection
npm install -g wscat
wscat -c ws://localhost:3002/api/trpc
```

### Load Testing
```bash
# Simple load test for login endpoint
for i in {1..10}; do
  curl -X POST http://localhost:8081/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"operator@hospital.com","password":"password123"}' &
done
```

## 📊 What to Look For

### Performance
- Pages load within 2 seconds
- No lag when typing in forms
- Smooth scrolling and animations
- Real-time updates appear instantly

### Accessibility
- All interactive elements are keyboard accessible
- Forms have proper labels
- Error messages are clear
- Color contrast is sufficient

### Error Handling
- Network errors show user-friendly messages
- Form validation works properly
- Loading states are shown during async operations
- Errors don't crash the app

## 🎯 Ready for Deployment Checklist

Before deploying, ensure:
- [ ] All test users can login successfully
- [ ] Core features work without errors
- [ ] Mobile app works on both iOS and Android
- [ ] WebSocket connections are stable
- [ ] No console errors in production build
- [ ] Performance is acceptable
- [ ] Security headers are configured
- [ ] Environment variables are properly set

## 🚀 Next Steps

Once testing is complete:
1. Build production version: `npm run build`
2. Run production locally: `npm run preview`
3. Deploy with Kamal: `kamal deploy`
4. Monitor logs: `kamal logs`

Remember: Good testing = Confident deployment! 🎉