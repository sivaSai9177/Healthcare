# Responsive System Architecture

Last Updated: January 2025

## Overview

Our responsive system is designed to support multiple platforms and form factors:
- Web (fully responsive)
- Mobile apps (iOS/Android)
- Desktop apps (Mac/Windows)
- Apple Watch / WearOS
- Apple Vision Pro
- TV (Apple TV, Android TV)

## Architecture

### Design Tokens (`/lib/design/responsive.ts`)
Contains static design tokens and utilities:
- Breakpoints
- Platform-specific tokens (shadows, fonts)
- Responsive spacing and typography scales
- CSS-in-JS utilities for web

### Responsive Hooks (`/hooks/responsive/`)
React hooks for responsive behavior:
- `useResponsive()` - Main responsive hook
- `useDeviceType()` - Platform and device detection
- `useBreakpoint()` - Current breakpoint tracking
- `useMediaQuery()` - Media query matching
- `useResponsiveValue()` - Responsive prop values
- `useReducedMotion()` - Accessibility preferences

## Usage Guide

### Basic Responsive Layout

```typescript
import { useResponsive } from '@/hooks/responsive';

function MyComponent() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  return (
    <View>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </View>
  );
}
```

### Device-Specific Features

```typescript
import { useDeviceType } from '@/hooks/responsive';

function CrossPlatformComponent() {
  const device = useDeviceType();
  
  if (device.isWatch) {
    return <WatchOptimizedView />;
  }
  
  if (device.isTV) {
    return <TVFocusableView />;
  }
  
  if (device.isVision) {
    return <SpatialView />;
  }
  
  // Regular responsive view
  return (
    <View style={{
      padding: device.isPhone ? 16 : 32,
      flexDirection: device.isPortrait ? 'column' : 'row'
    }}>
      {/* content */}
    </View>
  );
}
```

### Responsive Values

```typescript
import { useResponsiveValue } from '@/hooks/responsive';
import { RESPONSIVE_SPACING } from '@/lib/design/responsive';

function ResponsiveCard() {
  const padding = useResponsiveValue({
    xs: 16,
    md: 24,
    lg: 32
  });
  
  const columns = useResponsiveValue({
    xs: 1,
    sm: 2,
    lg: 3
  });
  
  return (
    <Card style={{ padding }}>
      <Grid columns={columns}>
        {/* content */}
      </Grid>
    </Card>
  );
}
```

### Platform-Specific Styling

```typescript
import { useResponsiveUtils } from '@/hooks/responsive';

function PlatformAwareComponent() {
  const { getPlatformShadow, platformTokens } = useResponsiveUtils();
  
  return (
    <View style={[
      styles.container,
      getPlatformShadow('md') // Platform-specific shadow
    ]}>
      <Text style={{
        fontFamily: platformTokens.fontFamily.sans
      }}>
        Platform-optimized text
      </Text>
    </View>
  );
}
```

## Breakpoints

| Breakpoint | Min Width | Target Devices |
|------------|-----------|----------------|
| xs         | 0px       | Small phones, watches |
| sm         | 640px     | Regular phones |
| md         | 768px     | Large phones, small tablets |
| lg         | 1024px    | Tablets, small laptops |
| xl         | 1280px    | Desktops, large tablets |
| 2xl        | 1536px    | Large desktops, TVs |

## Special Device Support

### Apple Watch / WearOS

```typescript
import { useWatchLayout } from '@/hooks/responsive';

function WatchApp() {
  const { isWatch, isRound, spacing, fontSize } = useWatchLayout();
  
  if (!isWatch) return null;
  
  return (
    <ScrollView>
      <Text style={{ fontSize: fontSize.sm }}>
        Optimized for {isRound ? 'round' : 'square'} watch
      </Text>
    </ScrollView>
  );
}
```

### TV Navigation

```typescript
import { useTVNavigation } from '@/hooks/responsive';

function TVMenu({ items }) {
  const { isTV, focusedIndex, navigateDown, navigateUp } = useTVNavigation();
  
  if (!isTV) return <RegularMenu items={items} />;
  
  return (
    <FocusableList>
      {items.map((item, index) => (
        <TVMenuItem 
          key={item.id}
          focused={index === focusedIndex}
          onPress={() => handleSelect(item)}
        />
      ))}
    </FocusableList>
  );
}
```

### Vision Pro Spatial UI

```typescript
import { useVisionSpatial } from '@/hooks/responsive';

function VisionProUI() {
  const { isVision, depthLevels, transform3D } = useVisionSpatial();
  
  if (!isVision) return <RegularUI />;
  
  return (
    <View>
      <View style={transform3D(depthLevels.background)}>
        <BackgroundContent />
      </View>
      <View style={transform3D(depthLevels.foreground)}>
        <InteractiveContent />
      </View>
    </View>
  );
}
```

## Migration Guide

### From Old Theme System

```typescript
// Old (using theme)
const theme = useTheme();
const isMobile = theme.breakpoint === 'mobile';

// New (using responsive hooks)
const { isMobile } = useResponsive();
```

### From Static Breakpoints

```typescript
// Old
const styles = {
  padding: width < 768 ? 16 : 32
};

// New
const padding = useResponsiveValue({
  xs: 16,
  md: 32
});
```

## Best Practices

1. **Use semantic hooks** - Prefer `isMobile` over checking width manually
2. **Design mobile-first** - Start with smallest breakpoint and scale up
3. **Test on real devices** - Simulators don't capture all edge cases
4. **Consider orientation** - Use `isPortrait`/`isLandscape` for layout decisions
5. **Optimize for each platform** - Don't just scale, redesign for different form factors

## Performance Considerations

- Responsive hooks use event listeners that are automatically cleaned up
- Values are memoized to prevent unnecessary re-renders
- Use `useResponsiveValue` for values that change with breakpoints
- Avoid creating new objects in render for responsive styles

## Testing

```typescript
// Mock device type in tests
jest.mock('@/hooks/responsive', () => ({
  useDeviceType: () => ({
    isPhone: true,
    isTablet: false,
    isDesktop: false,
    formFactor: 'phone',
    width: 375,
    height: 812
  })
}));
```