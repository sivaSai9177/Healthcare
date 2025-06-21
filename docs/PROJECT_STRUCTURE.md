# Project Structure Documentation

## Overview

This document outlines the complete project structure of the Hospital Alert System, explaining the purpose of each directory and key files.

## Root Directory Structure

```
my-expo/
├── .claude/                 # Claude AI configuration
├── .expo/                   # Expo configuration (git-ignored)
├── .github/                 # GitHub Actions and workflows
├── __tests__/              # Test files
├── app/                    # Expo Router screens
├── assets/                 # Static assets (images, fonts)
├── components/             # Reusable React components
├── config/                 # Configuration files
├── constants/              # App-wide constants
├── contexts/               # React contexts (legacy)
├── docs/                   # Documentation
├── drizzle/                # Database migrations
├── hooks/                  # Custom React hooks
├── lib/                    # Core libraries and utilities
├── scripts/                # Build and utility scripts
├── src/                    # Backend source code
├── types/                  # TypeScript type definitions
└── web/                    # Web-specific files

## Directory Details

### `/app` - Expo Router Screens
File-based routing for the application:
```
app/
├── (auth)/                 # Authentication flow
│   ├── _layout.tsx        # Auth layout
│   ├── login.tsx          # Login screen
│   ├── register.tsx       # Registration
│   └── oauth-callback.tsx # OAuth handler
├── (tabs)/                # Main app tabs
│   ├── _layout.tsx        # Tab navigator
│   ├── index.tsx          # Dashboard
│   ├── alerts.tsx         # Active alerts
│   ├── patients.tsx       # Patient management
│   └── settings.tsx       # User settings
├── (healthcare)/          # Healthcare screens
│   ├── alert-details.tsx  # Alert details
│   ├── create-alert.tsx   # Create alert
│   └── escalation-queue.tsx # Escalations
├── _layout.tsx            # Root layout
└── index.tsx              # Entry point
```

### `/__tests__` - Test Suite
Comprehensive test coverage with jest-expo:
```
__tests__/
├── animations/            # Animation system tests
│   ├── core/             # Core animation logic
│   │   ├── animation-config-test.ts
│   │   ├── animation-hooks-test.ts
│   │   └── animation-store-test.ts
│   ├── platform/         # Platform-specific tests
│   │   └── animation-platform-test.tsx
│   ├── integration/      # Integration scenarios
│   │   └── animation-integration-test.tsx
│   ├── variants/         # Variant system tests
│   │   └── animation-variants-test.ts
│   └── components/       # Component animations
│       ├── button-animation-test.tsx
│       ├── card-animation-test.tsx
│       └── list-animation-test.tsx
├── unit/                 # Unit tests
│   ├── hooks/           # Hook tests
│   ├── utils/           # Utility tests
│   └── stores/          # Store tests
├── components/          # Component tests
│   ├── universal/       # Universal components
│   ├── blocks/          # Block components
│   └── navigation/      # Navigation tests
├── integration/         # Integration tests
│   ├── auth/           # Auth flows
│   ├── healthcare/     # Healthcare workflows
│   └── api/            # API integration
├── e2e/                # End-to-end tests
│   └── maestro/        # Maestro test flows
├── helpers/            # Test utilities
├── mocks/              # Test mocks
├── setup/              # Test setup files
└── utils/              # Test utilities
    └── animation-test-utils.ts
```

### `/components` - Component Library
Organized by category:
```
components/
├── universal/             # Core UI components
│   ├── Button.tsx        # Button component
│   ├── Input.tsx         # Form input
│   ├── Text.tsx          # Typography
│   └── ... (60+ components)
├── blocks/               # Feature blocks
│   ├── auth/            # Auth components
│   ├── dashboard/       # Dashboard blocks
│   ├── healthcare/      # Healthcare blocks
│   ├── navigation/      # Navigation components
│   └── organization/    # Org management
├── providers/           # Context providers
├── navigation/          # Navigation components
└── index.ts            # Component exports
```

### `/lib` - Core Libraries
Business logic and utilities:
```
lib/
├── api/                # API client setup
│   ├── client.ts      # tRPC client
│   └── hooks.ts       # API hooks
├── auth/              # Authentication
│   ├── auth.ts        # Better Auth config
│   └── client.ts      # Auth client
├── core/              # Core utilities
│   ├── config/        # Configuration
│   │   └── unified-env.ts # Environment config
│   ├── debug/         # Logging & debugging
│   │   ├── logger.ts  # Base logger
│   │   ├── unified-logger.ts # Unified logger
│   │   ├── trpc-logger.ts # TRPC logger
│   │   └── trpc-logger-enhanced.ts # Enhanced TRPC logger
│   └── utils.ts       # Utilities
├── design/            # Design system
│   ├── tokens.ts      # Design tokens
│   └── responsive.ts  # Responsive utils
├── stores/            # Zustand stores
│   ├── auth-store.ts  # Auth state
│   ├── theme-store.ts # Theme state
│   └── spacing-store.ts # Spacing state
└── ui/               # UI utilities
    ├── animations/   # Animation configs
    └── haptics.ts    # Haptic feedback
