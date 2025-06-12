# Project Structure Reference

## Overview
This document provides a comprehensive overview of the project structure for the Full-Stack Expo Starter Kit.

## Directory Structure

```
my-expo/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (auth)/                  # Public authentication screens
│   │   ├── _layout.tsx          # Auth layout with redirect guard
│   │   ├── login.tsx            # Email/password login
│   │   ├── signup.tsx           # User registration
│   │   ├── complete-profile.tsx # OAuth profile completion
│   │   └── forgot-password.tsx  # Password reset flow
│   ├── (home)/                  # Protected app screens
│   │   ├── _layout.tsx          # Platform-specific tab navigation
│   │   ├── index.tsx            # Home dashboard
│   │   ├── explore.tsx          # Feature exploration
│   │   ├── settings.tsx         # User settings
│   │   ├── admin.tsx            # Admin dashboard
│   │   ├── manager.tsx          # Manager dashboard
│   │   ├── organization-dashboard.tsx # Organization management
│   │   ├── healthcare-dashboard.tsx   # Healthcare alerts
│   │   └── operator-dashboard.tsx     # Operator controls
│   ├── api/                     # API route handlers
│   │   ├── auth/                # Better Auth endpoints
│   │   ├── debug/               # Debug utilities
│   │   └── trpc/                # tRPC handler
│   ├── _layout.tsx              # Root layout with providers
│   ├── index.tsx                # Entry point with auth routing
│   ├── auth-callback.tsx        # OAuth callback handler
│   └── +not-found.tsx           # 404 page
│
├── components/                   # Reusable UI components
│   ├── universal/               # 48+ Universal Design System components
│   │   ├── charts/              # Chart components
│   │   └── [components...]      # All universal components
│   ├── organization/            # Organization management components
│   │   ├── blocks/              # Golden ratio organization blocks
│   │   │   ├── OrganizationOverviewBlock.tsx
│   │   │   ├── MemberManagementBlock.tsx
│   │   │   ├── OrganizationMetricsBlock.tsx
│   │   │   ├── QuickActionsBlock.tsx
│   │   │   ├── GeneralSettingsBlock.tsx
│   │   │   ├── SecuritySettingsBlock.tsx
│   │   │   ├── NotificationSettingsBlock.tsx
│   │   │   ├── FeatureSettingsBlock.tsx
│   │   │   └── index.ts
│   │   └── OrganizationCreationWizard.tsx
│   ├── healthcare/              # Healthcare-specific components
│   │   └── blocks/              # Healthcare alert blocks
│   ├── shadcn/ui/               # shadcn/ui components for RN
│   ├── ui/                      # Core UI components
│   ├── navigation/              # Navigation components
│   ├── WebTabBar.tsx            # Custom tab bar for web
│   ├── GoogleSignInButton.tsx   # OAuth button
│   ├── ProtectedRoute.tsx       # Route protection
│   └── [other components...]
│
├── lib/                         # Core libraries and utilities
│   ├── auth/                    # Authentication system
│   ├── core/                    # Core utilities
│   ├── api/                     # API client
│   │   └── trpc.tsx             # tRPC client setup
│   ├── core/                    # Core utilities
│   │   ├── config/              # Environment configuration
│   │   ├── debug/               # Logging and debugging
│   │   │   └── logger.ts        # Structured logging
│   │   └── platform/            # Platform-specific utilities
│   ├── design/                  # Design system
│   │   ├── animation-variants.ts # Animation configurations
│   │   ├── responsive.ts        # Responsive utilities
│   │   └── spacing.ts           # Spacing scales
│   ├── navigation/              # Navigation utilities
│   ├── stores/                  # Zustand stores (8 stores)
│   ├── theme/                   # Theme system
│   │   └── provider.tsx         # Theme provider
│   ├── ui/                      # UI utilities
│   │   ├── animations/          # Animation system
│   │   └── haptics/             # Haptic feedback
│   └── validations/             # Zod schemas
│       ├── common.ts            # Common validation schemas
│       ├── auth.ts              # Auth validation schemas
│       ├── organization.ts      # Organization validation schemas
│       └── index.ts             # Central exports
│
├── src/                         # Backend source code
│   ├── db/                      # Database layer
│   │   ├── schema.ts            # User/auth tables
│   │   ├── healthcare-schema.ts # Healthcare tables
│   │   ├── organization-schema.ts # Organization tables
│   │   └── index.ts             # DB exports
│   └── server/                  # tRPC server
│       ├── middleware/          # tRPC middleware
│       ├── routers/             # API routes
│       │   ├── auth.ts          # Auth procedures
│       │   ├── admin.ts         # Admin procedures
│       │   ├── healthcare.ts    # Healthcare procedures
│       │   ├── organization.ts  # Organization procedures
│       │   └── index.ts         # Router exports
│       ├── services/            # Business logic
│       │   ├── access-control.ts
│       │   ├── organization-access-control.ts
│       │   ├── audit.ts
│       │   └── index.ts
│       └── trpc.ts              # tRPC config
│
├── types/                       # TypeScript definitions
│   ├── api/                     # API types
│   ├── auth.ts                  # Auth types
│   └── components/              # Component types
│
├── hooks/                       # Custom React hooks
├── constants/                   # App constants
├── assets/                      # Static assets
├── scripts/                     # Build and utility scripts
├── __tests__/                   # Test suites
└── docs/                        # Documentation
    ├── guides/                  # How-to guides
    ├── api/                     # API documentation
    ├── archive/                 # Historical docs
    ├── planning/                # Project planning
    ├── reference/               # Technical reference
    └── status/                  # Status reports
```

