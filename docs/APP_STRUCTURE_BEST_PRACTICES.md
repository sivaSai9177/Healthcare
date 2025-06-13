# App Structure Best Practices

## Date: January 7, 2025

## Overview
This document outlines the application structure following React Native/Expo best practices with proper separation of concerns.

## Directory Structure

```
my-expo/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (auth)/                  # Public auth screens group
│   │   ├── _layout.tsx          # Auth layout wrapper
│   │   ├── login.tsx            # Email/password login
│   │   ├── register.tsx         # User registration
│   │   ├── complete-profile.tsx # Profile completion
│   │   └── forgot-password.tsx  # Password reset
│   ├── (home)/                  # Protected app screens group
│   │   ├── _layout.tsx          # Tab navigation layout
│   │   ├── index.tsx            # Home dashboard
│   │   ├── healthcare-dashboard.tsx  # Healthcare main screen
│   │   ├── operator-dashboard.tsx    # Operator-specific screen
│   │   ├── organization-dashboard.tsx # Organization management
│   │   ├── organization-settings.tsx  # Organization settings
│   │   ├── admin.tsx            # Admin panel
│   │   ├── manager.tsx          # Manager dashboard
│   │   └── settings.tsx         # User settings
│   ├── api/                     # API routes
│   │   ├── auth/               # Better Auth endpoints
│   │   │   └── [...auth]+api.ts
│   │   ├── trpc/               # tRPC endpoints
│   │   │   └── [trpc]+api.ts
│   │   └── debug/              # Debug endpoints
│   │       └── user+api.ts
│   ├── _layout.tsx             # Root layout with providers
│   ├── index.tsx               # Entry point with auth routing
│   └── auth-callback.tsx       # OAuth callback handler
├── components/                  # Reusable UI components
│   ├── blocks/                 # Domain-specific block components
│   │   ├── navigation/         # Navigation blocks
│   │   ├── dashboard/          # Dashboard blocks
│   │   ├── healthcare/         # Healthcare blocks
│   │   ├── organization/       # Organization blocks
│   │   └── index.ts           # Block exports
│   ├── healthcare/             # Healthcare components
│   │   ├── AlertDashboard.tsx
│   │   ├── AlertTimeline.tsx
│   │   └── index.ts
│   ├── organization/           # Organization components
│   │   ├── OrganizationCreationWizard.tsx
│   │   └── index.ts
│   ├── universal/              # Universal design system
│   │   ├── Box.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ... (50+ components)
│   └── shadcn/                 # Shadcn UI components
├── lib/                        # Core utilities & configuration
│   ├── auth/                   # Authentication
│   │   ├── auth.ts            # Better Auth config
│   │   ├── auth-client.ts     # Client-side auth
│   │   └── auth-server.ts     # Server-side auth
│   ├── stores/                 # Zustand state management
│   │   ├── auth-store.ts      # Authentication state
│   │   ├── theme-store.ts     # Theme state
│   │   ├── spacing-store.ts   # Spacing preferences
│   │   └── index.ts
│   ├── design-system/          # Design tokens
│   │   ├── index.ts           # Core design system
│   │   ├── spacing-theme.ts   # Responsive spacing
│   │   └── theme-registry.ts  # Theme definitions
│   ├── core/                   # Core utilities
│   │   ├── logger.ts          # Structured logging
│   │   ├── env.ts             # Environment config
│   │   └── utils.ts
│   ├── validations/            # Zod schemas
│   │   ├── auth.ts
│   │   ├── healthcare.ts
│   │   └── server.ts
│   └── trpc.tsx               # tRPC client config
├── src/                        # Backend source code
│   ├── db/                     # Database layer
│   │   ├── schema.ts          # Main schema
│   │   ├── healthcare-schema.ts
│   │   ├── organization-schema.ts
│   │   └── index.ts
│   └── server/                 # tRPC server
│       ├── routers/            # API routers
│       │   ├── auth.ts
│       │   ├── healthcare.ts
│       │   ├── organization.ts
│       │   └── index.ts
│       ├── services/           # Business logic
│       │   ├── audit.ts
│       │   ├── notifications.ts
│       │   └── session.ts
│       └── trpc.ts            # tRPC config
├── hooks/                      # Custom React hooks
│   ├── useAuth.tsx
│   ├── useEnvironment.ts
│   └── useResponsive.ts
├── types/                      # TypeScript definitions
│   ├── auth.ts
│   ├── healthcare.ts
│   ├── organization.ts
│   └── api/
├── scripts/                    # Build & utility scripts
│   ├── setup-healthcare-local.ts
│   ├── start-with-healthcare.sh
│   └── ... (test & setup scripts)
└── Configuration Files
    ├── package.json
    ├── tsconfig.json
    ├── babel.config.js
    ├── metro.config.js
    ├── tailwind.config.ts
    └── drizzle.config.ts
```

