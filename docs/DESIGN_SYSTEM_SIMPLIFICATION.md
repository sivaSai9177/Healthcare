# Design System Simplification Plan

## Current State Analysis

### The Problem: Duplicate Systems

We currently have two parallel styling systems:

1. **Tailwind/NativeWind** - Complete styling solution with:
   - Colors, spacing, typography scales
   - Responsive utilities
   - Animation classes
   - All configured in `tailwind.config.ts`

2. **Custom Design System** (`lib/design/`) - Duplicates functionality:
   - Custom spacing scales
   - Custom responsive utilities
   - Custom animation variants
   - Design tokens

This creates:
- Confusion about which system to use
- TypeScript errors from mismatched APIs
- Increased bundle size
- Maintenance overhead

### Examples of Current Issues

```typescript
// Mixing approaches in components:
<Box className="p-4" style={{ padding: spacing[4] }}>  // Which one?
<VStack space={theme.md}>  // theme.md doesn't exist
<Button variant="solid">    // TypeScript error - wrong variant type
```

## Target Architecture

```
Tailwind/NativeWind (All Styling)
         ↓
Universal Components (Tailwind-powered)
         ↓
Blocks (Composed Components)
         ↓
Screens (Business Logic + API)

Supporting Systems:
- Stores: Theme switching, Auth, Animation preferences
- Hooks: Responsive utils, Animation helpers
- Platform: Haptics, Native features
```

## Migration Strategy

### Phase 1: Remove Redundant Design Tokens

**What to Remove:**
- `lib/design/tokens.ts` - Use Tailwind tokens
- `lib/design/spacing.ts` - Use Tailwind spacing (p-4, m-2, etc.)
- Custom responsive breakpoints - Use Tailwind's breakpoints

**What to Keep:**
- `lib/design/animation-variants.ts` - Animation orchestration
- `lib/design/responsive.ts` - Only keep hooks like `useResponsive()`

### Phase 2: Update Universal Components

Convert all components to be Tailwind-first:

```typescript
// Before - Mixed approach
export const Button = ({ variant, size, spacing, ...props }) => {
  const { spacing: themeSpacing } = useSpacing();
  return (
    <Pressable
      style={{
        padding: themeSpacing[size],
        backgroundColor: getVariantColor(variant)
      }}
    >
      {children}
    </Pressable>
  );
};

// After - Tailwind-first
export const Button = ({ variant = 'primary', size = 'md', className, ...props }) => {
  const variants = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <Pressable
      className={cn(
        'rounded-md font-medium transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Pressable>
  );
};
```

### Phase 3: Simplify Spacing Usage

**Remove:**
- `useSpacing()` hook usage
- `spacing.md`, `spacing.lg` references
- Complex spacing calculations

**Replace with:**
- Tailwind classes: `space-y-4`, `gap-2`, `p-4`
- Or direct numeric values where needed

### Phase 4: Animation & Micro-interactions Architecture

**Keep This Excellent System:**

```typescript
// 1. Tailwind-first animations (web)
const { className, trigger } = useAnimation('fadeIn');
// Returns: className="animate-fade-in"

// 2. Native animations (iOS/Android)
const { animatedStyle } = useAnimation('fadeIn');
// Returns: Reanimated style

// 3. Haptic feedback
<Button onPress={() => {
  haptic('light');
  handlePress();
}}>

// 4. Animation preferences
const { reducedMotion, animationSpeed } = useAnimationStore();
```

**Animation Architecture:**
```
tailwind.config.ts          → Animation class definitions
lib/ui/animations/          → Cross-platform animation hooks
lib/ui/haptics/            → Haptic feedback patterns
lib/stores/animation-store → User preferences

Components use:
- useAnimation() for motion
- haptic() for feedback
- Respect user preferences
```

## Benefits of Simplification

1. **Single Source of Truth**: Tailwind for all styling
2. **Better TypeScript**: No more missing property errors
3. **Smaller Bundle**: Remove duplicate implementations
4. **Easier Onboarding**: Standard Tailwind knowledge applies
5. **Better Performance**: Less runtime calculations

## Implementation Checklist

- [ ] Remove redundant design token files
- [ ] Update all component imports
- [ ] Convert components to Tailwind classes
- [ ] Fix spacing usage (no more theme.]
- [ ] Update documentation
- [ ] Test on all platforms

## Example Component Pattern

```typescript
// Universal component using Tailwind + our animation system
export const Card = ({ 
  children, 
  className,
  animated = true,
  onPress,
  ...props 
}) => {
  const { animatedStyle } = useAnimation('scaleIn', {
    duration: 'fast',
  });
  
  const handlePress = () => {
    if (onPress) {
      haptic('light');
      onPress();
    }
  };
  
  return (
    <Animated.View
      style={animated ? animatedStyle : undefined}
      className={cn(
        // Base styles
        'bg-card rounded-lg p-4',
        // Shadows using Tailwind
        'shadow-sm',
        // Hover/press states
        'active:scale-95 transition-transform',
        className
      )}
      onPress={handlePress}
      {...props}
    >
      {children}
    </Animated.View>
  );
};
```

## What Stays The Same

1. **Component Structure**: Universal → Blocks → Screens
2. **Animation System**: Hooks, haptics, preferences
3. **Theme Switching**: Light/dark mode support
4. **Platform Adaptations**: iOS/Android/Web specific code

## What Changes

1. **Styling**: Everything uses Tailwind classes
2. **Spacing**: Use Tailwind scale (2, 4, 6, 8, etc.)
3. **Colors**: Use Tailwind/CSS variables
4. **Responsive**: Use Tailwind breakpoints (sm:, md:, lg:)

## Migration Priority

1. **High Priority**: Fix TypeScript errors first
   - Remove theme.colors usage
   - Fix spacing token usage
   - Update component props

2. **Medium Priority**: Convert components
   - Start with most-used components
   - Update one component at a time
   - Test thoroughly

3. **Low Priority**: Optimize and cleanup
   - Remove unused files
   - Update documentation
   - Add examples