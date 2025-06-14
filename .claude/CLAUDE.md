# Claude Context - Expo Modern Starter Kit

## Project Overview

**Project**: Modern Expo Starter Kit with Healthcare Alert System  
**Tech Stack**: Expo SDK 52, React Native, TypeScript, tRPC, Better Auth, Drizzle ORM  
**Architecture**: Expo Router with API routes, tRPC backend via Expo API routes  
**Status**: 85% Production Ready (Design System Migration Needed)

### Key Features
- 🏥 Healthcare Alert System (MVP Complete)
- 🔐 Complete Authentication with Better Auth
- 📱 Cross-platform (iOS, Android, Web)
- 🎨 Design System (40% migrated to Tailwind)
- 🔄 Real-time updates via WebSocket
- 📧 Multi-channel notifications

## Current Sprint

**Sprint**: Design System Migration & Code Quality  
**Duration**: 3 weeks (Starting Jan 13, 2025)  
**Focus**: Complete Tailwind migration, fix code quality issues

For current tasks: `cat .claude/sprint-context/current.md`

## Module Contexts

When working on specific modules, load the appropriate context:

- **Healthcare**: `.claude/modules/healthcare.md`
- **Organization**: `.claude/modules/organization.md`
- **Auth**: `.claude/modules/auth.md`
- **Design System**: `.claude/modules/design-system.md`
- **Performance**: `.claude/modules/performance.md`

## Task Management

### View Tasks by Priority
```bash
# Current sprint tasks
cat .claude/sprint-context/current.md

# Backlog
cat .claude/sprint-context/backlog.md

# Completed tasks
cat .claude/sprint-context/completed.md
```

### Start Module Work
```bash
# Example: Working on healthcare module
cat .claude/modules/healthcare.md

# Load specific task template
cat .claude/tasks/healthcare-task.md
```

## Key Directories

- `/app` - Expo Router pages
- `/components` - UI components (universal, blocks, specific)
- `/hooks` - Custom React hooks
- `/lib` - Core utilities and libraries
- `/src/server` - Backend logic (tRPC routers, services)
- `/app/api` - API routes (tRPC handler)
- `/docs` - All documentation

## Important Files

- `.env.example` - Environment variables template
- `package.json` - Dependencies and scripts
- `app.config.ts` - Expo configuration
- `tailwind.config.ts` - Tailwind setup
- `drizzle.config.ts` - Database configuration

## Development Workflow

1. **Start Development**:
   ```bash
   bun run start  # Expo Go mode
   bun run dev    # Development build
   ```

2. **Run Tests**:
   ```bash
   bun test
   bun run lint
   bun run typecheck
   ```

3. **Database**:
   ```bash
   bun run db:push    # Push schema changes
   bun run db:studio  # Open Drizzle Studio
   ```

## Design System Status

### ✅ Fully Migrated to Tailwind (5/60+)
- Button - Complete with density support and shadow prop ✅
- Card - Shadow and animation support
- Box - Pure Tailwind utility component
- Stack (VStack/HStack) - Gap with density
- Input - Partial migration

### 📝 Import Path Conventions
- Hooks: `@/hooks/[hook-name]` or `@/hooks/[category]/index`
- UI utilities: `@/lib/ui/[module]`
- Components: `@/components/[category]/[component]`
- Note: React Native doesn't support className on native components

### 🔄 Partially Migrated
- Text - Still uses useTheme()
- Form - Mixed approach
- Many components use theme for colors

### ❌ Not Migrated (55+ components)
- All chart components (6)
- Dialog, Drawer, Modal components
- Table, List, Select components
- Navigation components (Navbar, Sidebar)
- 150+ files still using theme system

### 📋 Migration Priority
1. Universal components (40+ remaining)
2. Block components (18 total)
3. Screen components
4. Remove old theme system

## Code Quality Metrics

- **TypeScript**: 100% coverage ✅
- **TODOs**: 100+ to address
- **Console logs**: 108+ files to clean
- **Any types**: 181+ to fix
- **Bundle size**: 2.1MB (target: <2MB)

## Responsive System

### Density Modes
- **Compact**: < 360px (0.75x spacing)
- **Medium**: 360-768px (1.0x spacing)
- **Large**: > 768px (1.25x spacing)

### Breakpoints
- xs: 0px, sm: 640px, md: 768px
- lg: 1024px, xl: 1280px, 2xl: 1536px

### Key Hooks
- `useResponsive()` - Device detection
- `useSpacing()` - Density-aware spacing
- `useBreakpoint()` - Current breakpoint

## Quick Commands

```bash
# Remove console logs
bun run scripts/remove-console-logs.ts

# Fix imports
bun run lint:fix

# Analyze bundle
bun run analyze:bundle

# Start with healthcare module
bun run local:healthcare
```

## Recent Changes (Jan 13, 2025)

- ✅ Fixed authentication flow and navigation guards
- ✅ Resolved _interopRequireDefault bundling errors
- ✅ Created responsive design documentation
- ✅ Standardized shadow implementation guide
- ✅ Fixed Button.tsx import errors and shadow prop implementation
- ✅ Updated component to remove className usage (React Native incompatible)
- 🔄 Reorganizing codebase for production

## Next Steps

1. Complete design system migration
2. Clean up code quality issues
3. Optimize bundle size
4. Prepare for production deployment

---

For detailed documentation, see `/docs/README.md`