# Test Suite Migration Plan

## Overview
Complete migration of all tests to jest-expo with proper organization and modern patterns.

## Current State Analysis

### 📊 Test Statistics
- **Total Test Files**: 65
- **Old Animation Tests**: 9 (in backup)
- **Tests Needing Updates**: ~40
- **Well-Structured Tests**: ~15
- **Duplicate Tests**: ~5

### 🔴 Critical Issues
1. Old animation tests using deprecated patterns
2. Mixed naming conventions (`.test.tsx` vs `-test.tsx`)
3. TypeScript errors masked with `@ts-nocheck`
4. Incompatible mocks with jest-expo
5. Missing test utilities

## Migration Phases

### Phase 1: Infrastructure Update (Week 1)

#### 1.1 Create Test Utilities
```typescript
// testing/test-utils.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TRPCProvider } from '@/lib/api/trpc';
import { SessionProvider } from '@/components/providers/SessionProvider';

export const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider>
    <TRPCProvider>
      <SessionProvider>
        {children}
      </SessionProvider>
    </TRPCProvider>
  </SafeAreaProvider>
);

export const renderWithProviders = (ui: React.ReactElement, options?: any) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react-native';
```

#### 1.2 Update Mock Structure
```
__mocks__/
├── @react-native-async-storage/
│   └── async-storage.js
├── react-native-reanimated.js
├── expo-router.js
├── @tanstack/
│   └── react-query.js
└── @/
    ├── lib/
    │   ├── api/
    │   │   └── trpc.js
    │   └── stores/
    │       ├── auth-store.js
    │       └── theme-store.js
    └── hooks/
        └── useAuth.js
```

#### 1.3 Fix jest.setup.js
```javascript
// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// Silence specific warnings
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    const msg = args[0]?.toString() || '';
    if (
      msg.includes('Animated') ||
      msg.includes('useNativeDriver') ||
      msg.includes('VirtualizedLists')
    ) return;
    originalWarn(...args);
  };
});

// Global mocks
jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-reanimated', () => 
  require('react-native-reanimated/mock')
);
```

### Phase 2: Animation Tests Migration (Week 2)

#### 2.1 Migrate Animation Utilities
```typescript
// __tests__/utils/animation-test-utils.ts
import { act } from '@testing-library/react-native';

export const mockAnimationDriver = () => {
  jest.useFakeTimers();
  
  return {
    runAnimation: (duration: number) => {
      act(() => {
        jest.advanceTimersByTime(duration);
      });
    },
    cleanup: () => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  };
};

export const expectAnimatedStyle = (element: any, style: any) => {
  const animatedProps = element.props.style;
  expect(animatedProps).toMatchObject(style);
};
```

#### 2.2 Migration Example
**Old Pattern** (backup/animations/hooks.test.ts):
```typescript
// @ts-nocheck
import { renderHook, act } from '@testing-library/react-hooks';
import { useAnimatedStyle } from 'react-native-reanimated';
```

**New Pattern**:
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

describe('Animation Hooks', () => {
  it('should animate opacity', () => {
    const { result } = renderHook(() => useOpacityAnimation());
    
    act(() => {
      result.current.fadeIn();
    });
    
    expect(result.current.opacity).toBe(1);
  });
});
```

#### 2.3 Files to Migrate
1. `simple.test.ts` → `animations-simple.test.ts`
2. `hooks.test.ts` → `animation-hooks.test.ts`
3. `store.test.ts` → `animation-store.test.ts`
4. `platform.test.tsx` → `animation-platform.test.tsx`
5. `integration.test.tsx` → `animation-integration.test.tsx`
6. `variants.test.ts` → `animation-variants.test.ts`
7. `button-animations.test.tsx` → `button-animation.test.tsx`
8. `card-animations.test.tsx` → `card-animation.test.tsx`
9. `list-animations.test.tsx` → `list-animation.test.tsx`

### Phase 3: Standardization (Week 3)

#### 3.1 Naming Convention
- **Rule**: Use `-test.tsx` suffix (not `.test.tsx`)
- **Location**: Keep in `__tests__` directory
- **Structure**:
  ```
  __tests__/
  ├── unit/
  │   ├── hooks/
  │   ├── utils/
  │   └── stores/
  ├── components/
  │   ├── universal/
  │   ├── blocks/
  │   └── navigation/
  ├── integration/
  │   ├── auth/
  │   ├── healthcare/
  │   └── api/
  └── animations/
      ├── core/
      └── components/
  ```

#### 3.2 Remove Duplicates
- Merge `simple.test.ts` files
- Consolidate healthcare test variants
- Remove old backup files after migration

#### 3.3 Fix TypeScript Issues
- Remove all `@ts-nocheck` directives
- Add proper type definitions
- Use jest-expo type augmentations

### Phase 4: Documentation & Best Practices (Week 4)

#### 4.1 Create Test Templates
```typescript
// testing/templates/component-test-template.tsx
import React from 'react';
import { renderWithProviders, fireEvent, waitFor } from '@/testing/test-utils';
import { ComponentName } from '@/components/path/to/component';

