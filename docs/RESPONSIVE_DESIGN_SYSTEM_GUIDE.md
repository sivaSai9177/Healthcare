# Responsive Design System Guide

## Overview

Our app implements a comprehensive responsive design system that adapts to screen sizes, pixel densities, and platform differences. The system includes responsive hooks, a 3-tier density system, and platform-specific tokens.

## Core Components

### 1. Responsive Hooks (`hooks/responsive/`)

#### Main Hook: `useResponsive()`
```typescript
const {
  // Device type flags
  isMobile,      // true for xs and sm breakpoints
  isTablet,      // true for md breakpoint
  isDesktop,     // true for lg, xl, 2xl breakpoints
  
  // Current breakpoint
  breakpoint,    // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  
  // Utility functions
  isBreakpoint,  // Check exact breakpoint
  isAtLeast,     // Check minimum breakpoint
  isAtMost,      // Check maximum breakpoint
} = useResponsive();
```

#### Supporting Hooks
```typescript
// Get current breakpoint
const breakpoint = useBreakpoint(); // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

// Get responsive value
const columns = useResponsiveValue({ xs: 1, sm: 2, md: 3, lg: 4 });

// Check media query
const isLargeScreen = useMediaQuery('lg'); // true if >= 1024px

// Convenience hooks
const isMobile = useIsMobile();
const isTablet = useIsTablet();
const isDesktop = useIsDesktop();
```

### 2. Density System

The app automatically detects and applies density based on screen width:

| Screen Width | Density Mode | Multiplier | Description |
|-------------|--------------|------------|-------------|
| < 360px | `compact` | 0.75x | Small phones |
| 360-768px | `medium` | 1.0x | Standard phones |
| > 768px | `large` | 1.25x | Tablets & desktops |

#### Using Density in Components
```typescript
import { useSpacing } from '@/lib/stores/spacing-store';

function MyComponent() {
  const { density, spacing, componentSizes } = useSpacing();
  
  // Density-aware values
  const padding = spacing[4]; // 12px, 16px, or 20px based on density
  const buttonHeight = componentSizes.button.md.height; // 36px, 44px, or 52px
}
```

### 3. Breakpoint System

Breakpoints match Tailwind CSS for consistency:

| Breakpoint | Min Width | Device Target |
|------------|-----------|---------------|
| `xs` | 0px | Mobile portrait |
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large desktop |

### 4. ResponsiveValue Type

Use this type for responsive props:

```typescript
type ResponsiveValue<T> = T | {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
};

// Example usage
interface Props {
  columns?: ResponsiveValue<number>;
  padding?: ResponsiveValue<SpacingScale>;
}
```

## Component Examples

### Button with Density-Aware Sizing

```typescript
// Button component automatically adjusts based on density
const densityButtonSizes = {
  compact: {
    default: 'h-9 px-3 py-2',    // 36px height
    sm: 'h-8 px-2.5 py-1.5',      // 32px height
    lg: 'h-10 px-6 py-2.5',       // 40px height
  },
  medium: {
    default: 'h-10 px-4 py-2',    // 40px height
    sm: 'h-9 px-3 py-2',          // 36px height
    lg: 'h-11 px-8 py-3',         // 44px height
  },
  large: {
    default: 'h-11 px-6 py-2.5',  // 44px height
    sm: 'h-10 px-4 py-2',         // 40px height
    lg: 'h-12 px-10 py-3.5',      // 48px height
  }
};
```

### Grid with Responsive Columns

```typescript
<Grid 
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
  gap="md" // Density-aware gap
  animated
  animationType="stagger"
>
  {items.map(item => (
    <GridItem key={item.id}>
      <Card>{item.content}</Card>
    </GridItem>
  ))}
</Grid>
```

### Stack with Density-Aware Gaps

```typescript
function DensityAwareStack() {
  const { density } = useSpacing();
  
  return (
    <VStack
      gap={density === 'compact' ? 2 : density === 'medium' ? 3 : 4}
      className="p-4"
    >
      <Text>Adapts gap based on density</Text>
      <Button>Action</Button>
    </VStack>
  );
}
```

## Block-Level Responsive Patterns

### Extending Spacing for Blocks

```typescript
// lib/design/block-spacing.ts
export const BLOCK_SPACING = {
  compact: {
    blockPadding: 4,      // 16px (4 * 4 * 0.75)
    blockGap: 3,          // 12px
    blockMargin: 4,       // 16px
    minHeight: 144,
    gridColumns: { xs: 1, sm: 1, md: 2, lg: 3 },
  },
  medium: {
    blockPadding: 6,      // 24px (6 * 4 * 1.0)
    blockGap: 4,          // 16px
    blockMargin: 6,       // 24px
    minHeight: 180,
    gridColumns: { xs: 1, sm: 2, md: 3, lg: 4 },
  },
  large: {
    blockPadding: 8,      // 32px (8 * 4 * 1.25)
    blockGap: 6,          // 24px
    blockMargin: 8,       // 32px
    minHeight: 220,
    gridColumns: { xs: 1, sm: 2, md: 4, lg: 6 },
  }
};
```

