# Responsive Design Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing responsive design across all components in the Modern Expo Starter Kit.

## Implementation Checklist

### ✅ Completed Components
- [x] **Input** - Responsive sizing, validation animations
- [x] **EscalationTimer** - Responsive padding, font sizes, mobile/desktop layouts
- [x] **AnimatedBox** - Full responsive prop support

### 📋 Pending Components

#### Core Layout Components
- [ ] **Box** - Add responsive padding/margin/width/height props
- [ ] **Stack (HStack/VStack)** - Responsive spacing, direction switching
- [ ] **Container** - Responsive max-width, padding, centering
- [ ] **Grid** - Responsive columns, gap, auto-flow
- [ ] **ScrollContainer** - Responsive content width

#### Typography Components
- [ ] **Text** - Responsive size, line-height, weight
- [ ] **Heading (H1-H4)** - Responsive font scales
- [ ] **Label** - Responsive sizing

#### Form Components
- [ ] **Button** - Responsive sizes, padding, font
- [ ] **Select** - Responsive width, dropdown positioning
- [ ] **Checkbox/Switch** - Responsive sizing
- [ ] **RadioGroup** - Responsive layout (vertical/horizontal)
- [ ] **Slider** - Responsive track width
- [ ] **DatePicker** - Responsive calendar layout
- [ ] **Search** - Responsive input width
- [ ] **FilePicker** - Responsive preview grid
- [ ] **ColorPicker** - Responsive picker size

#### Feedback Components
- [ ] **Alert** - Responsive padding, font sizes
- [ ] **Badge** - Responsive sizing
- [ ] **Progress** - Responsive height/width
- [ ] **Skeleton** - Responsive dimensions
- [ ] **Toast** - Responsive positioning, width

#### Navigation Components
- [ ] **Tabs** - Responsive layout (horizontal/vertical)
- [ ] **Sidebar** - Responsive width, breakpoint visibility
- [ ] **NavigationMenu** - Responsive item layout
- [ ] **Breadcrumb** - Responsive overflow handling
- [ ] **Pagination** - Responsive button count
- [ ] **Stepper** - Responsive orientation

#### Overlay Components
- [ ] **Dialog** - Responsive width, max-width, padding
- [ ] **Drawer** - Responsive width, position
- [ ] **Popover** - Responsive positioning, width
- [ ] **Tooltip** - Responsive font size, max-width
- [ ] **DropdownMenu** - Responsive item layout

#### Data Display Components
- [ ] **Card** - Responsive padding, layout
- [ ] **Table** - Responsive columns, scroll behavior
- [ ] **Timeline** - Responsive orientation
- [ ] **Stats** - Responsive grid layout
- [ ] **Avatar** - Responsive sizes
- [ ] **EmptyState** - Responsive icon/text sizing
- [ ] **List** - Responsive item layout

## Implementation Pattern

### 1. Add Responsive Types

```typescript
import { ResponsiveValue } from '@/lib/design-system/responsive';

interface ComponentProps {
  // Before
  size?: 'sm' | 'md' | 'lg';
  padding?: number;
  
  // After
  size?: ResponsiveValue<'sm' | 'md' | 'lg'>;
  padding?: ResponsiveValue<number>;
  margin?: ResponsiveValue<number>;
  width?: ResponsiveValue<number | string>;
  display?: ResponsiveValue<'none' | 'flex' | 'block'>;
}
```

### 2. Use Responsive Hooks

```typescript
import { useResponsiveValue, useIsMobile } from '@/hooks/useResponsive';

export function Component({ size, padding, ...props }: ComponentProps) {
  const responsiveSize = useResponsiveValue(size || 'md');
  const responsivePadding = useResponsiveValue(padding || 4);
  const isMobile = useIsMobile();
  
  // Apply responsive values
  const styles = {
    padding: responsivePadding * 4, // Convert to pixels
    ...getSizeStyles(responsiveSize),
  };
  
  return (
    <View style={styles}>
      {/* Component content */}
    </View>
  );
}
```

### 3. Platform-Specific Implementation

