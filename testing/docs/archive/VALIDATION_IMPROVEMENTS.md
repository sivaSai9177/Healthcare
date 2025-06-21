# Healthcare Module Validation Improvements

## Overview

This document summarizes the validation improvements made to ensure consistency between client and server validation in the healthcare module.

## Key Improvements

### 1. Enhanced Schema Definitions (`types/healthcare.ts`)

- Added comprehensive JSDoc documentation for all schemas
- Enhanced validation rules with better error messages
- Added regex validation for room numbers (e.g., "302", "ICU-1")
- Added refinement functions for conditional validation
- Created response schemas for API output validation

### 2. Validation Hooks (`hooks/healthcare/useValidation.ts`)

Created reusable validation hooks that provide:

- **useCreateAlertValidation**: Alert creation form validation with context
- **useAcknowledgeAlertValidation**: Alert acknowledgment validation with dependencies
- **useHealthcareProfileValidation**: Healthcare profile validation with role-based rules
- **useUpdateUserRoleValidation**: User role update validation

Features:
- Real-time field validation
- Context-aware validation (e.g., organizationId checks)
- Error message formatting
- Field-specific validation helpers

### 3. Validation Utilities (`lib/validations/healthcare.ts`)

Created utility functions for:

- Custom validation rules (room numbers, license numbers, departments)
- Role-based permission checks
- Response time validation based on urgency
- Error message constants
- Form validation factory functions

### 4. Test Coverage (`__tests__/validations/healthcare.test.ts`)

Added comprehensive test suites for:

- All Zod schemas with valid/invalid cases
- Edge cases (long strings, special characters)
- Conditional validation rules
- Utility function behavior

## Usage Examples

### Using Validation Hooks in Components

```typescript
import { useCreateAlertValidation } from '@/hooks/healthcare';

function AlertForm() {
  const { 
    validateWithContext, 
    validateField, 
    getFieldError 
  } = useCreateAlertValidation();

  const handleRoomNumberChange = (value: string) => {
    setFormData({ ...formData, roomNumber: value });
    validateField('roomNumber', value);
  };

  return (
    <Input
      value={formData.roomNumber}
      onChangeText={handleRoomNumberChange}
      error={getFieldError('roomNumber')}
    />
  );
}
```

### Server-Side Validation

The server automatically validates inputs using the same schemas:

```typescript
export const healthcareRouter = router({
  createAlert: operatorProcedure
    .input(CreateAlertSchema)
    .output(CreateAlertResponseSchema) // New: Output validation
    .mutation(async ({ input, ctx }) => {
      // Input is already validated
      // Business logic here
    }),
});
```

## Best Practices

1. **Always use the validation hooks** instead of direct schema validation in components
2. **Validate on change** for better UX with real-time feedback
3. **Use context validation** for business logic rules (e.g., organization checks)
4. **Keep schemas in sync** between client and server by importing from `types/healthcare.ts`
5. **Test edge cases** when adding new validation rules

## Migration Guide

For existing components using inline validation:

1. Replace `z.object({...})` with imported schemas
2. Replace manual validation with validation hooks
3. Use `getFieldError()` instead of accessing error objects directly
4. Add field-level validation on input changes

## Benefits

- **Type Safety**: Full TypeScript support with inferred types
- **Consistency**: Same validation rules on client and server
- **Reusability**: Validation logic is centralized and reusable
- **Better UX**: Real-time validation with clear error messages
- **Maintainability**: Easy to update validation rules in one place
- **Testability**: Comprehensive test coverage ensures reliability