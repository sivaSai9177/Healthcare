# Design System Module

A comprehensive design system built with NativeWind (Tailwind CSS for React Native), providing consistent, accessible, and responsive UI components.

## Overview

The Design System module provides a complete set of UI components, utilities, and patterns for building consistent user interfaces across web and mobile platforms. Currently undergoing migration from styled-components to NativeWind.

### Migration Status: 40% Complete
- ✅ **Fully Migrated**: 5 components
- 🔄 **Partially Migrated**: 12 components  
- ❌ **Not Migrated**: 55+ components

### Key Features
- 📱 **Cross-Platform**: iOS, Android, and Web support
- 🎨 **NativeWind**: Tailwind CSS for React Native
- 📐 **Responsive**: Density-aware spacing system
- ♿ **Accessible**: WCAG 2.1 AA compliant
- 🌗 **Theme Support**: Light/Dark mode (in progress)
- 🎯 **Type-Safe**: Full TypeScript support
- ⚡ **Performance**: Optimized for 60fps
- 🧩 **Modular**: Tree-shakeable components

## Architecture

```
design-system/
├── components/         # UI components
│   ├── universal/     # Cross-platform components
│   │   ├── layout/   # Box, Stack, Grid
│   │   ├── display/ # Text, Badge, Icon
│   │   ├── input/   # Input, Button, Select
│   │   └── feedback/# Spinner, Toast, Alert
│   ├── blocks/       # Composite components
│   └── patterns/     # Common UI patterns
├── hooks/            # UI hooks
│   ├── useResponsive.ts
│   ├── useSpacing.ts
│   └── useAnimation.ts
├── utils/            # Utilities
│   ├── spacing.ts
│   ├── colors.ts
│   └── shadows.ts
└── types/            # TypeScript types
```

## Component Reference

### Layout Components

#### Box
```tsx
import { Box } from '@/components/universal/layout/Box';

<Box className="p-4 bg-white rounded-lg shadow-md">
  <Text>Content</Text>
</Box>
```

#### Stack
```tsx
import { VStack, HStack } from '@/components/universal/layout/Stack';

// Vertical Stack
<VStack gap={4} className="p-4">
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</VStack>

// Horizontal Stack
<HStack gap={2} align="center">
  <Icon name="star" />
  <Text>Rating</Text>
</HStack>
```

#### Card
```tsx
import { Card } from '@/components/universal/layout/Card';

<Card shadow="lg" className="p-6">
  <Card.Header>
    <Text variant="h3">Title</Text>
  </Card.Header>
  <Card.Body>
    <Text>Card content</Text>
  </Card.Body>
</Card>
```

### Input Components

#### Button
```tsx
import { Button } from '@/components/universal/buttons/Button';

<Button 
  variant="primary"
  size="md"
  density="medium"
  shadow="md"
  onPress={handlePress}
>
  Click Me
</Button>

// Button variants
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
```

#### Input
```tsx
import { Input } from '@/components/universal/form/Input';

<Input
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  leftIcon="mail"
/>
```

#### Select
```tsx
import { Select } from '@/components/universal/form/Select';

<Select
  label="Role"
  value={role}
  onValueChange={setRole}
  options={[
    { label: 'Doctor', value: 'doctor' },
    { label: 'Nurse', value: 'nurse' },
  ]}
/>
```

### Display Components

#### Text
```tsx
import { Text } from '@/components/universal/display/Text';

// Typography variants
<Text variant="h1">Heading 1</Text>
<Text variant="h2">Heading 2</Text>
<Text variant="body">Body text</Text>
<Text variant="caption" color="gray">Caption</Text>
```

#### Badge
```tsx
import { Badge } from '@/components/universal/display/Badge';

<Badge variant="success">Active</Badge>
<Badge variant="warning" size="sm">Pending</Badge>
<Badge variant="danger" dot>Alert</Badge>
```

#### Icon
```tsx
import { Icon } from '@/components/universal/display/Icon';

<Icon 
  name="heart" 
  size={24} 
  color="red"
  onPress={handleLike}
/>
```

### Feedback Components

#### Toast
```tsx
import { showToast } from '@/components/universal/feedback/Toast';

showToast({
  type: 'success',
  title: 'Success!',
  message: 'Operation completed',
  duration: 3000,
});
```

#### Alert
```tsx
import { Alert } from '@/components/universal/feedback/Alert';

<Alert 
  type="warning"
  title="Warning"
  message="This action cannot be undone"
  onClose={handleClose}
/>
```

#### Spinner
```tsx
import { Spinner } from '@/components/universal/feedback/Spinner';

<Spinner size="lg" color="primary" />
```

## Responsive System

### Density Modes
The design system automatically adjusts spacing based on screen size:

```ts
// Density breakpoints
const densityBreakpoints = {
  compact: { max: 360 },   // 0.75x spacing
  medium: { min: 360, max: 768 }, // 1.0x spacing
  large: { min: 768 },     // 1.25x spacing
};
```

### Using Responsive Spacing
```tsx
import { useSpacing } from '@/hooks/useSpacing';

function MyComponent() {
  const spacing = useSpacing();
  
  return (
    <View style={{
      padding: spacing(4), // 16px on medium, 12px on compact
      margin: spacing(2),  // 8px on medium, 6px on compact
    }}>
      <Text>Responsive content</Text>
    </View>
  );
}
```