describe('ComponentName', () => {
  const defaultProps = {
    // default props
  };

  it('should render correctly', () => {
    const { getByText } = renderWithProviders(
      <ComponentName {...defaultProps} />
    );
    
    expect(getByText('Expected Text')).toBeTruthy();
  });

  it('should handle user interaction', async () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <ComponentName {...defaultProps} onPress={onPress} />
    );
    
    fireEvent.press(getByTestId('button'));
    
    await waitFor(() => {
      expect(onPress).toHaveBeenCalled();
    });
  });
});
```

#### 4.2 Update Testing Guide
- Add migration examples
- Document new patterns
- Create troubleshooting section

## Implementation Checklist

### Week 1: Infrastructure
- [ ] Create `testing/test-utils.tsx`
- [ ] Update all mocks for jest-expo
- [ ] Fix `jest.setup.js`
- [ ] Create animation test utilities
- [ ] Set up provider wrappers

### Week 2: Animation Migration
- [x] Migrate `simple.test.ts` → `animation-config-test.ts`
- [x] Migrate `hooks.test.ts` → `animation-hooks-test.ts`
- [x] Migrate `store.test.ts` → `animation-store-test.ts`
- [x] Migrate `platform.test.tsx` → `animation-platform-test.tsx`
- [x] Migrate `integration.test.tsx` → `animation-integration-test.tsx`
- [x] Migrate `variants.test.ts` → `animation-variants-test.ts`
- [x] Migrate component animation tests
  - [x] `button-animations.test.tsx` → `button-animation-test.tsx`
  - [x] `card-animations.test.tsx` → `card-animation-test.tsx`
  - [x] `list-animations.test.tsx` → `list-animation-test.tsx`
- [ ] Remove old animation test utilities

### Week 3: Standardization
- [ ] Rename all test files to `-test.tsx` pattern
- [ ] Reorganize test directory structure
- [ ] Remove duplicate tests
- [ ] Fix all TypeScript errors
- [ ] Update import paths

### Week 4: Documentation
- [ ] Create component test template
- [ ] Create hook test template
- [ ] Update TESTING.md
- [ ] Add troubleshooting guide
- [ ] Create migration guide

## Success Metrics

- ✅ All tests use jest-expo preset
- ✅ No `@ts-nocheck` directives
- ✅ Consistent naming convention
- ✅ No duplicate tests
- ✅ All tests passing on all platforms
- ✅ Coverage > 75%

## Migration Commands

```bash
# Run migrated tests
bun test:all

# Check for TypeScript errors
bun type-check

# Generate coverage report
bun test:coverage

# Run specific platform tests
bun test:ios
bun test:android
bun test:web
```

## Notes

1. **Priority**: Start with most used components/hooks
2. **Backwards Compatibility**: Keep old tests until new ones pass
3. **Platform Testing**: Ensure tests work on all platforms
4. **Performance**: Use jest-expo's optimizations

This migration will result in a modern, maintainable test suite that works seamlessly with Expo and React Native.