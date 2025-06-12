# Responsive Design System Reference

## Overview

The Modern Expo Starter Kit provides a comprehensive responsive design system that ensures your app looks great on all screen sizes, from mobile phones to large desktop displays.

## Core Concepts

### 1. Breakpoints

Our breakpoint system follows industry standards:

```typescript
BREAKPOINTS = {
  xs: 0,      // Mobile portrait
  sm: 640,    // Mobile landscape
  md: 768,    // Tablet portrait
  lg: 1024,   // Tablet landscape / Small desktop
  xl: 1280,   // Desktop
  '2xl': 1536 // Large desktop
}
```

### 2. Responsive Value Type

Any prop can accept responsive values:

```typescript
type ResponsiveValue<T> = T | {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
};
```

### 3. Responsive Hooks

#### useBreakpoint()
Get the current breakpoint:
```typescript
const breakpoint = useBreakpoint(); // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
```

#### useResponsiveValue()
Get responsive value for current screen:
```typescript
const padding = useResponsiveValue({ xs: 4, md: 6, lg: 8 }); // Returns 4, 6, or 8
```

#### useMediaQuery()
Check if screen matches breakpoint:
```typescript
const isLargeScreen = useMediaQuery('lg'); // true if screen >= 1024px
```

#### Convenience Hooks
```typescript
const isMobile = useIsMobile();   // true if screen < 768px
const isTablet = useIsTablet();   // true if 768px <= screen < 1024px
const isDesktop = useIsDesktop(); // true if screen >= 1024px
```

## Responsive Tokens

### Spacing Tokens
```typescript
RESPONSIVE_SPACING = {
  container: {
    paddingX: { xs: 16, sm: 20, md: 24, lg: 32, xl: 40, '2xl': 48 },
    maxWidth: { xs: '100%', sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }
  },
  grid: {
    gap: { xs: 16, sm: 20, md: 24, lg: 32 },
    columns: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 }
  }
}
```

### Typography Tokens
```typescript
RESPONSIVE_TYPOGRAPHY = {
  h1: {
    xs: { fontSize: 28, lineHeight: 36 },
    sm: { fontSize: 32, lineHeight: 40 },
    md: { fontSize: 36, lineHeight: 44 },
    lg: { fontSize: 40, lineHeight: 48 },
    xl: { fontSize: 48, lineHeight: 56 }
  },
  body: {
    xs: { fontSize: 14, lineHeight: 20 },
    sm: { fontSize: 16, lineHeight: 24 },
    md: { fontSize: 18, lineHeight: 28 }
  }
}
```

## Platform-Specific Tokens

### Font Families
```typescript
PLATFORM_TOKENS.fontFamily = {
  ios: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'Menlo'
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    mono: 'monospace'
  },
  web: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, serif',
    mono: 'Menlo, Monaco, Consolas, monospace'
  }
}
```

### Shadow System
```typescript
PLATFORM_TOKENS.shadow = {
  ios: {
    sm: { shadowColor, shadowOffset, shadowOpacity, shadowRadius },
    md: { ... },
    lg: { ... }
  },
  android: {
    sm: { elevation: 2 },
    md: { elevation: 4 },
    lg: { elevation: 8 }
  },
  web: {
    sm: { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' },
    md: { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' },
    lg: { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' }
  }
}
```

## Usage Examples

### Basic Responsive Props
```typescript
<Box
  p={{ xs: 4, md: 6, lg: 8 }}
  maxWidth={{ xs: '100%', lg: 1280 }}
>
  Content
</Box>
```

### Responsive Text
```typescript
<Text
  size={{ xs: 'sm', md: 'base', lg: 'lg' }}
  weight={{ xs: 'normal', md: 'medium' }}
>
  Responsive text
</Text>
```

### Conditional Rendering
```typescript
function MyComponent() {
  const isMobile = useIsMobile();
  
  return (
    <>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <DesktopLayout />
      )}
    </>
  );
}
```

### Responsive Grid
```typescript
<Grid
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
  gap={{ xs: 4, md: 6 }}
>
  {items.map(item => (
    <GridItem key={item.id}>{item.content}</GridItem>
  ))}
</Grid>
```

### Platform-Specific Styles
```typescript
const styles = {
  ...Platform.select({
    ios: PLATFORM_TOKENS.shadow.ios.md,
    android: PLATFORM_TOKENS.shadow.android.md,
    web: PLATFORM_TOKENS.shadow.web.md,
  })
};
```

## Component Patterns

### Responsive Container
```typescript
<ResponsiveAnimatedContainer
  maxWidth={{ xs: '100%', lg: 1280 }}
  px={{ xs: 4, sm: 6, md: 8, lg: 12 }}
  py={{ xs: 4, sm: 6, md: 8 }}
>
  {children}
</ResponsiveAnimatedContainer>
```

### Responsive Navigation
```typescript
function Navigation() {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileDrawer />;
  }
  
  return <DesktopSidebar />;
}
```

### Responsive Form
```typescript
<Form>
  <Grid columns={{ xs: 1, md: 2 }} gap={4}>
    <Input
      label="First Name"
      size={{ xs: 'sm', md: 'md' }}
    />
    <Input
      label="Last Name"
      size={{ xs: 'sm', md: 'md' }}
    />
  </Grid>
</Form>
```

## Best Practices

### 1. Mobile-First Design
Start with mobile styles and add larger breakpoints:
```typescript
// Good
p={{ xs: 4, md: 6, lg: 8 }}

// Avoid
p={{ lg: 8, md: 6, xs: 4 }}
```

### 2. Use Semantic Breakpoints
Choose breakpoints based on content, not devices:
```typescript
// Good - content-based
<Text size={{ xs: 'sm', md: 'base' }}>

// Avoid - device-specific
<Text size={isIPhone ? 'sm' : 'base'}>
```

### 3. Test at All Breakpoints
Always test your UI at:
- 320px (small mobile)
- 768px (tablet)
- 1024px (desktop)
- 1920px (large desktop)

### 4. Optimize for Performance
```typescript
// Good - single hook call
const { padding, margin, fontSize } = useResponsiveValue({
  padding: { xs: 4, md: 6 },
  margin: { xs: 2, md: 4 },
  fontSize: { xs: 14, md: 16 }
});

// Avoid - multiple hook calls
const padding = useResponsiveValue({ xs: 4, md: 6 });
const margin = useResponsiveValue({ xs: 2, md: 4 });
const fontSize = useResponsiveValue({ xs: 14, md: 16 });
```

### 5. Accessibility
- Ensure touch targets are at least 44x44 on mobile
- Maintain readable font sizes (minimum 14px)
- Provide adequate spacing between interactive elements

## Debugging

### Visual Breakpoint Indicator
```typescript
function BreakpointIndicator() {
  const breakpoint = useBreakpoint();
  
  if (!__DEV__) return null;
  
  return (
    <Box position="fixed" top={0} right={0} p={2} bgTheme="primary">
      <Text size="xs" colorTheme="primaryForeground">{breakpoint}</Text>
    </Box>
  );
}
```

### Responsive Debug Info
```typescript
function ResponsiveDebug({ value }) {
  const resolved = useResponsiveValue(value);
  
  return (
    <Box>
      <Text>Current: {JSON.stringify(resolved)}</Text>
      <Text>Original: {JSON.stringify(value)}</Text>
    </Box>
  );
}
```

---

*For implementation details, see the [Cross-Platform Animation Guide](../design-system/cross-platform-animation-guide.md)*