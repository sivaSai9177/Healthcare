# Design System Documentation

## Overview

The Hospital Alert System uses a modern, comprehensive design system built with Tailwind CSS, React Native, and custom components. This document outlines the complete design system architecture, components, and usage guidelines.

## Tech Stack

- **Styling**: Tailwind CSS via NativeWind
- **Components**: React Native with TypeScript
- **Animations**: React Native Reanimated 2
- **Icons**: SF Symbols (iOS) / Material Icons (Android)
- **State**: Zustand for theme/spacing stores
- **Responsive**: Custom useResponsive hook

## Core Design Principles

1. **Mobile-First**: Designed primarily for mobile with desktop enhancements
2. **Accessibility**: WCAG 2.1 AA compliant with proper contrast ratios
3. **Performance**: Optimized animations at 60 FPS
4. **Consistency**: Unified component API across platforms
5. **Flexibility**: Responsive props and density-aware spacing

## Design Tokens

### Colors

```typescript
// Tailwind color classes used throughout
const colors = {
  // Brand
  primary: 'blue-600',
  secondary: 'purple-600',
  accent: 'teal-500',
  
  // Semantic
  destructive: 'red-600',
  success: 'green-600',
  warning: 'yellow-600',
  info: 'blue-600',
  
  // Neutral
  background: 'white dark:gray-900',
  foreground: 'gray-900 dark:white',
  muted: 'gray-100 dark:gray-800',
  border: 'gray-200 dark:gray-700',
}
```

### Typography

```typescript
// Font sizes with responsive support
const fontSizes = {
  xs: '12px',   // text-xs
  sm: '14px',   // text-sm
  base: '16px', // text-base
  lg: '18px',   // text-lg
  xl: '20px',   // text-xl
  '2xl': '24px', // text-2xl
  '3xl': '30px', // text-3xl
  '4xl': '36px', // text-4xl
  '5xl': '48px', // text-5xl
}

// Font weights
const fontWeights = {
  normal: 400,   // font-normal
  medium: 500,   // font-medium
  semibold: 600, // font-semibold
  bold: 700,     // font-bold
}
```

### Spacing System

```typescript
// Density-aware spacing
const spacing = {
  compact: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
  },
  medium: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
  },
  large: {
    0: 0,
    1: 8,
    2: 12,
    3: 16,
    4: 20,
    5: 24,
    6: 32,
    8: 40,
  },
}
```

### Shadow System

```typescript
// useShadow hook configurations
const shadows = {
  none: { elevation: 0, shadowOpacity: 0 },
  sm: { elevation: 2, shadowOpacity: 0.05 },
  md: { elevation: 4, shadowOpacity: 0.10 },
  lg: { elevation: 8, shadowOpacity: 0.15 },
  xl: { elevation: 12, shadowOpacity: 0.20 },
  '2xl': { elevation: 24, shadowOpacity: 0.25 },
}
```

## Component Library

### Core Components (Universal)

#### 1. **Text Component**
```tsx
// Basic usage
<Text size="lg" weight="semibold" color="primary">
  Hello World
</Text>

// Responsive sizing
<Text size={{ base: 'sm', md: 'lg' }}>
  Responsive Text
</Text>

// Interactive with animations
<Text onPress={handlePress} copyable animated>
  Press or copy me!
</Text>
```

Features:
- Responsive font sizes
- Copy-to-clipboard functionality
- Press animations
- Platform-specific optimizations

#### 2. **Button Component**
```tsx
// Variants
<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// Responsive sizing
<Button size={{ base: 'sm', md: 'lg' }}>
  Responsive Button
</Button>

// With icons and loading
<Button 
  leftIcon={<Icon name="plus" />}
  isLoading={loading}
  shadow="md"
>
  Add Item
</Button>
```

Features:
- 6 variants (default, destructive, outline, secondary, ghost, link)
- Responsive sizing
- Shadow support via useShadow
- Platform-specific press animations
- Loading states

#### 3. **Input Component**
```tsx
// Basic input with floating label
<Input
  label="Email"
  placeholder="Enter email"
  floatingLabel
  size={{ base: 'md', lg: 'lg' }}
/>

// With validation
<Input
  label="Password"
  error={errors.password}
  success={isValid}
  showCharacterCount
  maxLength={50}
/>
```

Features:
- Floating label animations
- Hover states
- Error shake animation
- Success checkmark
- Character counting
- Density-aware sizing

#### 4. **Select Component**
```tsx
// Basic select
<Select
  options={options}
  value={value}
  onValueChange={setValue}
  placeholder="Choose option"
/>

// Advanced features
<Select
  options={options}
  multiple
  searchable
  grouped={groupedOptions}
  animationType="scale"
/>
```

Features:
- Dropdown animations
- Multi-select support
- Searchable options
- Grouped options
- Platform-specific styling

