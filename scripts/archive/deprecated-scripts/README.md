# Deprecated Scripts Archive

This directory contains scripts that have been deprecated and replaced by the new organized script structure.

## Why These Scripts Were Deprecated

These scripts were moved to the archive for the following reasons:

1. **One-off fixes**: Many of these were created to fix specific issues that have since been resolved
2. **Replaced by unified scripts**: Functionality has been integrated into the new manage-* scripts
3. **Outdated approaches**: Some scripts used older patterns that have been improved
4. **Better organization**: Scripts have been reorganized into proper subdirectories

## Archived Scripts

### Fix Scripts
- `fix-database-role-default.ts` - Database role fixes (replaced by database management scripts)
- `fix-default-hospital-column.ts` - Hospital column fixes (integrated into migration scripts)
- `fix-doremon-user.ts` - Specific user fix (replaced by user management scripts)
- `fix-existing-users-hospital.ts` - User hospital assignment (integrated into user setup)
- `fix-healthcare-router-types.ts` - TypeScript fixes (moved to maintenance/typescript)
- `fix-hospital-data.ts` - Hospital data fixes (integrated into healthcare setup)
- `fix-hospital-organization-id.ts` - Organization ID fixes (integrated into migrations)
- `fix-hospital-simple.ts` - Simplified hospital fixes (replaced by comprehensive scripts)
- `fix-mobile-network.ts` - Mobile network fixes (no longer needed)
- `fix-mobile-session.ts` - Mobile session fixes (integrated into auth scripts)
- `fix-nurse-user-auth.ts` - Nurse authentication fixes (integrated into user creation)
- `fix-route-references.ts` - Route reference updates (completed)
- `fix-session-oauth.ts` - OAuth session fixes (integrated into auth management)
- `fix-shadow-props.ts` - Shadow property fixes (completed)
- `fix-style-syntax-errors.ts` - Style syntax fixes (completed)
- `fix-theme-consistency.ts` - Theme consistency fixes (completed)
- `fix-unescaped-entities.ts` - HTML entity fixes (completed)
- `fix-universal-components-types.ts` - Component type fixes (completed)
- `quick-fix-hospital.ts` - Quick hospital fixes (replaced by proper scripts)

### Auto-fix Scripts
- `auto-fix-colors.ts` - Automated color fixes (completed)
- `auto-fix-responsive.ts` - Automated responsive fixes (completed)

### Docker Scripts
- `docker-dev.sh` - Old docker development script (replaced by services/startup scripts)
- `docker-expo-start.sh` - Old expo docker script (replaced by unified starters)
- `start-docker-dev.sh` - Old docker starter (replaced by services/startup scripts)

### User Management
- `manage-users.old.ts` - Old user management script (replaced by manage-users.ts)

### Analysis Scripts
- `analyze-scripts.ts` - Script analysis tool (functionality integrated into maintenance)

### Database Scripts
- `db-reset.sh.old` - Old database reset script (replaced by db-reset.sh)

## Replacement Scripts

If you're looking for the functionality provided by these deprecated scripts, use:

- **User Management**: `scripts/users/manage-users.ts`
- **Database Management**: `scripts/database/manage-database.ts`
- **Authentication**: `scripts/auth/manage-auth.ts`
- **Healthcare Setup**: `scripts/setup/healthcare/`
- **TypeScript Fixes**: `scripts/maintenance/typescript/`
- **Docker/Services**: `scripts/services/startup/`

## Note

These scripts are kept for historical reference only. Do not use them for current development.
If you need to perform any of these operations, use the appropriate scripts from the organized structure.