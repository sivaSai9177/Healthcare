# User Management Scripts

Scripts for creating, managing, and verifying users in the system.

## Subdirectories

### creation/
User creation scripts
- `create-test-users-simple.ts` - Simple test user creation
- `create-test-users-all-roles.ts` - Users with all role types
- `create-healthcare-users.ts` - Healthcare-specific users
- `create-demo-users.ts` - Demo users for presentations
- `create-doremon-user.ts` - Specific test user

### management/
User modification and role management
- `make-user-admin.ts` - Grant admin privileges
- `make-user-operator.ts` - Grant operator privileges
- `assign-healthcare-role.ts` - Assign healthcare roles
- `update-users-organization.ts` - Update user organizations
- `delete-user.ts` - Remove users
- `fix-user-roles.ts` - Fix role inconsistencies

### verification/
User status checks and verification
- `check-users.ts` - General user verification
- `check-user-status.ts` - Check specific user status
- `list-users.ts` - List all users
- `find-doremon-user.ts` - Find specific test user
- Role-specific checks

## Usage Examples

### Creating Users
```bash
# Create simple test users
tsx scripts/users/creation/create-test-users-simple.ts

# Create users with all roles
tsx scripts/users/creation/create-test-users-all-roles.ts

# Create healthcare users
tsx scripts/users/creation/create-healthcare-users.ts
```

### Managing Users
```bash
# Make a user admin
tsx scripts/users/management/make-user-admin.ts

# Assign healthcare role
tsx scripts/users/management/assign-healthcare-role.ts

# Update user organization
tsx scripts/users/management/update-users-organization.ts
```

### Verifying Users
```bash
# List all users
tsx scripts/users/verification/list-users.ts

# Check user status
tsx scripts/users/verification/check-user-status.ts
```

## User Roles

- **Admin** - Full system access
- **Manager** - Organization management
- **Operator** - Operational tasks
- **Healthcare Roles**:
  - Doctor
  - Nurse
  - Paramedic