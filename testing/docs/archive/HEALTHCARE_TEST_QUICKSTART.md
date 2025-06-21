# Healthcare Testing Quick Reference

## 🚀 Quick Start

```bash
# 1. Start the app
npm run local:healthcare

# 2. Open in simulator/device
# iOS: Press 'i' in terminal
# Android: Press 'a' in terminal
```

## 👤 Test User Credentials

### Users WITH Hospital (Normal Flow)
- **Email**: `john.smith@hospital.com`
- **Email**: `michael.chen@hospital.com`  
- **Email**: `doremon@gmail.com`
- **Password**: Check your test data setup

### Users WITHOUT Hospital (Error Flow)
- **Email**: `datta.sirigiri@gmail.com` ⭐ (Use this to test ProfileIncompletePrompt)
- **Email**: `doctor.test@example.com`
- **Password**: Check your test data setup

## 🧪 Key Test Scenarios

### 1. Profile Incomplete Error
1. Login with `datta.sirigiri@gmail.com`
2. Try to access Healthcare features
3. **Expected**: ProfileIncompletePrompt appears
4. Click "Complete Profile" → Should navigate to profile completion

### 2. Normal Healthcare Flow
1. Login with `john.smith@hospital.com`
2. Navigate to Alerts tab
3. **Expected**: Alert list loads without errors
4. Create new alert using FloatingAlertButton

### 3. Network Error Testing
1. Login successfully
2. Turn off WiFi/Network
3. Try to create an alert
4. **Expected**: Connection lost banner appears
5. Turn network back on → Banner should disappear

### 4. Session Timeout
1. Login and wait for session to expire
2. Try any action
3. **Expected**: Session timeout error with "Refresh Session" option

## 📱 Screens to Test

| Screen | Path | What to Test |
|--------|------|--------------|
| Login | `/(public)/auth/login` | Invalid credentials error |
| Dashboard | `/(app)/(tabs)/home` | Metrics loading, shift status |
| Alerts | `/(app)/(tabs)/alerts` | List, filters, real-time updates |
| Create Alert | `/(modals)/create-alert` | Form validation, submission |
| Profile Complete | `/(public)/auth/complete-profile` | Hospital selection |

## 🔍 What to Look For

### ✅ Success Indicators
- Smooth animations
- No console errors
- Proper error messages
- Recovery options work
- Real-time updates

### ❌ Common Issues
- `[[object Object]]` in console → Fixed ✅
- Height animation warning → Fixed ✅
- Profile incomplete 403 error → Handled ✅

## 🛠️ Debug Commands

```bash
# Check API health
curl http://localhost:8081/api/health | jq

# View database users
docker exec myexpo-postgres-local psql -U myexpo -d myexpo_dev -c "SELECT email, name FROM \"user\";"

# Check hospital assignments
docker exec myexpo-postgres-local psql -U myexpo -d myexpo_dev -c "SELECT u.email, h.hospital_id FROM \"user\" u LEFT JOIN healthcare_users h ON u.id = h.user_id;"
```

## 📊 Test Progress Tracker

- [ ] Login with user without hospital
- [ ] See ProfileIncompletePrompt
- [ ] Complete profile flow
- [ ] Login with user with hospital
- [ ] Create an alert
- [ ] View alert list
- [ ] Acknowledge alert
- [ ] Test network disconnection
- [ ] Test session timeout
- [ ] Test real-time updates (2 devices)