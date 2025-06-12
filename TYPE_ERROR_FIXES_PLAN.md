# Type Error Fixes Implementation Plan

**Created**: January 12, 2025  
**Priority**: CRITICAL - Blocking Navigation  
**Target**: 0 TypeScript Errors

## 🔴 Current Type Errors

### 1. AppUser Type Missing organizationRole
**File**: `/app/_layout.tsx` (lines 84, 86)  
**Error**: Property 'organizationRole' does not exist on type 'AppUser'

**Root Cause**: The AppUser interface doesn't include organizationRole property, but navigation logic expects it

**Fix Required**:
```typescript
// In /lib/stores/auth-store.ts
export interface AppUser extends User {
  role: 'admin' | 'manager' | 'user' | 'guest' | 'operator' | 'nurse' | 'doctor' | 'head_doctor';
  organizationId?: string;
  organizationName?: string;
  organizationRole?: 'operator' | 'doctor' | 'nurse' | 'head_doctor'; // ADD THIS
  department?: string;
  needsProfileCompletion?: boolean;
}
```

### 2. React UMD Global Error
**File**: `/app/_layout.tsx` (line 105)  
**Error**: 'React' refers to a UMD global, but the current file is a module

**Fix Required**:
```typescript
// Add at top of file
import React from 'react';
```

### 3. Component Import Errors
**File**: `/app/(home)/index.tsx`  
**Error**: 'Sidebar07Trigger' not found in exports

**Fix Required**:
```typescript
// Change from:
import { Sidebar07Trigger } from '@/components/universal';
// To:
import { SidebarTrigger } from '@/components/universal';
```

### 4. Invalid Route References
**File**: `/app/(home)/index.tsx`  
**Errors**: Routes don't exist: `/(home)/demo-universal`, `/(home)/sidebar-test`

**Fix Required**: Remove these test navigation buttons or create the routes

### 5. Animated Style Type Mismatch
**File**: `/app/(home)/index.tsx`  
**Error**: Type 'string' is not assignable to type 'number' (width property)

**Fix Required**: Convert string widths to numbers in animated styles

## 📋 Implementation Steps

### Step 1: Update Type Definitions
1. Update AppUser interface in `/lib/stores/auth-store.ts`
2. Update type extensions in `/types/auth.ts`
3. Ensure Better Auth user type alignment
4. Update any API responses that create users

### Step 2: Fix Navigation Logic
1. Update navigation guards in `_layout.tsx` to handle organizationRole properly
2. Add type-safe navigation based on both role and organizationRole
3. Test all role combinations

### Step 3: Fix Import Issues
1. Add React import to `_layout.tsx`
2. Replace Sidebar07Trigger with SidebarTrigger
3. Fix any other component import mismatches

### Step 4: Clean Up Routes
1. Remove references to non-existent routes
2. Update navigation to use valid routes only
3. Consider adding the missing routes if needed

### Step 5: Fix Style Types
1. Convert string dimensions to numbers
2. Ensure all animated styles have correct types
3. Test animations still work correctly

## 🧪 Testing Plan

### Type Checking
```bash
# Run TypeScript compiler
bun typecheck

# Expected output: No errors
```

### Runtime Testing
1. Test all user roles can navigate correctly
2. Test organizationRole-based routing works
3. Verify animations render properly
4. Check all imports resolve

### Edge Cases
- User with role but no organizationRole
- User with organizationRole but basic role
- Profile completion flow
- OAuth users without organizationRole

## 📊 Success Criteria

1. **Zero TypeScript Errors**: `bun typecheck` passes
2. **Navigation Works**: All user types can navigate
3. **No Console Errors**: Clean browser/device console
4. **Tests Pass**: All existing tests still pass

## 🚨 Potential Issues

### Database Schema
- Ensure users table has organizationRole column
- Migration might be needed for existing users
- Default values for missing organizationRole

### API Consistency
- Update user creation endpoints
- Ensure OAuth users get organizationRole
- Profile completion must set organizationRole

### Backward Compatibility
- Handle existing users without organizationRole
- Provide migration path
- Don't break existing functionality

## 📝 Code Examples

### Safe Navigation with organizationRole
```typescript
// Safe access with fallback
const userOrgRole = user?.organizationRole;

if (user.role === 'user' && userOrgRole) {
  switch (userOrgRole) {
    case 'operator':
      router.replace('/(home)/operator-dashboard');
      break;
    case 'doctor':
    case 'nurse':
      router.replace('/(home)/healthcare-dashboard');
      break;
    default:
      router.replace('/(home)');
  }
} else {
  router.replace('/(home)');
}
```

### Type Guard for organizationRole
```typescript
function hasOrganizationRole(user: AppUser): user is AppUser & { organizationRole: string } {
  return user.organizationRole !== undefined;
}
```

## 🔗 Related Files

- `/lib/stores/auth-store.ts` - Main type definition
- `/app/_layout.tsx` - Navigation logic
- `/app/(home)/index.tsx` - Component imports
- `/src/db/schema.ts` - Database schema
- `/src/server/routers/auth.ts` - User creation

---

*This plan ensures type safety throughout the authentication and navigation system*