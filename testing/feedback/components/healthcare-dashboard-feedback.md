# HealthcareDashboard Component Test Feedback

**Test File**: `__tests__/components/healthcare/HealthcareDashboard-test.tsx`  
**Status**: ❌ FAILING  
**Last Run**: 2025-01-19  

## Current Issues

### 1. Provider Context Missing
```
Error: useAuth must be used within AuthProvider
```

**Root Cause**: Component needs multiple providers but test doesn't wrap component properly.

**Fix Required**:
- Create test wrapper with all required providers
- Mock provider values appropriately

### 2. Hook Mocks Not Working
```
TypeError: (0, _useAuth.useAuth) is not a function
```

**Root Cause**: Hooks are not being mocked at the module level.

**Fix Required**:
- Mock hooks before importing component
- Use manual mocks in __mocks__ directory

### 3. Child Component Errors
```
Error: ShiftStatus component failing to render
```

**Root Cause**: Child components have their own dependencies.

**Fix Required**:
- Mock all child components
- Provide minimal mock implementations

## Proposed Solutions

### Solution 1: Create Test Wrapper
```typescript
// testing/helpers/test-wrapper.tsx
const AllProviders = ({ children }) => (
  <ErrorBoundary>
    <TRPCProvider>
      <AuthProvider>
        <HospitalProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </HospitalProvider>
      </AuthProvider>
    </TRPCProvider>
  </ErrorBoundary>
);

const customRender = (ui, options) =>
  render(ui, { wrapper: AllProviders, ...options });
```

### Solution 2: Comprehensive Mocks
```typescript
// __mocks__/@/hooks/useAuth.ts
export const useAuth = jest.fn(() => ({
  user: { id: '1', name: 'Test User', role: 'doctor' },
  hasHydrated: true,
  isRefreshing: false,
  isAuthenticated: true,
}));
```

### Solution 3: Simplify Child Components
```typescript
jest.mock('@/components/blocks/healthcare', () => ({
  ShiftStatus: () => 'ShiftStatus',
  MetricsOverview: () => 'MetricsOverview',
  AlertSummaryEnhanced: () => 'AlertSummaryEnhanced',
  ActivePatients: () => 'ActivePatients',
}));
```

## Test Coverage Goals

- [ ] Renders loading state correctly
- [ ] Shows hospital assignment required message
- [ ] Displays all dashboard components for doctors
- [ ] Shows create alert button for operators
- [ ] Hides patient section for non-doctors
- [ ] Navigation works correctly
- [ ] Refresh functionality works

## Test Data Requirements

```typescript
const mockData = {
  user: {
    doctor: { id: '1', name: 'Dr. Test', role: 'doctor', defaultHospitalId: 'h1' },
    nurse: { id: '2', name: 'Nurse Test', role: 'nurse', defaultHospitalId: 'h1' },
    operator: { id: '3', name: 'Op Test', role: 'operator', defaultHospitalId: 'h1' },
  },
  hospital: {
    id: 'h1',
    name: 'Test Hospital',
    organizationId: 'org1',
  },
  permissions: {
    hasHospitalAssigned: true,
    isLoading: false,
  }
};
```

## Dependencies

- Depends on: useAuth, useHospitalStore, useHospitalPermissions
- Blocks: Healthcare feature testing

## Priority: 🔴 CRITICAL

Core dashboard component that most healthcare features depend on.