```typescript
import { Platform } from 'react-native';
import { createAnimationStyle } from '@/lib/animations/platform-animations';

export function ResponsiveComponent({ children, ...props }) {
  const padding = useResponsiveValue(props.padding || { xs: 4, md: 6 });
  
  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          padding: `${padding * 4}px`,
          ...responsiveStyle({
            xs: { fontSize: 14 },
            md: { fontSize: 16 },
            lg: { fontSize: 18 },
          }),
        }}
      >
        {children}
      </div>
    );
  }
  
  // Native implementation
  return (
    <View style={{ padding: padding * 4 }}>
      {children}
    </View>
  );
}
```

## Common Patterns

### Responsive Container
```typescript
function ResponsiveContainer({ children }) {
  const maxWidth = useResponsiveValue({ xs: '100%', lg: 1280 });
  const px = useResponsiveValue({ xs: 4, sm: 6, md: 8, lg: 12 });
  
  return (
    <Box
      maxWidth={maxWidth}
      px={px}
      mx="auto"
    >
      {children}
    </Box>
  );
}
```

### Responsive Grid
```typescript
function ResponsiveGrid({ items }) {
  const columns = useResponsiveValue({ xs: 1, sm: 2, md: 3, lg: 4 });
  const gap = useResponsiveValue({ xs: 4, md: 6 });
  
  return (
    <Grid columns={columns} gap={gap}>
      {items.map(item => (
        <GridItem key={item.id}>{item}</GridItem>
      ))}
    </Grid>
  );
}
```

### Conditional Layout
```typescript
function ResponsiveLayout({ children }) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }
  
  if (isTablet) {
    return <TabletLayout>{children}</TabletLayout>;
  }
  
  return <DesktopLayout>{children}</DesktopLayout>;
}
```

## Testing Guidelines

### 1. Test at Key Breakpoints
- 320px - Small mobile (iPhone SE)
- 375px - Standard mobile (iPhone X)
- 768px - Tablet (iPad)
- 1024px - Desktop
- 1440px - Large desktop
- 1920px - Full HD

### 2. Test Orientation Changes
- Portrait to landscape on mobile/tablet
- Window resizing on desktop

### 3. Test Platform Differences
- iOS Safari
- Android Chrome
- Desktop Chrome/Firefox/Safari

### 4. Performance Testing
- Measure re-render performance during resize
- Check for layout shift during breakpoint changes
- Verify smooth animations across breakpoints

## Migration Guide

### Updating Existing Components

1. **Identify Fixed Values**
```typescript
// Before
<Box p={4} width={300}>

// After
<Box 
  p={{ xs: 3, md: 4 }} 
  width={{ xs: '100%', md: 300 }}
>
```

2. **Replace Media Queries**
```typescript
// Before
const styles = StyleSheet.create({
  container: {
    padding: Platform.OS === 'web' && window.innerWidth > 768 ? 24 : 16
  }
});

// After
const padding = useResponsiveValue({ xs: 4, md: 6 });
```

3. **Update Conditional Rendering**
```typescript
// Before
{Platform.OS === 'web' && window.innerWidth > 768 && <DesktopNav />}

// After
{!isMobile && <DesktopNav />}
```

## Performance Considerations

1. **Memoize Responsive Values**
```typescript
const responsiveStyles = useMemo(() => ({
  padding: useResponsiveValue(padding),
  margin: useResponsiveValue(margin),
}), [padding, margin]);
```

2. **Batch Updates**
```typescript
// Good - single update
const { padding, margin, fontSize } = useResponsiveValue({
  padding: { xs: 4, md: 6 },
  margin: { xs: 2, md: 4 },
  fontSize: { xs: 14, md: 16 }
});
```

3. **Lazy Load Breakpoint-Specific Components**
```typescript
const DesktopChart = lazy(() => import('./DesktopChart'));

function Chart() {
  const isDesktop = useIsDesktop();
  
  if (!isDesktop) return <MobileChart />;
  
  return (
    <Suspense fallback={<Skeleton />}>
      <DesktopChart />
    </Suspense>
  );
}
```

---

*Next: [Universal Components Animation Plan](./universal-components-animation-plan.md)*