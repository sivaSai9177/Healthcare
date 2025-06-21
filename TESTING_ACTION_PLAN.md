# Healthcare Alert System - Testing Action Plan

## 🎯 Current Status

### ✅ What's Working
1. **Docker Environment**: All services are healthy
   - PostgreSQL: ✅ Running on port 5432
   - Redis: ✅ Running on port 6379
   - Expo: ✅ Running on port 8081
   - WebSocket: ✅ Running on port 3002
   - Scripts: ✅ Container ready

2. **Data Setup**: Healthcare demo data created
   - Organization: Test Hospital Organization
   - Hospital: General Hospital (GH001)
   - 7 test users with different roles

3. **Scripts**: Fixed and working
   - `manage-users.ts` - User management
   - React Native import issues resolved
   - Database connectivity working

## 📋 Testing Steps

### 1. Test Web UI (5 minutes)
```bash
# Open the app in your browser
open http://localhost:8081

# Expected: You should see the login screen
```

### 2. Test Login Flow (5 minutes)
Login with these credentials:
- **Operator**: `operator@hospital.com` / `password123`
- **Nurse**: `doremon@gmail.com` / `password123`
- **Doctor**: `doctor@hospital.com` / `password123`

### 3. Test Core Features (10 minutes)
After login, verify:
- ✅ Dashboard loads correctly
- ✅ User role is displayed
- ✅ Navigation menu works
- ✅ Can navigate between screens

### 4. Test WebSocket Connection (5 minutes)
```bash
# In another terminal, watch WebSocket logs
docker logs -f healthcare-websocket

# In the app, look for real-time features:
# - Connection status indicator
# - Real-time alert updates
```

### 5. Test Mobile App (Optional - 10 minutes)
```bash
# iOS Simulator (requires macOS + Xcode)
# Press 'i' in the Expo terminal

# Android Emulator (requires Android Studio)
# Press 'a' in the Expo terminal

# Physical Device
# 1. Install Expo Go app on your phone
# 2. Scan the QR code shown in terminal
```

## 🚨 Common Issues & Quick Fixes

### Issue: Blank/Loading Screen
```bash
# Check logs
docker logs healthcare-app --tail 50

# Look for JavaScript errors
# Open browser console (F12) and check for red errors
```

### Issue: Cannot Login
```bash
# Verify users exist
docker exec healthcare-scripts bun scripts/users/manage-users.ts list

# If no users, create them
docker exec healthcare-scripts bun scripts/users/manage-users.ts setup-healthcare
```

### Issue: WebSocket Not Connecting
```bash
# Check if WebSocket is running
docker ps | grep websocket

# Restart if needed
docker-compose -f docker-compose.dev.yml restart websocket
```

## 🎯 What to Test for Deployment

### Critical Features (Must Work)
1. **Authentication**
   - [ ] Login works
   - [ ] Logout works
   - [ ] Session persists on refresh

2. **Healthcare Features**
   - [ ] Alert creation (if role permits)
   - [ ] Alert listing
   - [ ] Real-time updates

3. **Navigation**
   - [ ] All menu items work
   - [ ] Back button works
   - [ ] No broken screens

### Performance Checks
1. **Load Times**
   - [ ] Login < 2 seconds
   - [ ] Dashboard < 3 seconds
   - [ ] Navigation < 1 second

2. **Real-time Features**
   - [ ] WebSocket connects immediately
   - [ ] Updates appear without delay

## 📊 Quick Health Check Commands

```bash
# Check all services
./scripts/check-docker-status.sh

# Test API endpoint
curl http://localhost:8081/api/health

# Check database connection
docker exec healthcare-scripts bun scripts/users/manage-users.ts list

# Monitor real-time logs
docker-compose -f docker-compose.dev.yml logs -f
```

## 🚀 Ready for Deployment?

Before deploying, ensure:
- [ ] Can login with all test users
- [ ] Core features work without errors
- [ ] No console errors in browser
- [ ] WebSocket stays connected
- [ ] Performance is acceptable

## 📱 Testing Without Technical Knowledge

1. **Open the App**: Go to http://localhost:8081
2. **Try to Login**: Use `operator@hospital.com` / `password123`
3. **Click Around**: Try all buttons and links
4. **Look for Errors**: Any red error messages?
5. **Check Speed**: Does everything load quickly?

If everything works, you're ready to deploy! 🎉

## 🆘 Need Help?

```bash
# Quick reset if things go wrong
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
./scripts/check-docker-status.sh
```