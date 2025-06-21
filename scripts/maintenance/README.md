# Maintenance Scripts

Scripts for code maintenance, fixes, and quality improvements.

## Subdirectories

### typescript/
TypeScript error detection and fixes
- `analyze-typescript-errors.ts` - Analyze TS errors
- `fix-app-typescript-errors.ts` - Fix app-specific TS errors
- `fix-test-typescript-errors.ts` - Fix test file TS errors
- `fix-final-typescript-errors.ts` - Final pass TS fixes

### imports/
Import organization and cleanup
- `fix-imports.ts` - General import fixes
- `fix-lucide-imports.ts` - Lucide icon import fixes
- `remove-unused-imports.ts` - Remove unused imports
- `remove-console-logs.ts` - Remove console.log statements
- Icon migration scripts

### oauth/
OAuth-specific fixes and maintenance
- `fix-oauth-env.ts` - Environment variable fixes
- `fix-oauth-local.sh` - Local OAuth setup fixes
- `fix-oauth-healthcare.sh` - Healthcare OAuth fixes

### fixes/
General code fixes and improvements
- Hospital/organization data fixes
- Mobile-specific fixes
- Style and syntax fixes
- Theme consistency fixes

## Usage

### TypeScript Fixes
```bash
# Analyze TypeScript errors
tsx scripts/maintenance/typescript/analyze-typescript-errors.ts

# Fix application TypeScript errors
tsx scripts/maintenance/typescript/fix-app-typescript-errors.ts
```

### Import Cleanup
```bash
# Fix imports
tsx scripts/maintenance/imports/fix-imports.ts

# Remove unused imports
tsx scripts/maintenance/imports/remove-unused-imports.ts
```

### OAuth Fixes
```bash
# Fix OAuth environment
tsx scripts/maintenance/oauth/fix-oauth-env.ts
```

## Best Practices

1. Always run analysis scripts before applying fixes
2. Review changes before committing
3. Test after running fix scripts
4. Keep backups before major changes