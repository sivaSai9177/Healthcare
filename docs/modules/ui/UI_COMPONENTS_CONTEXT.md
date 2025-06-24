# UI Components Context Document

**Last Updated**: January 23, 2025  
**Version**: 1.0.0  
**Status**: Active Development

## Overview

This document provides comprehensive context for the UI component system in the Healthcare Alert System. It covers the universal design system, component architecture, styling patterns, and guidelines for creating consistent, accessible, and performant user interfaces across all platforms.

## Table of Contents

1. [Design System Overview](#design-system-overview)
2. [Component Categories](#component-categories)
3. [Responsive Design System](#responsive-design-system)
4. [Platform Adaptability](#platform-adaptability)
5. [Theming & Styling](#theming--styling)
6. [Animation System](#animation-system)
7. [Component Patterns](#component-patterns)
8. [Accessibility](#accessibility)
9. [Performance Guidelines](#performance-guidelines)
10. [Future Roadmap](#future-roadmap)

---

## 1. Design System Overview

### Philosophy
Our design system prioritizes:
- **Consistency**: Unified experience across platforms
- **Adaptability**: Responsive to any screen size
- **Performance**: Fast rendering and smooth animations
- **Accessibility**: WCAG 2.1 AA compliance
- **Developer Experience**: Easy to use and extend

### Architecture
```
/components/universal/      # Core design system
  /typography/             # Text components
  /layout/                 # Layout primitives
  /form/                   # Form controls
  /display/                # Display components
  /interaction/            # Interactive elements
  /feedback/               # Feedback components
  /navigation/             # Navigation components
  /overlay/                # Modals, sheets, etc.
  /charts/                 # Data visualization

/lib/design/               # Design utilities
  /tokens.ts               # Design tokens
  /spacing.ts              # Spacing system
  /responsive-system.ts    # Responsive utilities

/lib/theme/                # Theming system
  /provider.tsx            # Theme provider
  /registry.tsx            # Theme registry
```

### Design Tokens
- **Colors**: Semantic color system with theme variants
- **Typography**: Modular scale from xs to 9xl
- **Spacing**: 0-96 scale based on 4px grid
- **Shadows**: Platform-adaptive shadow system
- **Border Radius**: Consistent radius scale
- **Animation**: Standardized durations and easings

---

## 2. Component Categories

### Typography Components (15+)

#### Core Components
- **Text**: Base component with responsive sizing
  ```tsx
  <Text size="lg" weight="semibold" colorTheme="primary">
    Emergency Alert
  </Text>
  ```

- **Heading1-6**: Semantic heading components
- **Display1-2**: Large display text
- **Body/BodyLarge/BodySmall**: Body text variants
- **Caption/Overline**: Supporting text
- **Code/CodeBlock**: Monospace text

#### Features
- Responsive font sizing
- Platform-specific font families
- Automatic text scaling
- Theme-aware colors
- Animation support

### Layout Components (11)

#### Stack System
- **Stack**: Flexible container with gap support
- **VStack/HStack/ZStack**: Directional stacks
  ```tsx
  <VStack gap={4} align="center">
    <Text>Item 1</Text>
    <Text>Item 2</Text>
  </VStack>
  ```

#### Container Components
- **Box**: Universal container with layout props
- **Container**: Max-width responsive container
- **Grid**: Responsive grid system
- **WidgetGrid**: Widget-based layouts

#### Utilities
- **Spacer**: Flexible spacing
- **Separator/Divider**: Visual separation
- **ScrollArea**: Managed scrolling

### Form Components (15)

#### Input Controls
- **Input**: Advanced text input
  - Floating labels
  - Validation states
  - Icon support
  - Platform-specific styling

- **TextArea**: Multi-line input
- **Select**: Dropdown selection
- **DatePicker/TimePicker**: Date/time selection

#### Selection Controls
- **Checkbox**: Single selection
- **RadioGroup**: Multiple choice
- **Switch/Toggle**: Binary toggle
- **Slider**: Range selection

#### Features
- Built-in validation
- Error states
- Accessibility labels
- Keyboard navigation

### Display Components (14)

#### Card System
- **Card**: Flexible container
  ```tsx
  <Card variant="glass" p={4}>
    <CardHeader>
      <CardTitle>Alert Summary</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Content */}
    </CardContent>
  </Card>
  ```

- **GlassCard**: Glassmorphism effect
- **Variants**: elevated, outline, glass

#### Data Display
- **Table**: Responsive tables
- **List**: List rendering
- **Timeline**: Event timeline
- **Stats**: Statistics display

#### Status Indicators
- **Badge**: Status badges
- **Tag/Chip**: Tag elements
- **Avatar**: User avatars
- **Rating**: Star ratings

### Interaction Components (8)

#### Button System
- **Button**: Primary interactive element
  ```tsx
  <Button 
    variant="destructive" 
    size="lg"
    isLoading={loading}
    leftIcon={<AlertIcon />}
  >
    Create Alert
  </Button>
  ```

- **Variants**: default, destructive, outline, ghost, glass
- **Sizes**: sm, md, lg, icon
- **States**: loading, disabled, pressed

#### Advanced Interactions
- **Accordion**: Expandable sections
- **Command**: Command palette
- **Search**: Search interface
- **HapticTab**: Haptic feedback tabs

### Feedback Components (15)

#### Loading States
- **Spinner**: Loading spinner
- **LoadingView**: Full-screen loading
- **Skeleton**: Content placeholders
- **RefreshingOverlay**: Pull-to-refresh

#### Notifications
- **Alert**: Alert messages
- **Toast**: Toast notifications
- **ConnectionStatus**: Network status

#### Progress
- **Progress**: Linear progress
- **ProgressBar**: Determinate progress
- **ActivityTimer**: Activity tracking
- **CountdownTimer**: Countdown display

### Navigation Components (10)

#### Tab Navigation
- **Tabs**: Tab container
- **TabBarBackground**: Platform backgrounds
- **HapticTab**: Touch feedback tabs

#### Page Navigation
- **Navbar**: Navigation bar
- **Sidebar**: Side navigation
- **Breadcrumb**: Breadcrumb trail
- **Pagination**: Page navigation

#### Utilities
- **Link**: Navigation links
- **NavigationMenu**: Menu system
- **Stepper**: Step navigation

### Overlay Components (9)

#### Modal System
- **Dialog**: Modal dialogs
- **Sheet**: Bottom sheets
- **Drawer**: Side drawers

#### Popovers
- **Popover**: Floating content
- **Tooltip**: Hover tooltips
- **DropdownMenu**: Dropdown menus
- **ContextMenu**: Right-click menus

### Chart Components (8)

#### Chart Types
- **LineChart**: Time series data
- **BarChart**: Categorical comparison
- **PieChart**: Part-to-whole
- **AreaChart**: Trends over time
- **RadarChart**: Multi-dimensional
- **RadialChart**: Circular progress

#### Features
- Responsive sizing
- Interactive tooltips
- Theme integration
- Animation support

---

## 3. Responsive Design System

### Breakpoint System
```typescript
const Breakpoints = {
  xs: 0,      // Mobile portrait
  sm: 640,    // Mobile landscape  
  md: 768,    // Tablet portrait
  lg: 1024,   // Tablet landscape
  xl: 1280,   // Desktop
  '2xl': 1536 // Large desktop
}
```

### Responsive Hooks

#### useResponsive()
```tsx
const { isMobile, isTablet, isDesktop } = useResponsive();

return (
  <Container>
    {isMobile ? <MobileLayout /> : <DesktopLayout />}
  </Container>
);
```

#### useResponsiveValue()
```tsx
const columns = useResponsiveValue({
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4
});
```

### Density System
- **Compact**: <360px screens (0.75x spacing)
- **Medium**: 360-768px (1x spacing)
- **Large**: >768px (1.25x spacing)

---

## 4. Platform Adaptability

### Platform Detection
```typescript
const { 
  isIOS, 
  isAndroid, 
  isWeb,
  isDesktop,
  isTouchDevice 
} = useDeviceType();
```

### Platform-Specific Components
- `.ios.tsx` - iOS-specific implementation
- `.android.tsx` - Android-specific
- `.web.tsx` - Web-specific
- `.native.tsx` - React Native shared

### Adaptive Patterns

#### Shadows
```tsx
Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  android: {
    elevation: 4
  },
  web: {
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }
})
```

#### Typography
- iOS: SF Pro Display/Text
- Android: Roboto
- Web: System font stack

### Special Device Support
- **Apple Watch**: Simplified layouts
- **TV Platforms**: Focus-based navigation
- **Vision Pro**: 3D spatial positioning

---

## 5. Theming & Styling

### Theme Structure
```typescript
interface Theme {
  // Colors
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  destructive: string;
  muted: string;
  accent: string;
  
  // Component colors
  card: string;
  popover: string;
  border: string;
  input: string;
  
  // Typography
  fontFamily: string;
  fontFamilyMono: string;
}
```

### Built-in Themes
1. **Default**: Clean, medical-focused
2. **Glass**: Glassmorphism effects
3. **Bubblegum**: Soft, friendly colors
4. **Ocean**: Cool, calming palette
5. **Forest**: Natural, earthy tones
6. **Sunset**: Warm, energetic colors

### Styling Approaches

#### Tailwind CSS
```tsx
<View className="flex-1 bg-white dark:bg-gray-900 p-4">
  <Text className="text-lg font-semibold text-gray-900">
    Alert Details
  </Text>
</View>
```

#### Style Props
```tsx
<Box
  p={4}
  m={2}
  bg="primary"
  rounded="lg"
  shadow="md"
>
  Content
</Box>
```

---

## 6. Animation System

### Animation Principles
- **Purposeful**: Animations enhance UX
- **Performant**: 60fps on all devices
- **Consistent**: Standardized durations
- **Accessible**: Respect reduced motion

### Animation Library
- **React Native Reanimated 2**: Native performance
- **Gesture Handler**: Touch interactions
- **CSS Transitions**: Web animations

### Common Animations

#### Entrance Animations
```tsx
<Animated.View entering={FadeInDown.springify()}>
  <AlertCard />
</Animated.View>
```

#### Layout Animations
```tsx
<AnimatedList
  data={alerts}
  itemLayoutAnimation={LinearTransition}
/>
```

#### Gesture Animations
- Swipe to dismiss
- Pull to refresh
- Drag to reorder
- Pinch to zoom

### Animation Utilities
```typescript
const animations = {
  durations: {
    fast: 150,
    base: 250,
    slow: 350
  },
  easings: {
    ease: [0.4, 0, 0.2, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1]
  }
};
```

---

## 7. Component Patterns

### Compound Components
```tsx
<Card>
  <Card.Header>
    <Card.Title>Patient Alert</Card.Title>
    <Card.Description>Room 302</Card.Description>
  </Card.Header>
  <Card.Content>
    {/* Alert details */}
  </Card.Content>
  <Card.Footer>
    <Button>Acknowledge</Button>
  </Card.Footer>
</Card>
```

### Render Props
```tsx
<DataFetcher
  url="/api/alerts"
  render={({ data, loading, error }) => (
    loading ? <Spinner /> :
    error ? <ErrorDisplay /> :
    <AlertList alerts={data} />
  )}
/>
```

### Controlled Components
```tsx
const [value, setValue] = useState('');

<Input
  value={value}
  onChangeText={setValue}
  placeholder="Room number"
/>
```

### Polymorphic Components
```tsx
<Button as={Link} href="/alerts">
  View All Alerts
</Button>
```

---

## 8. Accessibility

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 minimum
- **Touch Targets**: 44x44pt minimum
- **Focus Indicators**: Visible focus states
- **Screen Reader**: Full support

### Accessibility Props
```tsx
<Button
  accessibilityLabel="Create emergency alert"
  accessibilityHint="Double tap to open alert creation form"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
/>
```

### Keyboard Navigation
- Tab order management
- Arrow key navigation
- Escape key handling
- Enter/Space activation

### Screen Reader Support
- Semantic HTML on web
- Accessibility labels on native
- Live regions for updates
- Landmark navigation

---

## 9. Performance Guidelines

### Component Optimization

#### Memoization
```tsx
const AlertCard = React.memo(({ alert }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.alert.id === nextProps.alert.id;
});
```

#### Lazy Loading
```tsx
const HeavyChart = lazy(() => import('./HeavyChart'));

<Suspense fallback={<Skeleton />}>
  <HeavyChart data={data} />
</Suspense>
```

### List Performance
- Use FlashList for large lists
- Implement getItemLayout
- Optimize renderItem
- Use keyExtractor

### Image Optimization
- Lazy load images
- Use appropriate formats
- Implement progressive loading
- Cache processed images

### Bundle Size
- Tree-shake unused components
- Code split by route
- Lazy load heavy dependencies
- Minimize style calculations

---

## 10. Future Roadmap

### Planned Components

#### Q1 2025
- [ ] Rich Text Editor
- [ ] Advanced Data Grid
- [ ] Calendar Component
- [ ] File Upload with Progress
- [ ] Virtual Scroller

#### Q2 2025
- [ ] Video Player
- [ ] Audio Recorder
- [ ] Image Gallery
- [ ] Carousel/Slider
- [ ] Tour/Onboarding

#### Q3 2025
- [ ] Advanced Charts (Heatmap, Treemap)
- [ ] Kanban Board
- [ ] Timeline Gantt
- [ ] Network Graph
- [ ] 3D Visualizations

### Technical Improvements

#### Performance
- [ ] Web Workers for heavy computation
- [ ] Service Worker for offline
- [ ] Virtualization improvements
- [ ] Memory optimization

#### Developer Experience
- [ ] Storybook integration
- [ ] Component playground
- [ ] Visual regression testing
- [ ] Auto-generated docs

#### Accessibility
- [ ] Voice control
- [ ] Better screen reader support
- [ ] High contrast mode
- [ ] Keyboard shortcut system

---

## Component Creation Guidelines

### Creating New Components

1. **Plan the API**
   ```tsx
   interface ComponentProps {
     // Required props
     value: string;
     onChange: (value: string) => void;
     
     // Optional props
     variant?: 'default' | 'outline';
     size?: 'sm' | 'md' | 'lg';
     isDisabled?: boolean;
   }
   ```

2. **Implement Base Component**
   ```tsx
   export const Component = forwardRef<View, ComponentProps>(
     ({ variant = 'default', ...props }, ref) => {
       // Implementation
     }
   );
   ```

3. **Add Platform Variants**
   - Create `.ios.tsx` if needed
   - Create `.web.tsx` for web-specific
   - Share code in `.shared.tsx`

4. **Include Accessibility**
   - Add ARIA labels
   - Implement keyboard navigation
   - Test with screen readers

5. **Document Usage**
   - Add JSDoc comments
   - Create usage examples
   - Update component index

### Testing Requirements
- Unit tests for logic
- Snapshot tests for UI
- Accessibility tests
- Performance benchmarks
- Cross-platform testing

---

## Conclusion

This UI Components Context Document serves as the comprehensive guide for understanding and working with the Healthcare Alert System's design system. The component library provides a solid foundation for building consistent, accessible, and performant user interfaces across all platforms. Regular updates to this document ensure it remains the authoritative source for UI development guidelines and best practices.