### Block Implementation Example

```typescript
export function MetricsBlock() {
  const { density, spacing } = useSpacing();
  const { isMobile, isTablet } = useResponsive();
  const blockConfig = BLOCK_SPACING[density];
  
  return (
    <Card
      className={cn(
        'rounded-lg transition-all',
        // Density-based padding
        density === 'compact' && 'p-4',
        density === 'medium' && 'p-6',
        density === 'large' && 'p-8',
        // Responsive min-height
        `min-h-[${blockConfig.minHeight}px]`
      )}
    >
      <Grid 
        columns={blockConfig.gridColumns}
        gap={blockConfig.blockGap}
      >
        {metrics.map(metric => (
          <MetricItem key={metric.id} {...metric} />
        ))}
      </Grid>
    </Card>
  );
}
```

## Platform-Specific Handling

### Platform Tokens

```typescript
import { PLATFORM_TOKENS } from '@/lib/design/responsive';

// Font families
const fontFamily = PLATFORM_TOKENS.fontFamily.sans;
// iOS: 'System', Android: 'Roboto', Web: '-apple-system, ...'

// Shadows (platform-aware)
const shadowStyle = PLATFORM_TOKENS.shadow.md;
// iOS: { shadowColor, shadowOffset, ... }
// Android: { elevation: 4 }
// Web: { boxShadow: '0 2px 4px ...' }

// Safe area
const useSafeArea = PLATFORM_TOKENS.safeArea.useSafeArea;
// iOS/Android: true, Web: false
```

### Platform-Specific Styles

```typescript
import { Platform } from 'react-native';

const styles = {
  container: {
    padding: spacing[4],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
};
```

## Migration Guidelines

### From Fixed Values to Responsive

```typescript
// ❌ Before: Fixed values
<View style={{ padding: 16, marginBottom: 24 }}>

// ✅ After: Density-aware
const { spacing } = useSpacing();
<View style={{ padding: spacing[4], marginBottom: spacing[6] }}>

// ✅ Or with Tailwind + density
<View className={cn(
  density === 'compact' && 'p-3 mb-5',
  density === 'medium' && 'p-4 mb-6',
  density === 'large' && 'p-5 mb-8'
)}>
```

### From Static Layouts to Responsive

```typescript
// ❌ Before: Static grid
<Grid columns={3}>

// ✅ After: Responsive grid
<Grid columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}>

// ✅ With density consideration
<Grid columns={BLOCK_SPACING[density].gridColumns}>
```

## Best Practices

1. **Always use density-aware spacing** instead of hardcoded values
2. **Test on all breakpoints** (xs through 2xl)
3. **Consider platform differences** in shadows and fonts
4. **Use responsive hooks** for conditional rendering
5. **Leverage ResponsiveValue** type for flexible props
6. **Test with different density settings** (compact/medium/large)

## Testing Responsive Design

### Manual Testing Checklist
- [ ] Test all 6 breakpoints
- [ ] Test all 3 density modes
- [ ] Test on iOS, Android, and Web
- [ ] Test landscape and portrait orientations
- [ ] Test with different font size settings

### Automated Testing
```typescript
// Example test for responsive component
describe('ResponsiveComponent', () => {
  it('adapts to density changes', () => {
    const { getByTestId } = render(<MyComponent />);
    
    // Simulate density change
    act(() => {
      useSpacingStore.setState({ density: 'compact' });
    });
    
    expect(getByTestId('container')).toHaveStyle({ padding: 12 });
  });
});
```

## Common Patterns

### Responsive Text
```typescript
<Text
  className={cn(
    'font-semibold',
    isMobile && 'text-sm',
    isTablet && 'text-base',
    isDesktop && 'text-lg'
  )}
>
  Responsive heading
</Text>
```

### Responsive Spacing
```typescript
<HStack
  gap={useResponsiveValue({ xs: 2, sm: 3, md: 4, lg: 6 })}
>
  {children}
</HStack>
```

### Conditional Rendering
```typescript
{isDesktop && <Sidebar />}
{isMobile && <MobileMenu />}
```

## Troubleshooting

### Issue: Components not responding to density changes
**Solution**: Ensure you're using `useSpacing()` hook and not importing spacing directly

### Issue: Breakpoints not matching expected behavior
**Solution**: Check window dimensions with `Dimensions.get('window')` and verify breakpoint values

### Issue: Platform-specific styles not applying
**Solution**: Verify `Platform.OS` value and use `Platform.select()` correctly

## Next Steps

1. Complete migration of all components to use responsive system
2. Add density selector to settings UI
3. Create responsive preview tool for development
4. Document component-specific responsive patterns