### Layout Components

#### Stack Components
```tsx
// Vertical stack with responsive gap
<VStack gap={{ base: 2, md: 4 }}>
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</VStack>

// Horizontal stack
<HStack justify="between" align="center">
  <Text>Left</Text>
  <Button>Right</Button>
</HStack>
```

#### Container
```tsx
<Container maxWidth="lg" padded centered>
  {children}
</Container>
```

### Feedback Components

#### Alert
```tsx
<Alert 
  variant="success"
  title="Success!"
  description="Operation completed"
  onClose={handleClose}
  animationType="slideDown"
/>
```

#### Badge
```tsx
<Badge 
  variant="primary"
  size="lg"
  dot
  pulseOnUpdate
>
  New
</Badge>
```

### Healthcare-Specific Blocks

#### Alert Summary
```tsx
<AlertSummary 
  alert={alertData}
  onAcknowledge={handleAck}
  showActions
/>
```

#### Patient Card
```tsx
<PatientCard 
  patient={patientData}
  onPress={handlePress}
/>
```

## Animation System

### Animation Configurations
```typescript
const animationConfig = {
  gentle: {
    duration: { fast: 150, normal: 300, slow: 500 },
    spring: { damping: 20, stiffness: 300 },
  },
  moderate: {
    duration: { fast: 100, normal: 200, slow: 400 },
    spring: { damping: 15, stiffness: 400 },
  },
  energetic: {
    duration: { fast: 80, normal: 150, slow: 300 },
    spring: { damping: 10, stiffness: 500 },
  },
}
```

### Common Animations
- **Press**: Scale down with spring
- **Hover**: Opacity change (web)
- **Error**: Horizontal shake
- **Success**: Scale bounce
- **Entrance**: Fade, slide, or zoom
- **Loading**: Continuous rotation

## Responsive System

### Breakpoints
```typescript
const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}
```

### useResponsive Hook
```tsx
const { isMobile, isTablet, isDesktop } = useResponsive();

// Conditional rendering
{isMobile && <MobileView />}
{isDesktop && <DesktopView />}
```

### Responsive Props
```tsx
// Any component can accept responsive values
<Component
  size={{ base: 'sm', md: 'md', lg: 'lg' }}
  padding={{ base: 2, md: 4, lg: 6 }}
/>
```

## Accessibility

### Guidelines
1. **Color Contrast**: All text meets WCAG AA standards
2. **Touch Targets**: Minimum 44x44px on mobile
3. **Focus Indicators**: Visible focus states on all interactive elements
4. **Screen Readers**: Proper accessibility labels
5. **Reduced Motion**: Respects user preferences

### Implementation
```tsx
<Button
  accessibilityRole="button"
  accessibilityLabel="Create new alert"
  accessibilityHint="Double tap to create an emergency alert"
  accessibilityState={{ disabled: isLoading }}
/>
```

## Performance Optimization

### Best Practices
1. **Lazy Loading**: Components loaded on demand
2. **Memoization**: Heavy computations cached
3. **Animation Performance**: Using native driver
4. **Image Optimization**: Proper sizing and formats
5. **Bundle Size**: Tree-shaking unused components

### Code Splitting
```tsx
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Use with Suspense
<Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</Suspense>
```

## Dark Mode

All components support dark mode automatically through Tailwind classes:

```tsx
// Automatic dark mode support
<View className="bg-white dark:bg-gray-900">
  <Text className="text-gray-900 dark:text-white">
    Adapts to system theme
  </Text>
</View>
```

## Usage Guidelines

### Component Selection
1. **Text**: For all text content
2. **Button**: For primary actions
3. **Input**: For user input
4. **Select**: For choosing from options
5. **Card**: For grouped content
6. **Alert**: For important messages
7. **Badge**: For status indicators

### Styling Best Practices
1. Use Tailwind classes over inline styles
2. Leverage responsive props for adaptive layouts
3. Use semantic color names
4. Apply consistent spacing through gap utilities
5. Implement proper loading and error states

### Animation Guidelines
1. Keep animations under 300ms for responsiveness
2. Use spring animations for natural feel
3. Provide haptic feedback on mobile
4. Respect reduced motion preferences
5. Test on lower-end devices

## Migration Guide

### From Theme to Tailwind
```tsx
// Old (theme-based)
style={{ color: theme.primary }}

// New (Tailwind)
className="text-primary"
```

### Adding Responsive Support
```tsx
// Old (fixed size)
<Component size="md" />

// New (responsive)
<Component size={{ base: 'sm', md: 'md', lg: 'lg' }} />
```

## Contributing

When adding new components:
1. Follow existing component patterns
2. Include TypeScript types
3. Add responsive prop support
4. Implement animations where appropriate
5. Include usage examples
6. Test across platforms
7. Document in this guide