# 🚀 Quick Start Guide - Claude Context Module

*Last Updated: January 10, 2025*

## Development Commands

### Quick Start with Expo Go (Default)
```bash
# Start with Expo Go mode (default)
bun start              # Local network, Expo Go
bun start:tunnel       # Tunnel mode, Expo Go

# Environment-specific with Expo Go
bun local              # Local DB (Docker PostgreSQL)
bun dev                # Development DB (Neon Cloud)
bun staging            # Staging DB (Neon Cloud)

# Tunnel mode with environments
bun local:tunnel       # Local DB + Tunnel
bun dev:tunnel         # Dev DB + Tunnel
```

### Development Build Mode
```bash
# For development builds (not Expo Go)
bun start:dev          # Local network, dev build
bun start:tunnel:dev   # Tunnel mode, dev build
```

### Database Configuration
- **Local Development**: Uses Docker PostgreSQL (`APP_ENV=local`)
- **Development/Staging**: Uses Neon Cloud Database (`APP_ENV=development`)
- **Automatic Detection**: Based on `APP_ENV` environment variable

## Docker Development

### Initial Setup
```bash
# One-time setup
./scripts/docker-setup.sh

# Start development
docker-compose --profile development up

# Access services
# API: http://localhost:3000
# Expo: http://localhost:8081
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### Common Docker Commands
```bash
# Database operations
docker-compose exec api bun run db:migrate
docker-compose exec api bun run db:studio

# Run tests
docker-compose -f docker-compose.test.yml run test-runner

# View logs
docker-compose logs -f [service-name]

# Reset everything
docker-compose down -v
```

## Local Development

### Without Docker
```bash
# 1. Install dependencies
bun install
cp .env.example .env.local

# 2. Setup database
bun run db:generate
bun run db:migrate

# 3. Run development
bun run dev     # Web development
bun run ios     # iOS simulator
bun run android # Android emulator
```

### Local Development with Expo Go
```bash
# 1. Start local database (Docker required)
bun db:local:up

# 2. Run Expo Go with local database
bun expo:go:local  # Automatically uses local PostgreSQL

# Alternative: Use cloud database
bun expo:go       # Uses Neon cloud database
```

## Common Tasks

### Testing
```bash
# Run all tests
bun test

# Run specific test file
bun test auth.test.ts

# Run with coverage
bun test --coverage

# Run in watch mode
bun test --watch
```

### Linting & Formatting
```bash
# Check code quality
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format
```

### Building
```bash
# Production build
bun run build

# Preview build
bun run preview-build

# Android build
eas build --platform android --profile preview

# iOS build
eas build --platform ios --profile preview
```

### Database Management
```bash
# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Open Drizzle Studio
bun run db:studio

# Reset database
bun run db:reset
```

## OAuth Testing with Ngrok

```bash
# Start ngrok
bun run ngrok:start

# Update EAS config with ngrok URL
bun run ngrok:update-eas

# Build for Android OAuth testing
bun run ngrok:build:android

# Keep ngrok running during entire test session!
```

## Environment Variables

### Essential Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Auth
BETTER_AUTH_SECRET=your-secret-here
EXPO_PUBLIC_API_URL=http://localhost:8081

# OAuth (for Google Sign-In)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
```

### Expo Go Development
The `expo:go:local` script automatically sets:
- `APP_ENV=local`
- `DATABASE_URL=postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev`
- Forces Expo Go mode (bypasses development build requirement)

## Common Workflows

### 1. Start New Feature
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Start development
bun start

# 3. Make changes and test
# 4. Run tests
bun test

# 5. Commit changes
git add .
git commit -m "feat: add new feature"
```

### 2. Fix a Bug
```bash
# 1. Reproduce the issue
# 2. Write a failing test
# 3. Fix the bug
# 4. Verify test passes
bun test

# 5. Commit fix
git commit -m "fix: resolve issue with X"
```

### 3. Update Dependencies
```bash
# Update all dependencies
bun update

# Update specific package
bun add package@latest

# Check for outdated
bun outdated
```

## Debugging

### Enable Debug Mode
```bash
# Set in .env.local
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_LOG_LEVEL=debug
```

### View Logs
```bash
# API logs
docker-compose logs -f api

# Expo logs
# Check terminal where bun start is running

# Database queries
# Enable in Drizzle config
```

### Debug Tools
- Enhanced Debug Panel (in app)
- React Native Debugger
- Flipper (for native builds)
- Chrome DevTools (for web)

## Troubleshooting

### Common Issues
1. **OAuth in Expo Go**: Doesn't work, requires development build
2. **Text Node Errors**: Wrap bare text in Text components
3. **Tab Reload Issue**: Fixed with platform-specific implementation
4. **Mobile Token Storage**: Tokens stored in cookie format

### Quick Fixes
```bash
# Clear cache
bun clean

# Reset Metro bundler
bun start --clear

# Clean and rebuild
rm -rf node_modules
bun install
```

## Useful Scripts

### Development Scripts
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run test` - Run tests
- `bun run lint` - Check code quality

### Database Scripts
- `bun run db:migrate` - Run migrations
- `bun run db:studio` - Open database UI
- `bun run db:reset` - Reset database

### Utility Scripts
- `bun run type-check` - Check TypeScript
- `bun run clean` - Clean caches
- `bun run doctor` - Check environment

---

*This module contains quick start commands and workflows. For detailed guides, see other context modules.*