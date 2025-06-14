# Design System Module Context

## Overview
The design system is in transition from a custom theme system to Tailwind CSS with NativeWind.

## Current State

### Migration Status
- **5/60+** universal components fully migrated
- **150+** files still using old theme system
- **Mixed usage** causing TypeScript errors

### Fully Migrated Components ✅
1. **Button** (`components/universal/Button.tsx`)
   - Density-aware sizing
   - Platform-specific animations
   - Tailwind variants
   - Shadow prop implemented
   - Fixed import paths and className issues

2. **Card** (`components/universal/Card.tsx`)
   - Shadow system implemented
   - Animation support
   - Platform tokens

3. **Box** (`components/universal/Box.tsx`)
   - Pure utility component
   - Tailwind-only

4. **Stack** (`components/universal/Stack.tsx`)
   - VStack/HStack components
   - Density-aware gaps
   - Responsive spacing

5. **Input** (Partial)
   - Basic Tailwind classes
   - Needs completion

### Components Needing Migration 🔄

#### High Priority (Core UI)
- **Text** - Uses `useTheme()` and `useSpacing()`
- **Select** - Direct theme color usage
- **Form** - Mixed implementation
- **List** - Theme-dependent

#### Chart Components (6 total)
- All use theme directly
- Heavy components (consider lazy loading)
- Located in `components/universal/charts/`

#### Navigation Components
- **Navbar** - Theme colors
- **Sidebar** - Mixed approach
- **Tabs** - Theme-dependent
- **NavigationMenu** - Full migration needed

## Design Tokens

### Spacing System
```typescript
// Density modes
compact: 0.75x multiplier
medium: 1.0x multiplier  
large: 1.25x multiplier

// Base unit: 4px
spacing[4] = 16px (medium), 12px (compact), 20px (large)
```

### Breakpoints
- xs: 0px
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

### Shadow System
```css
--shadow-xs through --shadow-2xl
Platform-specific implementation needed
```

## Migration Patterns

### From Theme to Tailwind

```typescript
// ❌ OLD
const theme = useTheme();
style={{ backgroundColor: theme.card }}

// ✅ NEW
className="bg-card"
```

### Density-Aware Classes

```typescript
// ❌ OLD
const { spacing } = useSpacing();
style={{ padding: spacing[4] }}

// ✅ NEW
className={cn(
  density === 'compact' && 'p-3',
  density === 'medium' && 'p-4',
  density === 'large' && 'p-5'
)}
```

### Responsive Values

```typescript
// ❌ OLD
const padding = isMobile ? 16 : 24;

// ✅ NEW
className="p-4 md:p-6"
```

## Key Files

### Configuration
- `tailwind.config.ts` - Tailwind setup
- `app/global.css` - CSS variables
- `lib/design/tokens.ts` - Design tokens
- `lib/design/spacing.ts` - Spacing system
- `lib/design/responsive.ts` - Responsive utilities

### Hooks to Keep
- `useResponsive()` - Device detection
- `useSpacing()` - Density system
- `useAnimation()` - Animation system

### Hooks to Remove
- `useTheme()` - Replace with Tailwind
- Direct theme imports

## Migration Checklist

For each component:
1. [ ] Remove `useTheme()` hook
2. [ ] Replace style objects with className
3. [ ] Add density support
4. [ ] Test all platforms
5. [ ] Update TypeScript types
6. [ ] Add migration examples

## Common Issues

1. **TypeScript Errors**
   - `theme.colors` doesn't exist
   - Property mismatches
   - Import path errors (e.g., missing `/index`)

2. **Mixed Usage**
   - Using both className and style
   - Inconsistent approaches
   - className on native components (not supported)

3. **Platform Differences**
   - Shadows need platform handling
   - Some styles web-only
   - React Native doesn't support className on View, Pressable, etc.

4. **Import Path Issues**
   - Hooks: Use `@/hooks/responsive/index` not `@/hooks/responsive`
   - Haptics: Use `@/lib/ui/haptics` not `@/lib/ui/haptics/index`
   - Always check if index file exists

## Testing Migration

```bash
# Check for theme usage
grep -r "useTheme\|theme\." components/universal/

# Test component
bun test components/universal/ComponentName.test.tsx

# Visual testing
bun run storybook
```

## Resources

- [Tailwind Migration Guide](docs/MIGRATION_GUIDE_TAILWIND.md)
- [Responsive Design Guide](docs/RESPONSIVE_DESIGN_SYSTEM_GUIDE.md)
- [Shadow Implementation](docs/SHADOW_IMPLEMENTATION_GUIDE.md)
- [Block Spacing Patterns](docs/BLOCK_SPACING_PATTERNS.md)