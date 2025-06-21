# Type Consolidation Guide

## Overview

We've consolidated duplicate type definitions across the codebase into a single source of truth: `/types/consolidated.ts`. This guide explains the changes and how to migrate existing code.

## Why Consolidate?

Previously, we had:
- `UserRole` defined in 3 different files with slightly different values
- Healthcare types scattered across multiple files
- Organization types with inconsistent enum values
- Multiple validation schemas for the same data

This caused:
- Type mismatches and runtime errors
- Confusion about which type to import
- Maintenance overhead when updating types
- Inconsistent validation rules

## New Structure

### Single Source of Truth

All shared types are now in `/types/consolidated.ts`:

```typescript
// Before - Multiple imports from different files
import { UserRole } from '@/types/auth';
import { UserRoleSchema } from '@/lib/validations/server';
import { HealthcareRole } from '@/types/healthcare';

// After - Single import
import { UserRole, HealthcareRole, UserRoleSchema } from '@/types/consolidated';
```

### Type Categories

1. **User & Role Types**
   - `UserRole` - Base system roles (admin, manager, user, guest)
   - `HealthcareRole` - Healthcare-specific roles (operator, nurse, doctor, head_doctor)
   - `CombinedRole` - Union of both for flexibility
   - `UserStatus` - Account status types

2. **Organization Types**
   - `OrganizationType` - Standardized org types
   - `OrganizationRole` - Member roles within orgs
   - `OrganizationStatus` - Org account status

3. **Healthcare Types**
   - `UrgencyLevel` - Alert urgency levels
   - `AlertType` - Types of alerts
   - `AlertStatus` - Alert lifecycle status
   - `ResponseAction` - Actions taken on alerts

4. **Common Types**
   - `AuditSeverity` - Audit log severity
   - `Platform` - Platform identifiers

## Migration Steps

### Step 1: Update Imports

```typescript
// Old imports to remove
import { UserRole } from '@/lib/validations/auth';
import { roleSchema } from '@/lib/validations/auth';
import { HealthcareUserRole } from '@/types/healthcare';

// New consolidated import
import { 
  UserRole, 
  UserRoleSchema,
  HealthcareRole 
} from '@/types/consolidated';
```

### Step 2: Update Type References

```typescript
// Before
type MyUserRole = 'admin' | 'manager' | 'user' | 'guest';

// After
import { UserRole } from '@/types/consolidated';
type MyUserRole = UserRole;
```

### Step 3: Update Validation Schemas

```typescript
// Before - Local schema definition
const userSchema = z.object({
  role: z.enum(['admin', 'manager', 'user', 'guest'])
});

// After - Use consolidated schema
import { UserRoleSchema } from '@/types/consolidated';
const userSchema = z.object({
  role: UserRoleSchema
});
```

### Step 4: Use Type Guards

```typescript
import { isHealthcareRole, isUserRole } from '@/types/consolidated';

// Check role type
if (isHealthcareRole(user.role)) {
  // Handle healthcare-specific logic
} else if (isUserRole(user.role)) {
  // Handle general user logic
}
```

## Backward Compatibility

For a smooth transition, we've added re-exports:

```typescript
// These work during migration
export { UserRoleSchema as roleSchema };
export { CombinedRoleSchema as UserRole };
```

**Note**: These compatibility exports will be removed in a future version.

## Best Practices

1. **Always import from consolidated.ts** for shared types
2. **Don't redefine types locally** - extend from consolidated types
3. **Use type guards** for runtime type checking
4. **Keep types DRY** - Don't Repeat Yourself

## Examples

### Creating a New User

```typescript
import { UserRole, UserStatus } from '@/types/consolidated';

interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
}

// Validation
import { UserRoleSchema, UserStatusSchema } from '@/types/consolidated';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  status: UserStatusSchema.optional()
});
```

### Healthcare Alert

```typescript
import { 
  AlertType, 
  UrgencyLevel, 
  AlertStatus 
} from '@/types/consolidated';

interface Alert {
  id: string;
  type: AlertType;
  urgency: UrgencyLevel;
  status: AlertStatus;
  message: string;
}
```

## Type Safety Benefits

With consolidated types:
- ✅ Single source of truth
- ✅ Consistent validation
- ✅ Better IntelliSense
- ✅ Easier refactoring
- ✅ Reduced bundle size

## Migration Checklist

- [ ] Update all imports to use `/types/consolidated`
- [ ] Remove local type definitions
- [ ] Update validation schemas
- [ ] Test type guards work correctly
- [ ] Remove deprecated imports
- [ ] Update documentation

## Questions?

If you encounter issues during migration:
1. Check if the type exists in consolidated.ts
2. Use type guards for runtime checks
3. Refer to the examples above
4. Ask in the team chat

Remember: The goal is consistency and maintainability!