## Key Files

### Configuration Files
- `app.json` - Expo configuration
- `eas.json` - EAS Build configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - TailwindCSS/NativeWind
- `metro.config.js` - Metro bundler config
- `drizzle.config.ts` - Database ORM config
- `jest.config.js` - Test configuration

### Documentation
- `README.md` - Main project documentation
- `CLAUDE.md` - AI agent context and memory
- `docs/INDEX.md` - Documentation index

### Environment
- `.env.local` - Local environment variables
- `.env.example` - Environment template

## Component Organization

### UI Components (`/components`)
- **universal/** - 48+ Universal Design System components
- **organization/** - Organization management components
  - blocks/ - Golden ratio UI blocks
  - OrganizationCreationWizard - Multi-step wizard
- **healthcare/** - Healthcare alert system
- **shadcn/ui/** - Adapted shadcn/ui components
- **ui/** - Core UI primitives
- **navigation/** - Navigation components

### Authentication Components
- `GoogleSignInButton.tsx` - OAuth integration
- `ProtectedRoute.tsx` - Route protection
- `ProfileCompletionFlowEnhanced.tsx` - Profile wizard

### Platform-Specific
- `WebTabBar.tsx` - Web-specific tab navigation
- `*.ios.tsx` - iOS-specific components
- `*.android.tsx` - Android-specific components

## State Management

### Zustand Stores (`/lib/stores`)
- `auth-store.ts` - Authentication state
- `theme-store.ts` - Theme preferences
- `spacing-store.ts` - Spacing density settings
- `animation-store.ts` - Animation preferences
- `sidebar-store.ts` - Sidebar state
- `toast-store.ts` - Toast notifications
- `dialog-store.ts` - Dialog states
- `debug-store.ts` - Debug panel state
- Pure Zustand implementation (no Context API)

### TanStack Query
- API state management
- Cache configuration
- Optimistic updates

## Navigation Architecture

### File-Based Routing
- Expo Router v5 with file-based routing
- Route groups with `(name)` syntax
- Dynamic routes with `[param]` syntax

### Platform-Specific Navigation
- **Web**: Custom tab bar to prevent reloads
- **Mobile**: Native tab navigator

### Navigation Patterns
- `<Redirect />` for guards
- `router.push()` for navigation
- `router.replace()` for tab switches

## API Structure

### tRPC Routers
- **auth** - Authentication and user management
- **admin** - Admin dashboard and analytics
- **healthcare** - Healthcare alert system
- **organization** - Organization management
  - CRUD operations
  - Member management
  - Settings and configuration
  - Activity logging
  - Invitation codes

### Database Schema
- **User Tables** - Users, sessions, accounts
- **Organization Tables**
  - organization - Core org data
  - organization_member - User-org relationships
  - organization_settings - Configuration
  - organization_code - Join codes
  - organization_activity_log - Audit trail
  - organization_invitation - Pending invites
- **Healthcare Tables** - Alerts, patients, escalations

### tRPC Routers (`/src/server/routers`)
- `auth.ts` - Authentication endpoints
- Role-based and permission-based procedures

### Middleware (`/src/server/middleware`)
- Authorization middleware
- Audit logging
- Error handling

### Services (`/src/server/services`)
- Business logic layer
- Database operations
- External integrations

## Testing Structure

### Test Organization (`/__tests__`)
- **unit/** - Unit tests
- **integration/** - Integration tests
- **e2e/** - End-to-end tests
- **manual/** - Manual test procedures

### Test Coverage
- 98%+ coverage (158/161 tests passing)
- Comprehensive auth flow tests
- Navigation tests

## Build & Deployment

### Scripts (`/scripts`)
- Development utilities
- Build scripts
- Database management
- Testing utilities

### Credentials (`/credentials`)
- iOS certificates
- Android keystore
- Environment configs

## Documentation Organization

### Guides (`/docs/guides`)
- How-to guides
- Best practices
- Setup instructions

### Reference (`/docs/reference`)
- Technical specifications
- API documentation
- Architecture details

### Archive (`/docs/archive`)
- Historical fixes
- Deprecated features
- Legacy documentation

## Best Practices

1. **File Naming**
   - Components: PascalCase
   - Utilities: camelCase
   - Constants: UPPER_SNAKE_CASE

2. **Component Structure**
   - One component per file
   - Platform-specific with `.platform.tsx`
   - Colocate styles and types

3. **State Management**
   - Zustand for client state
   - TanStack Query for server state
   - No Context API anti-patterns

4. **Navigation**
   - File-based routing
   - Platform-specific optimizations
   - Consistent navigation patterns

5. **Testing**
   - Colocate tests with code
   - Comprehensive coverage
   - E2E for critical flows