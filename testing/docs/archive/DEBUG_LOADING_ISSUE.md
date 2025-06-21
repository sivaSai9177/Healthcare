# Debug Loading Issue

## Common Causes & Solutions

### 1. Clear Metro Cache
```bash
# Stop the app (Ctrl+C) then run:
npx expo start --clear
# Or with healthcare:
bun run local:healthcare --clear
```

### 2. Check Browser Console
1. Open http://localhost:8081 in Chrome
2. Open Developer Tools (F12)
3. Check Console tab for errors
4. Common errors:
   - Module not found
   - Network errors
   - Authentication errors

### 3. Quick Fixes to Try

#### Fix 1: Disable problematic imports temporarily
Edit `app/_layout.tsx` and comment out line 3:
```tsx
// import "@/lib/core/platform/suppress-warnings";
```

#### Fix 2: Check WebSocket connection
Edit `.env.local` and ensure:
```
EXPO_PUBLIC_WS_PORT=3002
EXPO_PUBLIC_ENABLE_WS=true
```

#### Fix 3: Disable secure storage temporarily
Comment out line 39 in `app/_layout.tsx`:
```tsx
// import { initializeSecureStorage } from "@/lib/core/secure-storage";
```

### 4. Test Basic Loading
Create a simple test file `app/test.tsx`:
```tsx
import { View, Text } from 'react-native';

export default function Test() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>App is loading!</Text>
    </View>
  );
}
```

Then navigate to http://localhost:8081/test

### 5. Check Services
```bash
# PostgreSQL
psql -U postgres -h localhost -p 5432 -c "SELECT 1"

# Redis
redis-cli ping

# WebSocket
curl http://localhost:3002/health

# Email Server
curl http://localhost:3001/health
```

### 6. Emergency Reset
```bash
# Stop all services
docker-compose -f docker-compose.local.yml down
pkill -f "node scripts"
pkill -f "bun scripts"

# Clear all caches
rm -rf .expo
rm -rf node_modules/.cache
npx expo start --clear
```

## Next Steps
1. Check browser console for specific errors
2. Try the fixes above in order
3. If still stuck, check the server logs:
   - `tail -f logs/email-server.log`
   - `tail -f logs/websocket-server.log`