# Environment Setup Guide

Complete guide for setting up the development environment.

## Prerequisites

- Node.js 18+ or Bun
- Docker and Docker Compose
- Expo CLI
- iOS Simulator (Mac) or Android Studio

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd my-expo

# 2. Install dependencies
bun install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 4. Start Docker services
docker-compose --profile development up -d

# 5. Run database migrations
bun db:migrate

# 6. Start development server
bun start
```

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expo-db"

# Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:8081"

# Google OAuth (optional)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=""
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=""
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=""

# API URLs
EXPO_PUBLIC_API_URL="http://localhost:8081"
EXPO_PUBLIC_WS_URL="ws://localhost:8081"
```

### Environment-Specific Setup

#### Development
- Uses local PostgreSQL via Docker
- Hot reload enabled
- Debug mode active

#### Staging
- Uses staging database
- Performance monitoring enabled
- Limited debug features

#### Production
- Uses production database
- Full optimizations
- No debug features

## Docker Setup

### Services
- PostgreSQL 16
- Redis (optional, for sessions)
- API server

### Commands
```bash
# Start all services
docker-compose --profile development up

# Start specific service
docker-compose up postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
bun db:migrate
```

## OAuth Setup

### Google OAuth
1. Create project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add redirect URIs:
   - `http://localhost:8081/api/auth/callback/google`
   - `com.yourapp://auth`

### Expo Auth Session
- Automatically handled by Better Auth
- Works in Expo Go and standalone builds

## Tunnel Mode (Ngrok)

For testing on physical devices:

```bash
# Install ngrok
brew install ngrok

# Start with tunnel
bun tunnel

# Update API URL in app
# The URL will be displayed in terminal
```

## Troubleshooting

### Common Issues

1. **White screen on iOS**
   - Force light theme in theme provider
   - Check for Reanimated issues

2. **API connection failed**
   - Verify Docker is running
   - Check API_URL in environment
   - For mobile: use tunnel or local IP

3. **OAuth not working**
   - Verify redirect URIs
   - Check client IDs
   - Ensure BETTER_AUTH_URL is correct

### Debug Tools

- Enhanced Debug Panel (shake device)
- React Native Debugger
- Flipper (for advanced debugging)

## Scripts Reference

- `bun start` - Start Expo
- `bun dev` - Start with dev client
- `bun ios` - Run on iOS
- `bun android` - Run on Android
- `bun test` - Run tests
- `bun db:migrate` - Run migrations
- `bun db:reset` - Reset database