## Key Principles

### 1. **Separation of Concerns**
- **app/**: Only navigation and screen components
- **components/**: Reusable UI components
- **lib/**: Business logic and utilities
- **src/**: Backend/server code

### 2. **Block Components Pattern**
- Blocks are higher-level components that combine multiple universal components
- Organized by domain (navigation, dashboard, healthcare, etc.)
- Easily composable and reusable across screens

### 3. **State Management**
- Zustand stores for client state (auth, theme, spacing)
- No Context API - pure Zustand
- Server state managed by TanStack Query via tRPC

### 4. **Database Access**
- NEVER import drizzle-orm in client code
- All database operations through tRPC procedures
- Clear client-server boundary

### 5. **Import Aliases**
- `@/` maps to project root
- Consistent imports across the codebase
- No relative imports for cross-module references

## Component Organization

### Universal Components
- Atomic, reusable components
- Work across all platforms (iOS, Android, Web)
- Follow design system tokens

### Block Components
- Combine universal components
- Domain-specific functionality
- Examples:
  - `AlertCreationBlock` - Complete alert creation UI
  - `MetricsOverviewBlock` - Dashboard metrics display
  - `NavigationBlock` - Navigation menu

### Feature Components
- Page-specific components
- Not intended for reuse
- Live alongside their screens

## Best Practices

1. **File Naming**
   - Components: PascalCase (Button.tsx)
   - Utilities: camelCase (logger.ts)
   - Configs: kebab-case (babel.config.js)

2. **Exports**
   - Use index.ts for clean imports
   - Re-export related components
   - Avoid default exports for components

3. **Type Safety**
   - Zod schemas for runtime validation
   - TypeScript for compile-time safety
   - Shared types between client/server

4. **Performance**
   - Lazy load heavy components
   - Use Suspense boundaries
   - Optimize bundle size

5. **Testing Structure**
   ```
   __tests__/
   ├── unit/          # Unit tests
   ├── integration/   # Integration tests
   └── e2e/          # End-to-end tests
   ```

## Migration Guidelines

When adding new features:
1. Place screens in appropriate app/ group
2. Create reusable blocks in components/blocks/[domain]
3. Keep database logic in src/server
4. Add validation schemas to lib/validations
5. Update relevant index.ts exports

## Common Patterns

### Protected Routes
```typescript
// In _layout.tsx
<Stack.Screen
  name="dashboard"
  options={{ protected: true }}
/>
```

### API Routes
```typescript
// In src/server/routers
export const featureRouter = router({
  getItems: protectedProcedure
    .input(schema)
    .query(async ({ ctx, input }) => {
      // Implementation
    }),
});
```

### State Management
```typescript
// In lib/stores
export const useFeatureStore = create<State>()(
  devtools(
    persist(
      immer((set) => ({
        // State and actions
      })),
      { name: 'feature-store' }
    )
  )
);
```

This structure ensures scalability, maintainability, and clear separation of concerns throughout the application.