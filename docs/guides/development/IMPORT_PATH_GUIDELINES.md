# Import Path Guidelines

## Overview

This guide explains the correct import paths for various modules in the Expo Modern Starter Kit and how to resolve common import errors.

## Import Path Conventions

### 1. Hooks

#### Responsive Hooks
```typescript
// ✅ Correct - Import from index
import { useResponsive, useResponsiveValue } from '@/hooks/responsive/index';
import { useBreakpoint } from '@/hooks/responsive/index';

// ❌ Incorrect - Missing index
import { useResponsive } from '@/hooks/responsive'; // Will fail
```

#### Individual Hooks
```typescript
// ✅ Correct - Direct import
import { useShadow } from '@/hooks/useShadow';
import { useTheme } from '@/hooks/useTheme';
import { useSpacing } from '@/hooks/core/useSpacing';
```

### 2. UI Utilities

#### Haptics
```typescript
// ✅ Correct
import { haptic } from '@/lib/ui/haptics';

// The haptics.ts file re-exports from haptics/index.tsx
```

#### Animations
```typescript
// ✅ Correct
import { useAnimation } from '@/lib/ui/animations/hooks';
import { ANIMATION_CONFIGS } from '@/lib/ui/animations/constants';
```

### 3. Stores

```typescript
// ✅ Correct
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAuthStore } from '@/lib/stores/auth-store';
```

### 4. Components

```typescript
// ✅ Correct
import { Button } from '@/components/universal/Button';
import { AlertSummary } from '@/components/blocks/healthcare/AlertSummary';
```

### 5. Core Utilities

```typescript
// ✅ Correct
import { cn } from '@/lib/core/utils';
import { log } from '@/lib/core/debug/logger';
```

## Common Import Errors and Solutions

### Error: Cannot find module '@/hooks/responsive'

**Problem**: Missing `/index` in the import path

**Solution**:
```typescript
// Change this:
import { useResponsive } from '@/hooks/responsive';

// To this:
import { useResponsive } from '@/hooks/responsive/index';
```

### Error: Cannot find module '@/lib/ui/haptics'

**Problem**: The haptics module might not be properly exported

**Solution**:
1. Check if `/lib/ui/haptics.ts` exists
2. Ensure it re-exports from the actual implementation:
```typescript
// lib/ui/haptics.ts
export * from './haptics/index';
```

### Error: Property 'className' does not exist

**Problem**: React Native components don't support className prop

**Solution**:
```typescript
// ❌ Incorrect - React Native doesn't support className
<View className="flex-row items-center">

// ✅ Correct - Use style prop
<View style={{ flexDirection: 'row', alignItems: 'center' }}>

// ✅ Or use styled components with NativeWind (on supported components)
<Text className="text-primary"> // Text supports className via NativeWind
```

## NativeWind className Limitations

### Components that DON'T support className:
- `View` (use style prop)
- `Pressable` / `AnimatedPressable`
- `ScrollView`
- `FlatList`
- Most React Native core components

### Components that DO support className:
- Custom components that explicitly handle className
- Components wrapped with NativeWind's styled() function
- Text component (with NativeWind setup)

### Example: Button Component Fix
```typescript
// ❌ Before - Using className on AnimatedPressable
<AnimatedPressable
  className="flex-row items-center justify-center"
  style={animatedStyle}
>

// ✅ After - Using style prop
<AnimatedPressable
  style={[
    {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    animatedStyle
  ]}
>
```

## TypeScript Path Configuration

The project uses TypeScript path aliases configured in the build tools:

- `@/` maps to the project root
- This is handled by Metro bundler and Babel

If you're getting persistent import errors:
1. Restart the Metro bundler
2. Clear the cache: `npx expo start -c`
3. Check that the file actually exists at the path
4. Ensure proper file extensions (.ts, .tsx)

## Best Practices

1. **Always use absolute imports** with the `@/` prefix for consistency
2. **Check if an index file exists** when importing from directories
3. **Use the style prop** for React Native component styling
4. **Keep imports organized** in this order:
   - React/React Native
   - Third-party libraries
   - Absolute imports (@/)
   - Relative imports
   - Types

## Module Structure Reference

```
hooks/
  responsive/
    index.ts         # Export all responsive hooks
    useResponsive.ts
    useResponsiveValue.ts
  useShadow.ts
  useTheme.ts

lib/
  ui/
    haptics.ts       # Re-exports from haptics/index.tsx
    haptics/
      index.tsx      # Main haptics implementation
    animations/
      hooks.ts
      constants.ts
  stores/
    animation-store.ts
    spacing-store.ts
    auth-store.ts
  core/
    utils.ts
    debug/
      logger.ts
```

## Troubleshooting Checklist

- [ ] Is the import path complete (including `/index` where needed)?
- [ ] Does the file exist at the specified path?
- [ ] Are you using className on a React Native component?
- [ ] Have you restarted Metro after adding new files?
- [ ] Is the file extension correct (.ts vs .tsx)?
- [ ] Are there any circular dependencies?

## Need Help?

If you're still experiencing import issues:
1. Check the file exists: `ls -la [path]`
2. Look for similar imports in other files: `grep -r "from '@/lib/ui/haptics'" .`
3. Clear all caches and restart: `npx expo start -c`