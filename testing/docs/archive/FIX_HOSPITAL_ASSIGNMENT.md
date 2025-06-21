# Fix Hospital Assignment for Existing Users

## Problem
Existing users in the database don't have hospital assignments, causing a 403 FORBIDDEN error when trying to access healthcare features:
```
Hospital assignment required. Please complete your profile.
```

## Solution
I've created scripts to automatically assign default hospitals to existing users.

## How to Fix

### Quick Fix (Recommended)
Run the following command to automatically assign hospitals to all existing users:

```bash
npm run db:fix-hospital
```

This script will:
1. Create a default healthcare organization (if it doesn't exist)
2. Create a default hospital for the organization
3. Find all users without hospital assignments
4. Add them to the default organization
5. Create healthcare_users records with hospital assignments

### What the Script Does

1. **Default Organization**: Creates "Default Healthcare Organization" with slug `default-healthcare`
2. **Default Hospital**: Creates "Main Hospital" with code `MAIN`
3. **User Assignment**: 
   - If user is already in an organization, uses that org's hospital
   - If not, adds user to default organization and hospital
   - Creates healthcare_users record with department "General"

### Verification

After running the script, users should be able to:
- Access healthcare features without errors
- View and create alerts
- Use all healthcare functionality

### Manual Profile Completion

Users can still manually update their hospital assignment by:
1. Going to their profile settings
2. Selecting their actual hospital/organization
3. Updating their department and specialization

### Database Changes

The script modifies these tables:
- `organization` - May add default organization
- `hospitals` - May add default hospital
- `organization_member` - Adds users to organizations
- `healthcare_users` - Creates records with hospital assignments

### Rollback

If needed, you can remove the default assignments:
```sql
-- Remove healthcare_users records for default hospital
DELETE FROM healthcare_users 
WHERE hospital_id IN (
  SELECT id FROM hospitals 
  WHERE organization_id IN (
    SELECT id FROM organization 
    WHERE slug = 'default-healthcare'
  )
);

-- Remove users from default organization
DELETE FROM organization_member 
WHERE organization_id IN (
  SELECT id FROM organization 
  WHERE slug = 'default-healthcare'
);
```

## Next Steps

1. Run the fix script: `npm run db:fix-hospital`
2. Test that users can access healthcare features
3. Consider implementing a proper onboarding flow for new users
4. Add validation to ensure all new users get hospital assignments