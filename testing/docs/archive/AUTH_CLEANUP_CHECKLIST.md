# Authentication Cleanup Checklist

## 🧹 Files to Delete

### Test API Endpoints (Should NOT be in production)
- [ ] `/app/api/auth/test+api.ts` - Test handler with console.logs
- [ ] `/app/api/auth/test-callback+api.ts` - OAuth callback test
- [ ] `/app/api/auth/test-simple+api.ts` - Simple test without database

### Test Screens
- [ ] `/app/test-oauth.tsx` - OAuth testing page
- [ ] `/app/auth-callback-fix.tsx` - Temporary fix file (check if still needed)

### Test Utilities
- [ ] `/lib/auth/test-signout.ts` - Test signout functionality (7 console.logs)

### Old/Unused Files (Verify before deleting)
- [ ] Check if `/app/auth-callback.tsx` is the current version or if `auth-callback-fix.tsx` replaced it

## 📝 Console.log Replacements Needed

### High Priority (Auth Router - 22 instances!)
- [ ] `/src/server/routers/auth.ts` - Replace all console.* with logger.*
  - Lines: 171, 296-297, 306, 334, 345, 368, 395, 414, 427, 441, 481, 493-494, 688, 710, 992, 1099, 1139, 1354, 1424, 1514

### Auth Files
- [ ] `/lib/auth/auth-server.ts` - Lines 31, 34 (commented console.logs)
- [ ] `/app/(auth)/register.tsx` - Line 16

### Cleanup Commented Code
- [ ] `/app/(auth)/_layout.tsx` - Remove commented console.logs on lines 50, 56

## 🔧 TODO Comments to Address

### Service Files
- [ ] `/src/server/services/access-control.ts` - Lines 523, 565
- [ ] `/src/server/services/audit.ts` - Line 152
- [ ] `/src/server/services/encryption.ts` - Line 350

## 🗑️ Script Files to Review

### Development Scripts (Keep or move to proper test directory)
```
/scripts/test-auth-e2e.ts
/scripts/test-oauth-minimal.ts
/scripts/test-auth-handler.ts
/scripts/test-auth-simple.ts
/scripts/test-oauth-standalone.ts
/scripts/test-google-auth-redirect.ts
/scripts/test-oauth-no-expo.ts
/scripts/test-oauth-flow.ts
```

## 🔍 Import Cleanup

### Fix Non-existent Imports
- [ ] `/app/api/auth/test+api.ts` - Line 1: imports `auth-minimal` which doesn't exist

## ✅ Quick Cleanup Commands

### 1. Delete test files
```bash
rm -f app/api/auth/test*.ts
rm -f app/test-oauth.tsx
rm -f lib/auth/test-signout.ts
```

### 2. Find remaining console statements
```bash
# Count all console statements in auth-related files
grep -r "console\." --include="*.ts" --include="*.tsx" lib/auth src/server/routers/auth.ts app/\(auth\) | wc -l

# Show specific files and line numbers
grep -rn "console\." --include="*.ts" --include="*.tsx" lib/auth src/server/routers/auth.ts app/\(auth\)
```

### 3. Find TODO comments
```bash
grep -rn "TODO.*log" --include="*.ts" --include="*.tsx" .
```

## 🎯 Priority Order

1. **Delete test files** - These should never go to production
2. **Fix auth router console.logs** - 22 instances is too many
3. **Clean up commented code** - Remove or implement
4. **Address TODO logging comments** - Complete the logging migration
5. **Review script files** - Decide what to keep

## 📊 Current Status

- **Test files identified**: 6 files
- **Console.log statements remaining**: ~30+
- **TODO logging comments**: 5
- **Files needing cleanup**: 15+

## ⚠️ Before Committing

1. Run cleanup commands above
2. Test auth flow after cleanup
3. Verify no test endpoints remain
4. Check for any broken imports
5. Run type checking: `bun tsc --noEmit`
6. Test on both web and mobile