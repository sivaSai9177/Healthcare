# Duplicate Error Handling Report

## Overview
This report identifies duplicate error handling implementations across the codebase where components are implementing their own error handling logic instead of using the centralized error boundary components.

## Key Findings

### 1. Components with Error Boundaries but Still Handling Errors Internally

#### `/app/(app)/(tabs)/patients.tsx`
- **Issue**: Has duplicate error handling (lines 243-262) even though it's wrapped with `ApiErrorBoundary`
- **Pattern**: Checks for `error && !data && !cachedData` and renders custom error UI
- **Recommendation**: Remove the internal error handling since ApiErrorBoundary should handle this

#### `/app/(app)/(tabs)/alerts/index.tsx`
- **Issue**: Has duplicate error handling (lines 261-288) despite being wrapped with `ApiErrorBoundary`
- **Pattern**: Renders custom error UI with retry button when error occurs
- **Recommendation**: Let ApiErrorBoundary handle the error state

### 2. Components Without Error Boundaries

#### `/components/blocks/healthcare/MetricsOverview.tsx`
- **Issue**: Handles errors internally (lines 366-378) without using ApiErrorBoundary
- **Pattern**: Direct error state handling with custom UI
- **Recommendation**: Wrap the component with ApiErrorBoundary

#### `/components/blocks/healthcare/AlertList.tsx`
- **Issue**: Handles specific API errors internally (lines 342-350) without error boundary
- **Pattern**: Checks for 403 errors and shows ProfileIncompletePrompt
- **Recommendation**: Consider using ApiErrorBoundary with custom fallback for specific errors

### 3. Common Duplicate Error Patterns Found

1. **Direct error state handling**:
   ```tsx
   if (error) {
     return <ErrorUI />;
   }
   ```

2. **Try-catch blocks with console.error**:
   ```tsx
   try {
     // action
   } catch (error) {
     console.error('Error:', error);
   }
   ```

3. **Custom error UI implementations**:
   - Multiple components implementing similar error UI with retry buttons
   - Inconsistent error message formatting
   - Duplicate error icons and styling

### 4. Components with Proper Error Handling

These components correctly use error boundaries:
- `/app/(public)/auth/login.tsx` - Uses ErrorProvider and useAsyncError
- Most modal components properly propagate errors to parent boundaries

## Recommendations

### 1. Remove Duplicate Error Handling
Components wrapped with error boundaries should not handle errors internally. Remove:
- Error state checks and custom error UI
- Try-catch blocks that only log errors
- Redundant error state management

### 2. Add Missing Error Boundaries
Wrap components that handle errors internally with appropriate error boundaries:
- `ApiErrorBoundary` for API/TRPC errors
- `AuthErrorBoundary` for authentication errors
- `HealthcareErrorBoundary` for healthcare-specific errors

### 3. Standardize Error Handling Patterns
- Use error boundaries consistently across all components
- Implement custom fallback components for specific error types
- Use the centralized error hooks (useError, useAsyncError) for error handling logic

### 4. Specific Files to Update

**High Priority** (components with both error boundary and internal handling):
- `/app/(app)/(tabs)/patients.tsx`
- `/app/(app)/(tabs)/alerts/index.tsx`
- Any other tab screens with similar patterns

**Medium Priority** (components without error boundaries):
- `/components/blocks/healthcare/MetricsOverview.tsx`
- `/components/blocks/healthcare/AlertList.tsx`
- `/components/blocks/healthcare/ActivePatients.tsx`
- `/components/blocks/healthcare/PaginatedAlertList.tsx`

**Low Priority** (minor error handling improvements):
- Modal components with try-catch blocks that only log errors
- Components using console.error instead of the unified logger

## Implementation Guide

### Step 1: Update Components with Duplicate Error Handling
```tsx
// Remove this pattern:
if (error && !data) {
  return <CustomErrorUI />;
}

// The ApiErrorBoundary will handle it
```

### Step 2: Add Error Boundaries to Components
```tsx
// Wrap component exports:
export default function ComponentName() {
  return (
    <ApiErrorBoundary retryRoute="/path">
      <ComponentContent />
    </ApiErrorBoundary>
  );
}
```

### Step 3: Use Custom Fallbacks for Specific Errors
```tsx
<ApiErrorBoundary 
  fallback={<ProfileIncompletePrompt />}
  onError={(error) => {
    if (error.code === 'HOSPITAL_REQUIRED') {
      // Handle specific error
    }
  }}
>
  <Component />
</ApiErrorBoundary>
```

## Benefits of Consolidation

1. **Consistency**: All errors handled uniformly across the app
2. **Maintainability**: Single source of truth for error UI
3. **User Experience**: Consistent error messages and recovery options
4. **Performance**: Reduced component complexity and re-renders
5. **Debugging**: Centralized error logging and tracking