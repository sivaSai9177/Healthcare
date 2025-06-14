# Shadow Implementation Guide

## Current Shadow System Issues

### Problem
The project has well-defined CSS shadow variables but they're underutilized:
- Only 3 components properly implement shadows
- Inconsistent platform handling
- Mixed approaches between CSS and React Native shadows

### Shadow Variables Available

```css
/* Light mode shadows */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.05);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
```

## Recommended Implementation

### 1. Create Density-Aware Shadow Utility Hook

```typescript
// lib/design/use-shadow.ts
import { Platform } from 'react-native';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { DENSITY_MULTIPLIERS } from '@/lib/design/spacing';

// Base shadow definitions
const baseShadowMap = {
  xs: { elevation: 1, ios: { shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } } },
  sm: { elevation: 2, ios: { shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } } },
  md: { elevation: 4, ios: { shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } } },
  lg: { elevation: 8, ios: { shadowOpacity: 0.1, shadowRadius: 15, shadowOffset: { width: 0, height: 10 } } },
  xl: { elevation: 12, ios: { shadowOpacity: 0.1, shadowRadius: 25, shadowOffset: { width: 0, height: 20 } } },
  '2xl': { elevation: 16, ios: { shadowOpacity: 0.25, shadowRadius: 50, shadowOffset: { width: 0, height: 25 } } },
};

export function useShadow(size: keyof typeof baseShadowMap = 'md') {
  const theme = useTheme();
  const { density } = useSpacing();
  const multiplier = DENSITY_MULTIPLIERS[density];
  
  if (Platform.OS === 'web') {
    return {
      boxShadow: `var(--shadow-${size})`,
    };
  }
  
  // Scale shadows based on density
  const shadowMap = Object.entries(baseShadowMap).reduce((acc, [key, value]) => {
    acc[key] = {
      elevation: Math.round(value.elevation * multiplier),
      ios: {
        ...value.ios,
        shadowRadius: value.ios.shadowRadius * multiplier,
        shadowOffset: {
          width: value.ios.shadowOffset.width * multiplier,
          height: value.ios.shadowOffset.height * multiplier,
        },
      },
    };
    return acc;
  }, {} as typeof baseShadowMap);
  
  if (Platform.OS === 'android') {
    return {
      elevation: shadowMap[size].elevation,
    };
  }
  
  // iOS
  return {
    shadowColor: theme.foreground,
    ...shadowMap[size].ios,
  };
}
```

### 2. Shadow Component Wrapper

```typescript
// components/universal/ShadowBox.tsx
import { View, ViewProps } from 'react-native';
import { useShadow } from '@/lib/design/use-shadow';
import { cn } from '@/lib/utils';

interface ShadowBoxProps extends ViewProps {
  shadow?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function ShadowBox({ shadow = 'md', style, className, ...props }: ShadowBoxProps) {
  const shadowStyle = useShadow(shadow);
  
  return (
    <View 
      className={cn(
        'bg-card rounded-md',
        className
      )}
      style={[shadowStyle, style]}
      {...props}
    />
  );
}
```

### 3. Tailwind Shadow Classes with Density

```typescript
// lib/design/shadow-classes.ts
import { useSpacing } from '@/lib/stores/spacing-store';
import { cn } from '@/lib/utils';

export const shadowClasses = {
  xs: 'shadow-[var(--shadow-xs)]',
  sm: 'shadow-[var(--shadow-sm)]',
  md: 'shadow-[var(--shadow-md)]',
  lg: 'shadow-[var(--shadow-lg)]',
  xl: 'shadow-[var(--shadow-xl)]',
  '2xl': 'shadow-[var(--shadow-2xl)]',
  inner: 'shadow-[var(--shadow-inner)]',
};

// With hover states
export const shadowWithHover = {
  xs: 'shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]',
  sm: 'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
  md: 'shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]',
  lg: 'shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)]',
  xl: 'shadow-[var(--shadow-xl)] hover:shadow-[var(--shadow-2xl)]',
};

// Density-aware shadow helper
export function getDensityShadowClass(size: keyof typeof shadowClasses) {
  const { density } = useSpacing();
  
  // Adjust shadow size based on density
  const sizeMap = {
    compact: { xs: 'xs', sm: 'xs', md: 'sm', lg: 'md', xl: 'lg', '2xl': 'xl' },
    medium: { xs: 'xs', sm: 'sm', md: 'md', lg: 'lg', xl: 'xl', '2xl': '2xl' },
    large: { xs: 'sm', sm: 'md', md: 'lg', lg: 'xl', xl: '2xl', '2xl': '2xl' },
  };
  
  const adjustedSize = sizeMap[density][size] || size;
  return shadowClasses[adjustedSize as keyof typeof shadowClasses];
}
```

