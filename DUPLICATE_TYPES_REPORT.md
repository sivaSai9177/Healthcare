# Duplicate Type Definitions Report

## Overview
This report identifies duplicate and overlapping type definitions across the codebase. These duplications can lead to inconsistencies, maintenance issues, and type conflicts.

## 1. User Types

### UserRole Duplicates

#### Location 1: `/types/auth.ts`
```typescript
export const UserRole = z.enum([
  'admin',
  'manager',
  'user',
  'guest',
  'operator',
  'nurse',
  'doctor',
  'head_doctor'
]);
export type UserRole = z.infer<typeof UserRole>;
```

#### Location 2: `/lib/validations/auth.ts`
```typescript
export const UserRole = roleSchema; // line 318
export type UserRole = z.infer<typeof roleSchema>; // line 324
```

#### Location 3: `/lib/validations/server.ts`
```typescript
export const UserRoleSchema = z.enum(['admin', 'manager', 'user', 'guest', 'operator', 'nurse', 'doctor', 'head_doctor']);
export type UserRole = z.infer<typeof UserRoleSchema>; // line 351
```

### User Interface Duplicates

#### Location 1: `/types/auth.ts`
```typescript
export interface AppUser extends User {
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  organizationRole?: HealthcareRole;
  department?: string;
  jobTitle?: string;
  phoneNumber?: string;
  bio?: string;
  needsProfileCompletion?: boolean;
  emailVerified?: boolean;
  defaultHospitalId?: string;
}
```

#### Location 2: `/lib/validations/server.ts`
```typescript
export const BaseUserSchema = z.object({
  id: UserIdSchema,
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  organizationId: z.string().optional(),
  organizationName: z.string().max(100).optional(),
  phoneNumber: z.string().optional(),
  department: z.string().max(50).optional(),
  jobTitle: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  defaultHospitalId: z.string().uuid().optional(),
  needsProfileCompletion: z.boolean().default(false),
  status: UserStatusSchema.default('active'),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

## 2. Healthcare Types

### HealthcareUserRole Duplicates

#### Location 1: `/types/healthcare.ts`
```typescript
export const HealthcareUserRole = z.enum([
  'operator',
  'doctor', 
  'nurse',
  'head_doctor',
  'admin'
]);
```

#### Location 2: `/types/auth.ts`
```typescript
export const HealthcareRole = z.enum([
  'operator',
  'nurse', 
  'doctor',
  'head_doctor'
]);
```

### Alert Type Duplicates

#### Location 1: `/types/healthcare.ts`
```typescript
export interface Alert extends z.infer<typeof AlertSchema> {
  // ... (via common.ts import)
}
```

#### Location 2: `/types/common.ts`
```typescript
export const AlertSchema = z.object({
  id: z.string(),
  hospitalId: z.string(),
  roomNumber: z.string(),
  alertType: AlertType,
  urgencyLevel: UrgencyLevel,
  status: AlertStatus,
  // ...
});
export type Alert = z.infer<typeof AlertSchema>;
```

#### Location 3: `/src/db/healthcare-schema.ts`
```typescript
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
```

### Alert-related Schema Duplicates

#### Location 1: `/types/healthcare.ts`
```typescript
export const CreateAlertSchema = z.object({
  roomNumber: z.string(),
  alertType: AlertType,
  urgencyLevel: UrgencyLevel,
  description: z.string().optional(),
  hospitalId: z.string().uuid(),
});
```

#### Location 2: `/lib/validations/healthcare.ts`
```typescript
export const enhancedSchemas = {
  createAlert: z.object({
    roomNumber: zodRefinements.roomNumber,
    alertType: z.enum(ALERT_TYPES),
    urgencyLevel: z.number().int().min(1).max(5),
    description: z.string().optional(),
    hospitalId: z.string().uuid('Invalid hospital ID'),
  }),
  // ...
};
```

## 3. Organization Types

### OrganizationType Duplicates

#### Location 1: `/lib/validations/organization.ts`
```typescript
export const OrganizationTypeSchema = z.enum(
  ['business', 'nonprofit', 'education', 'personal']
);
export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;
```

#### Location 2: `/lib/validations/auth.ts`
```typescript
export const organizationSchema = z.object({
  type: z.enum(['business', 'nonprofit', 'government', 'education', 'other']),
  // ...
});
export type OrganizationData = z.infer<typeof organizationSchema>;
```

### Organization Interface Duplicates

#### Location 1: `/src/db/organization-schema.ts`
```typescript
export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;
```

#### Location 2: `/lib/validations/organization.ts`
```typescript
export const OrganizationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string().nullable(),
  type: OrganizationTypeSchema,
  // ... many more fields
});
export type OrganizationResponse = z.infer<typeof OrganizationResponseSchema>;
```

### OrganizationRole Duplicates

#### Location 1: `/lib/validations/organization.ts`
```typescript
export const OrganizationRoleSchema = z.enum(
  ['owner', 'admin', 'manager', 'member', 'guest']
);
export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;
```

## 4. Session Types

### SessionData Duplicates

#### Location 1: `/lib/validations/auth.ts`
```typescript
export const sessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string().min(32),
  // ... many fields
});
export type SessionData = z.infer<typeof sessionSchema>;
```

#### Location 2: `/lib/validations/server.ts`
```typescript
export const SessionResponseSchema = z.object({
  session: z.object({
    id: z.string(),
    userId: z.string(),
    expiresAt: z.date(),
    createdAt: z.date(),
    token: z.string().optional(),
  }),
  user: UserResponseSchema,
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
```

## 5. Patient Types

#### Location 1: `/src/db/patient-schema.ts`
```typescript
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
```

Note: Patient types seem to be only defined in the database schema file, which is good - no duplicates found.

## Recommendations

1. **Consolidate User Types**: Create a single source of truth for user types in `/types/auth.ts` and import from there.

2. **Unify Healthcare Types**: Merge healthcare-related types into `/types/healthcare.ts` and remove duplicates from validation files.

3. **Standardize Organization Types**: Use consistent organization type enums across the codebase (note the difference between 'government' vs 'nonprofit' in different locations).

4. **Create Type Aliases**: For database types, create type aliases that extend the validation schemas rather than having separate definitions.

5. **Use Import/Export Pattern**: Instead of redefining types, import them from their canonical location.

6. **Remove Legacy Exports**: Remove legacy compatibility exports like those on lines 317-322 of `/lib/validations/auth.ts`.

## Impact Areas

- Type safety may be compromised due to inconsistent definitions
- Maintenance overhead when updating types
- Potential runtime errors if types get out of sync
- Confusion for developers about which type to use
- Increased bundle size due to duplicate code

## Priority Fixes

1. **High Priority**: User and UserRole types (used throughout the app)
2. **High Priority**: Alert types (critical for healthcare functionality)
3. **Medium Priority**: Organization types (affects multi-tenancy)
4. **Low Priority**: Session types (mostly internal)