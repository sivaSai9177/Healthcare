# Responsive Design Quick Reference

## 🎯 Quick Start

```typescript
import { useResponsive } from '@/hooks/responsive/useResponsive';
import { useSpacing } from '@/lib/stores/spacing-store';

function MyComponent() {
  // Responsive hooks
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();
  
  // Density-aware spacing
  const { density, spacing } = useSpacing();
  
  // Use them!
  const padding = spacing[4]; // 12px, 16px, or 20px based on density
}
```

## 📱 Breakpoints

| Name | Width | Use Case |
|------|-------|----------|
| `xs` | 0-639px | Mobile portrait |
| `sm` | 640-767px | Mobile landscape |
| `md` | 768-1023px | Tablet |
| `lg` | 1024-1279px | Desktop |
| `xl` | 1280-1535px | Large desktop |
| `2xl` | 1536px+ | Extra large |

## 🎚️ Density Modes

| Mode | Screen Width | Multiplier | Example |
|------|--------------|------------|---------|
| `compact` | < 360px | 0.75x | `p-3` (12px) |
| `medium` | 360-768px | 1.0x | `p-4` (16px) |
| `large` | > 768px | 1.25x | `p-5` (20px) |

## 🪝 Essential Hooks

```typescript
// Main responsive hook
const { isMobile, isTablet, isDesktop } = useResponsive();

// Get current breakpoint
const breakpoint = useBreakpoint(); // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

// Responsive values
const cols = useResponsiveValue({ xs: 1, md: 2, lg: 4 });

// Media queries
const isLarge = useMediaQuery('lg'); // true if >= 1024px

// Density & spacing
const { density, spacing } = useSpacing();
```

## 🎨 Component Patterns

### Density-Aware Padding
```typescript
<Card className={cn(
  density === 'compact' && 'p-3',
  density === 'medium' && 'p-4',
  density === 'large' && 'p-6'
)}>
```

### Responsive Grid
```typescript
<Grid columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="md">
  {items}
</Grid>
```

### Conditional Rendering
```typescript
{isMobile && <MobileNav />}
{isDesktop && <Sidebar />}
```

### Responsive Text
```typescript
<Text className={cn(
  'font-semibold',
  isMobile && 'text-sm',
  isTablet && 'text-base',
  isDesktop && 'text-lg'
)}>
```

## 📦 Block Spacing

```typescript
// Use BLOCK_SPACING config
import { BLOCK_SPACING } from '@/lib/design/block-spacing';

const config = BLOCK_SPACING[density];
// config.blockPadding, config.gridColumns, etc.
```

## 🌗 Shadows with Density

```typescript
import { useShadow } from '@/lib/design/use-shadow';

// Automatically scales with density
const shadowStyle = useShadow('md');

// Or with Tailwind
import { getDensityShadowClass } from '@/lib/design/shadow-classes';
const shadowClass = getDensityShadowClass('md');
```

## 🚀 Common Patterns

### Mobile-First Classes
```typescript
className="p-4 sm:p-6 md:p-8 lg:p-10"
```

### Density + Responsive
```typescript
className={cn(
  // Base mobile
  'p-3',
  // Tablet up
  'md:p-4',
  // Desktop up
  'lg:p-6',
  // Density overrides
  density === 'large' && 'p-8'
)}
```

### Platform-Specific
```typescript
style={{
  ...Platform.select({
    ios: { shadowColor: '#000' },
    android: { elevation: 4 },
    web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
  })
}}
```

## ⚡ Quick Tips

1. **Always use `useSpacing()`** for consistent spacing
2. **Test all 3 density modes** during development
3. **Start mobile-first** then enhance for larger screens
4. **Use `cn()` helper** for conditional classes
5. **Leverage Grid component** for responsive layouts

## 🔧 Debug Helpers

```typescript
// Log current responsive state
console.log({
  breakpoint: useBreakpoint(),
  density: useSpacing().density,
  dimensions: Dimensions.get('window')
});
```

## 📋 Migration Checklist

- [ ] Replace hardcoded padding/margins with `spacing[n]`
- [ ] Use responsive Grid columns
- [ ] Add density-based classes
- [ ] Test on all breakpoints
- [ ] Remove golden ratio dimensions
- [ ] Use platform tokens for fonts/shadows