## Migration Examples

### Before (Current Implementation)
```typescript
// Inconsistent shadow handling
<Card
  style={{
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }}
>
```

### After (Recommended)
```typescript
// Option 1: Using hook with density
const shadowStyle = useShadow('md'); // Automatically scales with density
<Card style={shadowStyle}>

// Option 2: Using ShadowBox
<ShadowBox shadow="md">
  <CardContent />
</ShadowBox>

// Option 3: Using Tailwind with density helper
<Card className={getDensityShadowClass('md')}>

// Option 4: Block-level shadow
<Card className={cn(
  'rounded-lg',
  density === 'compact' && shadowClasses.sm,
  density === 'medium' && shadowClasses.md,
  density === 'large' && shadowClasses.lg
)}>
```

## Component Migration Checklist

1. **Card Component** ✓
   - Already implements platform-specific shadows
   - Could benefit from using shadow variables

2. **Button Component** ✓
   - Has shadow implementation
   - Should use consistent shadow sizes

3. **Modal/Dialog Components** ❌
   - Need shadow implementation
   - Should use 'xl' or '2xl' shadows

4. **Dropdown/Select Components** ❌
   - Need shadow for dropdown panels
   - Should use 'lg' shadow

5. **Toast/Alert Components** ❌
   - Need subtle shadows
   - Should use 'sm' or 'md' shadows

6. **Navigation Components** ❌
   - Header/TabBar need shadows
   - Should use 'sm' shadow with scroll

## Platform Considerations

### Web
- Use CSS variables directly
- Support hover states
- Ensure dark mode compatibility

### iOS
- Use shadowColor, shadowOffset, shadowOpacity, shadowRadius
- Consider performance with many shadows
- Test on actual devices

### Android
- Use elevation only
- Limited to Material Design elevation levels
- No color customization

## Dark Mode Handling

The CSS variables already handle dark mode with increased opacity:
```css
.dark {
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
  /* ... other shadows with 3x opacity ... */
}
```

## Block-Level Shadow Implementation

For blocks, use density-aware shadows that scale appropriately:

```typescript
// Example: Healthcare Alert Block
export function AlertBlock() {
  const { density } = useSpacing();
  const shadowClass = getDensityShadowClass('md');
  
  return (
    <Card className={cn(
      'p-4 rounded-lg',
      shadowClass,
      // Density-based padding
      density === 'compact' && 'p-3',
      density === 'medium' && 'p-4',
      density === 'large' && 'p-6'
    )}>
      {/* Block content */}
    </Card>
  );
}
```

### Recommended Shadow Sizes by Block Type
- **Metric Cards**: `sm` shadow (subtle elevation)
- **Action Blocks**: `md` shadow (standard elevation)
- **Modal/Overlay Blocks**: `xl` shadow (high elevation)
- **Navigation Blocks**: `sm` shadow with scroll state
- **Alert/Notification Blocks**: `md` shadow with hover state

## Performance Tips

1. **Avoid excessive shadows on mobile**
   - Shadows are expensive on React Native
   - Use sparingly on lists

2. **Memoize shadow styles**
   ```typescript
   const shadowStyle = useMemo(() => useShadow('md'), []);
   ```

3. **Use CSS on web when possible**
   - CSS shadows perform better than inline styles
   - Use Tailwind classes for static shadows

## Testing Shadows

1. **Visual Regression Tests**
   - Screenshot components with shadows
   - Compare across platforms

2. **Performance Tests**
   - Measure render time with/without shadows
   - Check scroll performance

3. **Accessibility**
   - Ensure sufficient contrast
   - Don't rely only on shadows for hierarchy