### Breakpoint Utilities
```tsx
import { useBreakpoint } from '@/hooks/useBreakpoint';

function ResponsiveLayout() {
  const breakpoint = useBreakpoint();
  
  return (
    <View className={
      breakpoint.md ? 'flex-row' : 'flex-col'
    }>
      {/* Responsive layout */}
    </View>
  );
}
```

## Theme System

### Color Palette
```ts
const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    900: '#1e3a8a',
  },
  gray: {
    50: '#f9fafb',
    500: '#6b7280',
    900: '#111827',
  },
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};
```

### Shadow System
```ts
const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
};

// Platform-specific implementation
const platformShadows = {
  ios: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
  },
  android: {
    sm: { elevation: 2 },
  },
};
```

## Animation System

### Built-in Animations
```tsx
import { FadeIn, SlideIn, ScaleIn } from '@/components/universal/animations';

<FadeIn duration={300}>
  <Card>Fading in</Card>
</FadeIn>

<SlideIn from="bottom" delay={100}>
  <Alert>Sliding in</Alert>
</SlideIn>
```

### Custom Animations
```tsx
import { useAnimatedValue } from '@/hooks/useAnimation';

function AnimatedComponent() {
  const { value, animate } = useAnimatedValue(0);
  
  const handlePress = () => {
    animate(1, { duration: 500, easing: 'ease-out' });
  };
  
  return (
    <Animated.View style={{ opacity: value }}>
      <Button onPress={handlePress}>Animate</Button>
    </Animated.View>
  );
}
```

## Accessibility

### Built-in Support
All components include:
- Proper accessibility roles
- Screen reader labels
- Keyboard navigation
- Focus management

```tsx
<Button
  accessible={true}
  accessibilityLabel="Submit form"
  accessibilityHint="Double tap to submit the form"
  accessibilityRole="button"
>
  Submit
</Button>
```

### Focus Management
```tsx
import { useFocusManager } from '@/hooks/useFocusManager';

function Form() {
  const { focusNext, focusPrevious } = useFocusManager();
  
  return (
    <>
      <Input 
        onSubmitEditing={focusNext}
        returnKeyType="next"
      />
      <Input 
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />
    </>
  );
}
```

## Migration Guide

### From Styled Components to NativeWind

#### Old Pattern (Styled Components)
```tsx
const StyledButton = styled.TouchableOpacity`
  background-color: ${props => props.theme.colors.primary};
  padding: ${props => props.theme.spacing.md}px;
  border-radius: ${props => props.theme.radii.md}px;
`;
```

#### New Pattern (NativeWind)
```tsx
<TouchableOpacity 
  className="bg-primary-500 p-4 rounded-md"
  activeOpacity={0.8}
>
  <Text className="text-white">Button</Text>
</TouchableOpacity>
```

### Component Migration Checklist
- [ ] Remove styled-components imports
- [ ] Convert styles to Tailwind classes
- [ ] Add platform-specific shadows
- [ ] Update TypeScript props
- [ ] Add density support
- [ ] Test on all platforms
- [ ] Update component tests
- [ ] Document changes

## Performance Optimization

### Bundle Size
- Current: 2.1MB
- Target: <2MB
- Tree-shaking enabled
- Dynamic imports for heavy components

### Rendering Performance
- Memoization for expensive components
- Virtualized lists for large datasets
- Lazy loading for images
- Optimized re-renders

```tsx
// Optimized component example
import { memo } from 'react';

export const ExpensiveComponent = memo(({ data }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});
```

## Testing

### Component Testing
```tsx
import { render } from '@testing-library/react-native';
import { Button } from '@/components/universal/buttons/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    const { getByText } = render(
      <Button>Click Me</Button>
    );
    expect(getByText('Click Me')).toBeTruthy();
  });
});
```

### Visual Regression Testing
```bash
# Run visual tests
bun run test:visual

# Update snapshots
bun run test:visual:update
```

## Common Patterns

### Form Layout
```tsx
<VStack gap={4} className="p-4">
  <Input label="Name" />
  <Input label="Email" type="email" />
  <Select label="Role" options={roles} />
  <HStack gap={2} className="mt-4">
    <Button variant="outline" flex>Cancel</Button>
    <Button variant="primary" flex>Submit</Button>
  </HStack>
</VStack>
```

### List Item
```tsx
<TouchableOpacity className="flex-row items-center p-4 border-b border-gray-200">
  <Avatar source={user.avatar} size="md" />
  <VStack className="flex-1 ml-3">
    <Text variant="body" weight="semibold">{user.name}</Text>
    <Text variant="caption" color="gray">{user.role}</Text>
  </VStack>
  <Icon name="chevron-right" color="gray" />
</TouchableOpacity>
```

## Future Enhancements

1. **Complete Migration**: Finish NativeWind migration
2. **Storybook**: Interactive component documentation
3. **Design Tokens**: CSS variables for theming
4. **Motion Design**: Advanced animation library
5. **Component Library**: Publish as NPM package

---

For more details, see:
- [Component Gallery](../../guides/component-gallery.md)
- [Migration Guide](../../guides/design-system-migration.md)
- [Accessibility Guide](../../guides/accessibility.md)