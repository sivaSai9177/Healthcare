# Unified Scripts Guide

## 🆕 Latest Updates (Runtime Fixes Applied)

### Script Improvements
- **Pre-flight Checks**: Automatic dependency verification
- **Port Cleanup**: Auto-kills processes on ports 8081, 3001, 3002
- **Service Health Checks**: Verifies all services are running
- **Auto-install**: Missing packages (@expo/server) installed automatically
- **Better Error Handling**: Clear error messages and recovery steps

### Runtime Fixes
- Email service now works in React Native (mock implementation)
- Theme provider import paths corrected
- Syntax errors in config files fixed
- WebSocket server runs standalone (no React Native deps)
- All console.log statements replaced with structured logging

## 🚀 Quick Start - One Command for All Scenarios

### Main Commands (NEW)
```bash
# Network mode - Auto-detects your local IP for mobile devices
bun start

# Local mode - Everything on localhost (OAuth-safe)
bun start:local

# Tunnel mode - Remote access via Expo tunnel
bun start:tunnel

# OAuth mode - Optimized for OAuth testing with all services
bun start:oauth

# Healthcare demo with all services
bun local:healthcare      # Standard
bun local:healthcare:web  # Auto-opens web browser
```

## 📱 What Each Mode Does

### Network Mode (`bun start`)
- **Best for**: Testing on physical devices on same WiFi
- **API URL**: Uses your local IP (e.g., 192.168.1.x)
- **Auth URL**: Uses localhost (OAuth-safe)
- **Database**: Local Docker PostgreSQL
- **Access**: 
  - Web: http://localhost:8081
  - Mobile: http://[your-ip]:8081

### Local Mode (`bun start:local`)
- **Best for**: Web development and OAuth testing
- **API URL**: http://localhost:8081
- **Auth URL**: http://localhost:8081
- **Database**: Local Docker PostgreSQL
- **Access**: http://localhost:8081 only

### Tunnel Mode (`bun start:tunnel`)
- **Best for**: Remote testing, different networks
- **API URL**: https://[id].exp.direct
- **Auth URL**: Same as API (OAuth-safe)
- **Database**: Neon Cloud
- **Access**: Public URL provided by Expo

### OAuth Mode (`bun start:oauth`)
- **Best for**: Testing Google Sign-In
- **API URL**: http://localhost:8081
- **Auth URL**: http://localhost:8081
- **Database**: Local Docker PostgreSQL
- **Special**: Forces localhost for OAuth compatibility

## 🏥 Healthcare MVP Commands

```bash
# Start with healthcare setup (uses local mode)
bun healthcare

# Healthcare with network access for mobile
bun healthcare:network

# Healthcare with OAuth support
bun healthcare:oauth
```

## 🗄️ Database Management

```bash
# Local Docker PostgreSQL
bun db:local:up        # Start database
bun db:local:down      # Stop database
bun db:local:reset     # Reset database

# Healthcare setup
bun healthcare:setup       # Setup tables and demo data
bun healthcare:setup:local # Force local database
```

## 📋 Common Workflows

### 1. Testing on iPhone/Android (Same WiFi)
```bash
bun start  # Network mode auto-detects your IP
# Scan QR code with Expo Go app
```

### 2. Testing OAuth (Google Sign-In)
```bash
bun start:oauth  # Forces localhost
# Open http://localhost:8081 in browser
# Click "Continue with Google"
```

### 3. Remote Testing (Different Network)
```bash
bun start:tunnel  # Creates public URL
# Share the URL with testers
```

### 4. Healthcare Demo
```bash
bun healthcare  # Full setup with demo data
# Login with:
# - johncena@gmail.com (operator)
# - doremon@gmail.com (nurse)
# - johndoe@gmail.com (doctor)
```

## 🔧 Environment Configuration

The new unified system automatically handles:
- **OAuth Safety**: Uses localhost when needed
- **Network Detection**: Finds your local IP
- **Database Selection**: Local for dev, cloud for tunnel
- **URL Resolution**: Platform-specific URLs

### How It Works

1. **Unified Environment** (`lib/core/unified-env.ts`):
   - Detects current mode (local/network/tunnel)
   - Returns appropriate URLs for each service
   - Ensures OAuth compatibility

2. **Smart URL Resolution**:
   - Web: Always uses current origin
   - iOS: Uses localhost or network IP
   - Android: Uses 10.0.2.2 or network IP
   - OAuth: Always uses localhost

3. **Automatic Configuration**:
   - Auth module uses OAuth-safe URLs
   - tRPC uses platform-appropriate URLs
   - Database connects to right instance

## 🚨 Troubleshooting

### Common Runtime Errors (FIXED)
```bash
# "nodemailer.default.createTransporter is not a function"
# ✅ Fixed: Email service uses conditional imports

# "spacing is not defined"
# ✅ Fixed: Import spacing from '@/lib/design'

# "Cannot find module '@expo/server/build/vendor/http'"
# ✅ Fixed: Scripts now auto-install @expo/server

# Port already in use errors
# ✅ Fixed: Scripts auto-cleanup ports before starting
```

### OAuth Not Working?
```bash
# Use OAuth mode
bun start:oauth

# Check credentials
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

### Can't Connect from Mobile?
```bash
# Use network mode
bun start

# Check your IP is correct
# The script will show: "Local IP: 192.168.x.x"
```

### Database Connection Failed?
```bash
# Ensure Docker is running
docker ps

# Start database
bun db:local:up

# Reset if needed
bun db:local:reset
```

### Quick Reset Everything
```bash
# Kill all processes
pkill -f "expo start" || true
pkill -f "metro" || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Restart with healthcare
bun local:healthcare
```

## 📝 Demo Credentials

All users can login with any password:
- **Operator**: johncena@gmail.com
- **Nurse**: doremon@gmail.com
- **Doctor**: johndoe@gmail.com
- **Head Doctor**: saipramod273@gmail.com

## 🔔 Notification Services

### Email Server (Mock for React Native)
```bash
# Starts automatically with healthcare commands
# Logs: logs/email-server.log
# Port: 3001
# Test endpoint: http://localhost:3001/send-test
```

### WebSocket Server (Real-time alerts)
```bash
# Starts automatically with healthcare commands
# Logs: logs/websocket-server.log
# Port: 3002
# Test with: wscat -c ws://localhost:3002
```

## 🎯 Quick Decision Guide

- **Testing locally?** → `bun start:local`
- **Testing on phone?** → `bun start`
- **Testing OAuth?** → `bun start:oauth`
- **Sharing with others?** → `bun start:tunnel`
- **Healthcare demo?** → `bun local:healthcare`
- **Web development?** → `bun local:healthcare:web`

## 📦 Package.json Script Reference

### Main Scripts
- `start` - Network mode (default)
- `start:local` - Local mode
- `start:tunnel` - Tunnel mode
- `start:oauth` - OAuth mode

### Healthcare Scripts
- `healthcare` - Local with healthcare
- `healthcare:network` - Network with healthcare
- `healthcare:oauth` - OAuth with healthcare

### Database Scripts
- `db:local:up` - Start PostgreSQL
- `db:local:down` - Stop PostgreSQL
- `db:local:reset` - Reset database
- `healthcare:setup` - Setup healthcare tables

### Notification/Email Scripts
- `email:server` - Start email notification server
- `email:test` - Test email configuration
- `notification:test` - Test notification service
- `ws:start` - Start WebSocket server for real-time alerts

### Platform Scripts
- `ios` - iOS simulator
- `android` - Android emulator
- `web` - Web browser