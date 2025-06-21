# usePermissions Hook Test Feedback

**Test File**: `__tests__/unit/hooks/usePermissions-test.tsx`  
**Status**: ❌ FAILING  
**Last Run**: 2025-01-19  

## Current Issues

### 1. AsyncStorage Mock Error
```
[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null.
```

**Root Cause**: The AsyncStorage mock is not being loaded properly in the test environment.

**Fix Required**:
- Ensure `@react-native-async-storage/async-storage` is mocked in jest.setup.js
- Mock should be loaded before auth store initialization

### 2. Dynamic Import Error
```
TypeError: A dynamic import callback was invoked without --experimental-vm-modules
at new UnifiedLogger (/lib/core/debug/unified-logger.ts:35:7)
```

**Root Cause**: UnifiedLogger uses dynamic imports which Jest doesn't support without flags.

**Fix Required**:
- Mock the entire unified logger module
- Avoid dynamic imports in test environment

### 3. Mock Implementation Issues
```
TypeError: Cannot read properties of undefined (reading 'mockImplementation')
```

**Root Cause**: useAuthStore is not being mocked properly.

**Fix Required**:
- Ensure jest.mock() is called at the top level
- Verify mock path is correct

## Proposed Solutions

### Solution 1: Fix jest.setup.js
```javascript
// Add to jest.setup.js
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
  }
}));

jest.mock('@/lib/core/debug/unified-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  log: jest.fn(),
  UnifiedLogger: jest.fn(),
}));
```

### Solution 2: Fix Test File
```typescript
// Move mock to top of file
jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: jest.fn()
}));

// In test
const mockUseAuthStore = require('@/lib/stores/auth-store').useAuthStore;
mockUseAuthStore.mockImplementation((selector) => {
  // ... mock implementation
});
```

## Test Coverage Goals

- [ ] All permission hooks return correct values
- [ ] Loading states are handled properly
- [ ] Null/undefined user cases are covered
- [ ] Role-based permissions work correctly
- [ ] Healthcare-specific permissions are tested

## Dependencies

- Depends on: auth-store mock, AsyncStorage mock, logger mock
- Blocks: All permission-based component tests

## Priority: 🔴 CRITICAL

This is a foundational test that many other tests depend on.