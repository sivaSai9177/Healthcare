# Component Structure Guide

Last Updated: January 15, 2025

## Overview

This project uses a **block-based architecture** where all UI components (except universal design system components) are organized as self-contained blocks. This approach promotes modularity, reusability, and clear separation of concerns.

## Directory Structure

```
components/
├── blocks/                 # All feature-specific blocks
│   ├── auth/              # Authentication-related blocks
│   ├── dashboard/         # Dashboard components
│   ├── debug/             # Debug tools and panels
│   ├── forms/             # Form-specific blocks
│   ├── healthcare/        # Healthcare domain blocks
│   ├── navigation/        # Navigation components
│   ├── organization/      # Organization management
│   └── theme/             # Theme-related blocks
├── navigation/            # Standalone navigation components
├── providers/             # React context providers
├── ui/                    # UI utilities and helpers
├── universal/             # Universal design system (60+ components)
└── index.ts              # Main barrel export
```

## Block Architecture

### What is a Block?

A block is a self-contained UI component that:
- Has its own directory structure
- Contains its own business logic and hooks
- Exports typed interfaces
- Can be composed with other blocks
- Is domain or feature-specific

### Block Structure

Each block follows this structure:

```
blocks/feature/ComponentName/
├── ComponentName.tsx      # Main component
├── useComponentName.ts    # Component-specific hook (optional)
├── types.ts              # TypeScript interfaces
└── index.tsx             # Barrel export
```

### Example: GoogleSignIn Block

```
blocks/auth/GoogleSignIn/
├── GoogleSignIn.tsx       # Main button component
├── useGoogleSignIn.ts    # OAuth logic hook
├── types.ts              # GoogleSignInProps interface
└── index.tsx             # Exports
```

## Component Categories

### 1. Universal Components (60+)

Core design system components that are platform-agnostic:
- `Button`, `Card`, `Input`, `Text`, `Stack`, etc.
- Chart components (6 types)
- Layout components
- Form elements

These remain in `components/universal/` and are NOT blocks.

### 2. Feature Blocks

Self-contained components organized by domain:

#### Auth Blocks
- `GoogleSignIn` - OAuth sign-in button ✅ Migrated
- `ProfileCompletion` - Profile completion flow ✅ Migrated
- `ProtectedRoute` - Route protection wrapper ✅
- `SignIn` - Sign in form (TODO: Extract from app/login.tsx)
- `Register` - Registration form (TODO: Extract from app/register.tsx)
- `ForgotPassword` - Password reset (TODO: Extract from app/forgot-password.tsx)
- `VerifyEmail` - Email verification (TODO: Extract from app/verify-email.tsx)

#### Healthcare Blocks
- `AlertCreationForm` - Create new alerts
- `AlertDashboard` - Main alert dashboard
- `AlertTimeline` - Alert history timeline
- `EscalationTimer` - Escalation countdown
- `PatientCard` - Patient information display

#### Organization Blocks
- `OrganizationCreation` - Org creation wizard
- `MemberManagement` - Member management UI
- `OrganizationMetrics` - Metrics dashboard

### 3. Navigation Components

Standalone navigation utilities in `components/navigation/`:
- `AnimatedScreen` - Screen with animations
- `AnimatedTabBar` - Animated tab navigation
- `WebNavBar` - Web navigation bar
- `WebTabBar` - Web tab bar

### 4. Providers

Global React context providers in `components/providers/`:
- `ErrorBoundary` - Error handling
- `SyncProvider` - Data synchronization

### 5. UI Utilities

Platform-specific helpers in `components/ui/`:
- `TabBarBackground` - Tab bar styling
- `IconSymbol` - Icon component
- `ThemedText` - Themed text component
- `ThemedView` - Themed view component

## Import Guidelines

### Importing Blocks

```typescript
// Import from the specific block
import { AlertDashboard } from '@/components/blocks/healthcare/AlertDashboard';

// Or use the main barrel export
import { AlertDashboard } from '@/components';
```

### Importing Universal Components

```typescript
// Import directly from universal
import { Button, Card, Text } from '@/components/universal';

// Or use the main barrel export
import { Button, Card, Text } from '@/components';
```

## Creating New Blocks

When creating a new block:

1. **Choose the right category** - Place it under the appropriate domain in `blocks/`
2. **Create the directory structure**:
   ```bash
   mkdir -p components/blocks/domain/MyNewBlock
   ```

3. **Create required files**:
   - `MyNewBlock.tsx` - Main component
   - `types.ts` - TypeScript interfaces
   - `index.tsx` - Exports
   - `useMyNewBlock.ts` - Hook (if needed)

4. **Export from barrel files**:
   - Add to `components/blocks/domain/index.ts`
   - Add to `components/index.ts`

## Naming Conventions

- **Block directories**: PascalCase without "Block" suffix (e.g., `AlertDashboard`)
- **Component files**: Match directory name (e.g., `AlertDashboard.tsx`)
- **Hook files**: Prefix with "use" (e.g., `useAlertDashboard.ts`)
- **Type files**: Always `types.ts`
- **Index files**: Always `index.tsx`

## Migration Status

### Theme Migration Progress: 58.3%

| Category | Total | Migrated | Status |
|----------|-------|----------|---------|
| Dashboard | 3 | 3 | ✅ Complete |
| Organization | 6 | 6 | ✅ Complete |
| Auth | 3 | 3 | ✅ Complete |
| Forms | 2 | 2 | ✅ Complete |
| Theme | 3 | 3 | ✅ Complete |
| Debug | 5 | 5 | ✅ Consolidated |
| Healthcare | 9 | 7 | 🔄 77.8% (2 remaining) |
| Navigation | 7 | 5 | 🔄 71.4% (2 remaining) |

### Remaining Work
- Extract auth screens from `app/(auth)` to blocks (5 components)
- Migrate AlertTimeline and EscalationTimer (healthcare)
- Fix UserMenu and Navigation components

See [Remaining Migration Tasks](REMAINING_MIGRATION_TASKS.md) for details.

## Migration from Old Structure

Components have been migrated from:
- `components/app/` → `components/blocks/`
- `components/healthcare/` → `components/blocks/healthcare/`
- `components/organization/` → `components/blocks/organization/`

The "Block" suffix has been removed from all component names for cleaner imports.

## Best Practices

1. **Keep blocks focused** - Each block should have a single, clear purpose
2. **Use composition** - Combine smaller blocks to build complex UIs
3. **Separate concerns** - Business logic in hooks, UI in components
4. **Type everything** - All props and exports should be typed
5. **Document complex blocks** - Add JSDoc comments for complex components

## Legacy Support

For backward compatibility, some legacy exports are maintained in `components/index.ts`:

```typescript
// Legacy export (deprecated)
export { GoogleSignIn as GoogleSignInButton } from './blocks/auth/GoogleSignIn';

// New export (preferred)
export { GoogleSignIn } from './blocks/auth/GoogleSignIn';
```

These legacy exports will be removed in the next major version.