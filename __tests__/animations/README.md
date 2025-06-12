# Animation Tests

This directory contains comprehensive tests for the Tailwind-based animation system.

## Test Structure

### Setup (`setup.ts`)
- Mock configuration for React Native Reanimated
- Platform-specific test utilities
- Animation test helper functions

### Core Tests

1. **`simple.test.ts`** ✅
   - Basic configuration loading
   - Variant system verification

2. **`variants.test.ts`** ✅
   - Animation variant configurations
   - Variant merging and adjustments
   - Device tier handling
   - Animation presets

3. **`store.test.ts`** ⚠️
   - Animation preferences storage
   - State management
   - Persistence to AsyncStorage
   - Note: Some hydration tests may fail due to async timing

4. **`hooks.test.ts`** ❌
   - Animation hooks (`useAnimation`, `useTransition`, etc.)
   - Platform-specific behavior
   - Requires additional mocking setup

5. **`platform.test.ts`** ❌
   - iOS/Android/Web specific behaviors
   - Performance optimizations
   - Requires component rendering setup

### Component Tests

1. **`components/button-animations.test.tsx`** ❌
   - Button press animations
   - Loading animations
   - Entrance effects

2. **`components/card-animations.test.tsx`** ❌
   - Card hover/lift animations
   - Interactive states

3. **`components/list-animations.test.tsx`** ❌
   - Stagger animations
   - List item transitions

### Integration Tests

**`integration.test.tsx`** ❌
- Real-world animation scenarios
- Memory management
- Performance metrics

## Running Tests

```bash
# Run all animation tests
npm test -- __tests__/animations/

# Run specific test file
npm test -- __tests__/animations/simple.test.ts

# Run with coverage
npm test -- __tests__/animations/ --coverage
```

## Current Status

- ✅ Basic test infrastructure set up
- ✅ Animation variant system fully tested
- ✅ Store tests mostly passing (14/15)
- ❌ Component tests need React Native mocking fixes
- ❌ Hook tests need Reanimated mock improvements

## Known Issues

1. **React Test Renderer Deprecation Warnings**
   - The testing library uses deprecated React Test Renderer
   - Consider migrating to React Testing Library

2. **Reanimated Mocking**
   - Complex to mock all Reanimated features
   - Some native-specific animations can't be tested in jsdom

3. **AsyncStorage Hydration**
   - Timing issues with store hydration tests
   - May need to adjust test approach

## Next Steps

1. Fix React Native component mocking
2. Update to newer testing libraries
3. Add visual regression tests for web
4. Create E2E tests for critical animation flows
5. Add performance benchmarks

## Best Practices

1. Always set platform before testing
2. Mock animation timing for predictable tests
3. Test both enabled and disabled animation states
4. Verify cross-platform consistency
5. Check memory cleanup for animation listeners