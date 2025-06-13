# Bundling Issues and Solutions

## Date: January 7, 2025

## Overview
This document outlines the bundling issues encountered in the healthcare-mvp-backup branch and the solutions implemented to resolve them.

## Key Issues Identified

### 1. **Metro Bundler Cache Issue**
- **Problem**: Metro was showing syntax errors from old cached versions of files that had already been fixed
- **Symptom**: `SyntaxError: Missing semicolon` in auth.ts even though the file was correct
- **Solution**: Clear all caches including Metro, node_modules, and .expo

### 2. **import.meta Transformation**
- **Problem**: `unstable_transformImportMeta: true` in babel.config.js was causing bundler warnings
- **Details**: 
  - import.meta is an ES2020 feature that Metro doesn't fully support
  - We weren't actually using import.meta in our code
  - This experimental feature was causing instability
- **Solution**: Removed `unstable_transformImportMeta: true` from babel configuration

### 3. **Drizzle-kit Bundling Concerns**
- **Finding**: drizzle-kit is NOT used in client-side code (which is correct)
- **Location**: Only used in:
  - devDependencies (correct)
  - Build scripts for database migrations
  - Server-side API routes
  - Test/setup scripts
- **Action**: No changes needed - proper separation maintained

### 4. **Folder Structure Confusion**
- **Problem**: Having `components/app` folder could cause confusion with the main `/app` directory
- **Solution**: Reorganized to clearer structure (see below)

## Solutions Implemented

### Phase 1: Cache Clearing
```bash
# Commands executed
pkill -f "expo start"
watchman watch-del-all
rm -rf node_modules .expo
rm -rf .expo/web/cache
bun install
```

### Phase 2: Configuration Fixes

#### babel.config.js
```javascript
// Removed:
unstable_transformImportMeta: true

// Final config:
module.exports = (api) => {
  api.cache(true);
  
  const plugins = [
    ["inline-import", { extensions: [".sql"] }],
  ];
  
  plugins.push([
    "react-native-reanimated/plugin",
    {
      globals: ['__reanimatedWorkletInit', '__reanimatedModuleProxy'],
    }
  ]);
  
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
        },
      ],
      "nativewind/babel",
    ],
    plugins,
  };
};
```

#### metro.config.js
```javascript
// Removed invalid option:
config.server = {
  host: 'localhost', // This was invalid
};
```

### Phase 3: Folder Reorganization

#### Final Structure:
```
components/
├── blocks/                 # All reusable block components
│   ├── navigation/        # Navigation-related blocks
│   │   ├── AppSidebarBlock.tsx
│   │   ├── NavigationBlock.tsx
│   │   ├── TeamSwitcherBlock.tsx
│   │   ├── UserMenuBlock.tsx
│   │   └── index.ts
│   ├── dashboard/         # General dashboard blocks
│   │   ├── MetricsOverviewBlock.tsx
│   │   ├── QuickActionsBlock.tsx
│   │   ├── WelcomeHeaderBlock.tsx
│   │   └── index.ts
│   ├── healthcare/        # Healthcare-specific blocks
│   │   ├── ActivePatientsBlock.tsx
│   │   ├── AlertSummaryBlock.tsx
│   │   ├── AlertCreationBlock.tsx
│   │   ├── AlertListBlock.tsx
│   │   ├── MetricsOverviewBlock.tsx
│   │   ├── PatientCardBlock.tsx
│   │   └── index.ts
│   ├── organization/      # Organization-specific blocks
│   │   ├── GeneralSettingsBlock.tsx
│   │   ├── MemberManagementBlock.tsx
│   │   ├── OrganizationMetricsBlock.tsx
│   │   ├── OrganizationOverviewBlock.tsx
│   │   ├── QuickActionsBlock.tsx
│   │   └── index.ts
│   └── index.ts
├── healthcare/            # Healthcare-specific components (non-blocks)
│   ├── AlertCreationForm.tsx
│   ├── AlertDashboard.tsx
│   ├── AlertTimeline.tsx
│   ├── EscalationTimer.tsx
│   └── index.ts
├── organization/          # Organization-specific components (non-blocks)
│   ├── OrganizationCreationWizard.tsx
│   └── index.ts
└── universal/            # Universal design system components
```

### Phase 4: Import Path Updates
All imports updated from:
- `@/components/healthcare/blocks` → `@/components/blocks/healthcare`
- `@/components/organization/blocks` → `@/components/blocks/organization`
- `@/components/app/blocks` → `@/components/blocks/*`

### Phase 5: ESLint Rule for Client-Server Separation
Created `.eslintrc.client.js` to prevent database imports in client code:
```javascript
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'drizzle-orm',
            message: 'Database imports are not allowed in client-side code.',
          },
          {
            name: 'drizzle-kit',
            message: 'drizzle-kit is a build tool and should not be imported.',
          },
        ],
      },
    ],
  },
};
```

## Results
- ✅ Bundling errors resolved
- ✅ No more import.meta warnings
- ✅ Clean separation between client and server code
- ✅ Organized folder structure
- ✅ Faster bundling without experimental features

## Best Practices Going Forward
1. Always clear caches when switching branches with significant changes
2. Avoid experimental Babel features unless absolutely necessary
3. Keep database operations strictly in API routes
4. Maintain clear folder structure with blocks separated by domain
5. Use ESLint rules to enforce architectural boundaries

## Additional Issues (January 12, 2025)

### 6. **CommonJS Interop Error**
- **Problem**: `_interopRequireDefault is not a function` error in web bundle
- **Cause**: Missing Babel runtime helpers for module interop
- **Solution**: Created babel-helpers.js with global helper functions

### 7. **import.meta in Dependencies**
- **Problem**: Dependencies using ES2020+ features not supported by Metro
- **Cause**: import.meta usage in third-party modules
- **Solution**: Custom babel plugin to transform import.meta references

### 8. **Component Export Mismatches**
- **Problem**: TypeScript errors for missing component exports
- **Cause**: API mismatch between expected (shadcn-style) and actual component APIs
- **Solution**: Updated all usages to match actual component APIs

### 9. **Theme Property Access**
- **Problem**: Code trying to access theme.colors.* but theme is flat
- **Cause**: Incorrect assumptions about theme structure
- **Solution**: Fixed all instances to use direct theme properties

## Updated Cache Clearing Commands
```bash
# Complete cache clear sequence
pkill -f "expo start"
pkill -f metro
rm -rf .expo node_modules/.cache
watchman watch-del-all 2>/dev/null || true
bun expo start --web --clear
```