```

### `/src` - Backend Code
Server-side implementation:
```
src/
├── db/               # Database layer
│   ├── index.ts     # DB connection
│   ├── schema.ts    # Main schema
│   └── healthcare-schema.ts # Healthcare tables
├── server/          # Server implementation
│   ├── routers/     # tRPC routers
│   │   ├── auth.ts  # Auth endpoints
│   │   ├── user.ts  # User management
│   │   └── healthcare.ts # Healthcare APIs
│   ├── services/    # Business services
│   │   ├── notifications/ # Push notifications
│   │   ├── escalation-timer.ts # Escalations
│   │   └── audit.ts     # Audit logging
│   ├── logging/     # Logging service
│   │   ├── service.ts   # Logging implementation
│   │   └── start.ts     # Service entry point
│   ├── websocket/   # WebSocket server
│   │   ├── server.ts    # WS implementation
│   │   └── start.js     # Service entry
│   ├── email/       # Email service
│   │   └── service.ts   # Email implementation
│   ├── middleware/  # tRPC middleware
│   │   └── rate-limit.ts # Rate limiting
│   ├── trpc.ts     # tRPC setup
│   └── index.ts     # Server entry
└── scripts/         # Database scripts
    └── seed.ts      # Seed data
```

### `/types` - TypeScript Definitions
Type definitions and interfaces:
```
types/
├── auth.ts          # Auth types
├── healthcare.ts    # Healthcare types
├── navigation.ts    # Navigation types
├── api.ts          # API types
└── index.ts        # Type exports
```

### `/docs` - Documentation
Project documentation:
```
docs/
├── modules/                    # Module docs
│   ├── DESIGN_SYSTEM.md       # Design system
│   ├── BACKEND_ARCHITECTURE.md # Backend docs
│   ├── FRONTEND_ARCHITECTURE.md # Frontend docs
│   └── TECH_STACK.md          # Technology stack
├── guides/                    # How-to guides
│   ├── deployment/           # Deployment guides
│   └── development/          # Dev guides
├── archive/                  # Old documentation
├── INDEX.md                  # Documentation index
└── PROJECT_STRUCTURE.md      # This file
```

### `/config` - Configuration
App configuration files:
```
config/
├── env.ts           # Environment config
├── sentry.ts        # Error tracking
└── theme.ts         # Theme configuration
```

### `/scripts` - Utility Scripts
Build and development scripts:
```
scripts/
├── organize-root-directory.ts # File organization
├── reset-project.js          # Project reset
├── build-web.js             # Web build script
├── start-logging-service.sh  # Start logging service
├── start-posthog.sh         # Start PostHog
├── test-logging-service.ts  # Test logging
├── demo-trpc-logging.ts     # Demo TRPC logging
└── setup-healthcare-complete.ts # Healthcare setup
```

### `/docker` - Docker Configuration
Container configurations:
```
docker/
├── Dockerfile.websocket    # WebSocket service
├── Dockerfile.email       # Email service
├── Dockerfile.logging     # Logging service
├── Dockerfile.worker      # Queue worker
├── nginx/                 # Nginx config
└── posthog/              # PostHog config
```

## Key Files

### Root Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `babel.config.js` - Babel configuration
- `metro.config.js` - Metro bundler config
- `webpack.config.js` - Webpack for web
- `tailwind.config.js` - Tailwind CSS config
- `app.json` - Expo configuration
- `eas.json` - EAS Build configuration

### Environment Files
- `.env` - Local environment variables
- `.env.local` - Local overrides
- `.env.production` - Production config
- `.env.production.example` - Production template

### Development Files
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `jest.config.js` - Jest test configuration
- `.gitignore` - Git ignore rules

### Docker Files
- `docker-compose.yml` - Main Docker configuration
- `docker-compose.local.yml` - Local development services
- `docker-compose.prod.yml` - Production configuration
- `docker-compose.posthog-simple.yml` - PostHog setup

## File Naming Conventions

### Components
- `PascalCase.tsx` - React components
- `use-kebab-case.ts` - Custom hooks
- `kebab-case.ts` - Utilities and helpers
- `SCREAMING_SNAKE_CASE.ts` - Constants

### Styles
- Component styles use Tailwind classes
- No separate style files (NativeWind)

### Tests
- `component-name-test.tsx` - Component tests (new pattern)
- `hook-name-test.ts` - Hook tests (new pattern)
- `util-name-test.ts` - Utility tests (new pattern)
- Migration in progress from `.test.tsx` to `-test.tsx`

## Import Organization

Standard import order:
```typescript
// 1. React/React Native
import React from 'react';
import { View, Text } from 'react-native';

// 2. Third-party libraries
import { useRouter } from 'expo-router';
import { z } from 'zod';

// 3. Absolute imports (@ alias)
import { Button } from '@/components/universal/Button';
import { api } from '@/lib/api/client';

// 4. Relative imports
import { LocalComponent } from './LocalComponent';
import { helperFunction } from '../utils';

// 5. Types
import type { User } from '@/types/auth';
```

## Build Outputs

### Development
- `.expo/` - Expo development files
- `node_modules/` - Dependencies

### Production
- `dist/` - Web build output
- `ios/` - iOS build files
- `android/` - Android build files

## Best Practices

1. **Component Organization**: Group by feature, not by type
2. **Code Colocation**: Keep related code together
3. **Barrel Exports**: Use index.ts for clean imports
4. **Type Safety**: Prefer TypeScript over JavaScript
5. **Documentation**: Document complex logic inline

## Migration Notes

### From Old Structure
- Moved all docs to `/docs/archive/`
- Consolidated component structure
- Unified configuration files
- Removed redundant scripts

### Future Structure Changes
- Consider monorepo structure for scale
- Separate packages for shared code
- Extract design system as package