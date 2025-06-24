# Git Commit Plan for Navigation and Infrastructure Fixes

## Current Status
- Branch: `healthcare-fresh-start`
- Total files modified: 21
- Total files added: 9
- All navigation fixes implemented
- SSR and grey screen issues resolved
- Logging infrastructure stabilized

## Commit Strategy

### Commit 1: Fix Navigation Architecture
**Files to include:**
- `components/blocks/navigation/EnhancedSidebar.tsx`
- `lib/navigation/navigation-logger.ts`
- `lib/navigation/route-validator.ts`
- `lib/core/debug/router-debug.ts`
- `components/blocks/debug/NavigationDebugger.tsx`

**Commit message:**
```
fix: complete navigation architecture overhaul

- Fixed all navigation URLs to use clean paths without group prefixes
- Added NavigationLogger for tracking and debugging navigation
- Created RouteValidator for validating and managing routes
- Fixed NavigationDebugger text node errors
- Updated EnhancedSidebar with correct navigation paths

BREAKING CHANGE: All navigation URLs changed from /(app)/(tabs)/route to /route format
```

### Commit 2: Fix SSR and Alerts Screen Rendering
**Files to include:**
- `app/(app)/(tabs)/alerts/index.tsx`
- `app/(app)/(tabs)/alerts/escalation-queue.tsx`
- `app/(app)/(tabs)/alerts/[id].tsx`
- `lib/api/use-ssr-prefetch.ts`
- `lib/api/ssr-utils.ts`
- `app/api/ssr/prefetch+api.ts`

**Commit message:**
```
fix: resolve SSR prefetch and alerts screen grey screen issue

- Disabled SSR prefetch temporarily to fix grey screen
- Fixed AnimatedPageWrapper causing rendering issues
- Fixed React hooks error (pageAnimatedStyle before conditional returns)
- Made escalation queue UI responsive
- Fixed TypeScript errors in alert components
```

### Commit 3: Fix API Configuration and Authentication
**Files to include:**
- `lib/core/config/unified-env.ts`
- `lib/api/index.ts`
- `app/api/health+api.ts`
- `.env` (if needed)

**Commit message:**
```
fix: correct API URL configuration and authentication

- Fixed hardcoded API URL (was 8081, now uses environment variable)
- Fixed TRPC client configuration to use correct backend port
- Added proper error handling for API calls
- Fixed authentication token handling
```

### Commit 4: Create Missing Route Layouts
**Files to include:**
- `app/(app)/admin/_layout.tsx`
- `app/(app)/analytics/_layout.tsx`
- `app/(app)/organization/_layout.tsx`
- `app/(app)/security/_layout.tsx`
- `app/(app)/shifts/_layout.tsx`
- `app/(app)/_layout.tsx`
- `app/_layout.tsx`

**Commit message:**
```
feat: add missing route layouts for admin, analytics, and security

- Created layout files for admin, analytics, organization, and security routes
- Fixed shifts route registration in parent layout
- Updated route structure to support new sections
- Removed non-existent routes from sidebar
```

### Commit 5: Fix Logging Infrastructure
**Files to include:**
- `lib/core/debug/unified-logger.ts`
- `lib/core/debug/debug-utils.ts`
- `scripts/start-native-expo.sh`

**Commit message:**
```
fix: resolve logging service recursive fetch issue

- Fixed infinite loop in fetch interceptor for logging service
- Added original fetch storage for UnifiedLogger
- Modified start script to respect .env LOGGING_SERVICE_ENABLED setting
- Added proper error handling for disabled logging service
- Fixed TypeScript warnings (removed unused variables)
```

### Commit 6: Add Missing Shift Routes
**Files to include:**
- `app/(app)/shifts/index.tsx`
- `app/(app)/shifts/reports.tsx`
- `app/(app)/shifts/schedule.tsx`

**Commit message:**
```
feat: add placeholder pages for shift management

- Created index page for shifts overview
- Added reports page placeholder
- Added schedule page placeholder
```

### Commit 7: Update Documentation and Scripts
**Files to include:**
- `docs/modules/navigation/NAVIGATION_FIX_CHECKLIST.md` (if modified)
- `package.json` (if scripts were added)
- `scripts/test-routes.js`
- `scripts/test-routes.ts`
- This commit plan file

**Commit message:**
```
docs: update navigation documentation and add test scripts

- Updated navigation fix checklist with completion status
- Added route testing scripts
- Created comprehensive git commit plan
```

## Pre-Commit Checklist

1. [ ] Run linting: `bun run lint`
2. [ ] Run type checking: `bun run typecheck`
3. [ ] Test the app: `bun run native`
4. [ ] Verify all routes work correctly
5. [ ] Check that logging doesn't cause crashes
6. [ ] Ensure no sensitive data in commits

## Commit Commands

```bash
# Commit 1: Navigation Architecture
git add components/blocks/navigation/EnhancedSidebar.tsx \
        lib/navigation/navigation-logger.ts \
        lib/navigation/route-validator.ts \
        lib/core/debug/router-debug.ts \
        components/blocks/debug/NavigationDebugger.tsx
git commit -m "fix: complete navigation architecture overhaul"

# Commit 2: SSR and Alerts
git add app/\(app\)/\(tabs\)/alerts/*.tsx \
        lib/api/use-ssr-prefetch.ts \
        lib/api/ssr-utils.ts \
        app/api/ssr/prefetch+api.ts
git commit -m "fix: resolve SSR prefetch and alerts screen grey screen issue"

# Continue with remaining commits...
```

## Post-Commit Actions

1. Push to remote: `git push origin healthcare-fresh-start`
2. Create PR with detailed description
3. Request code review
4. Run CI/CD checks
5. Deploy to staging for testing

## Rollback Plan

If issues arise after commits:
```bash
# Find the commit before our changes
git log --oneline

# Reset to that commit (keep changes as unstaged)
git reset <commit-hash>

# Or hard reset (discard all changes)
git reset --hard <commit-hash>
```

## Notes

- Each commit is atomic and focused on a specific fix
- Commits are ordered by dependency (navigation first, then screens that use it)
- All commits include descriptive messages following conventional commits format
- Breaking changes are clearly marked
- Each commit should leave the app in a working state