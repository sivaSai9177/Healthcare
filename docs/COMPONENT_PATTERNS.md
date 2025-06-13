# Component Patterns Guide

## Architecture Overview

```
Universal Components (Tailwind + Animations)
         ↓
Blocks (Composed Features)
         ↓
Screens (Business Logic)
```

## Creating a Universal Component

### 1. Basic Structure

```typescript
// components/universal/MyComponent.tsx
import React from 'react';
import { View, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { cn } from '@/lib/utils';
import { useAnimation } from '@/lib/ui/animations/hooks';
import { haptic } from '@/lib/ui/haptics';

export interface MyComponentProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
  onPress?: () => void;
}

export const MyComponent = React.forwardRef<View, MyComponentProps>(({
  children,
  variant = 'primary',
  size = 'md',
  className,
  animated = true,
  onPress,
  ...props
}, ref) => {
  // Animation setup
  const { animatedStyle, trigger } = useAnimation('scaleIn', {
    duration: 'fast',
  });
  
  // Variant styles using Tailwind
  const variants = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
  };
  
  const sizes = {
    sm: 'p-2 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg',
  };
  
  // Handle interactions
  const handlePress = () => {
    if (onPress) {
      haptic('light');
      trigger();
      onPress();
    }
  };
  
  const Component = onPress ? Pressable : View;
  const AnimatedComponent = animated ? Animated.createAnimatedComponent(Component) : Component;
  
  return (
    <AnimatedComponent
      ref={ref}
      style={animated ? animatedStyle : undefined}
      className={cn(
        // Base styles
        'rounded-lg',
        // Variant styles
        variants[variant],
        // Size styles
        sizes[size],
        // Interactive states (Tailwind)
        onPress && 'active:scale-95 transition-transform',
        // Custom className
        className
      )}
      onPress={onPress ? handlePress : undefined}
      {...props}
    >
      {children}
    </AnimatedComponent>
  );
});

MyComponent.displayName = 'MyComponent';
```

### 2. Export Pattern

```typescript
// components/universal/index.ts
export * from './MyComponent';
```

## Creating a Block Component

Blocks compose universal components into features:

```typescript
// components/blocks/user/UserProfileBlock.tsx
import React from 'react';
import {
  Card,
  VStack,
  HStack,
  Avatar,
  Text,
  Button,
  Badge,
} from '@/components/universal';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';

export const UserProfileBlock = () => {
  const { user } = useAuth();
  const { data: profile } = api.user.getProfile.useQuery();
  
  return (
    <Card className="p-6">
      <VStack className="space-y-4">
        <HStack className="items-center space-x-4">
          <Avatar
            source={{ uri: profile?.avatar }}
            size="lg"
            className="ring-2 ring-primary"
          />
          <VStack className="flex-1 space-y-1">
            <Text className="text-lg font-semibold">
              {profile?.name}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {profile?.email}
            </Text>
          </VStack>
          <Badge variant="secondary">
            {profile?.role}
          </Badge>
        </HStack>
        
        <Button
          variant="primary"
          size="md"
          onPress={() => router.push('/profile/edit')}
          className="w-full"
        >
          Edit Profile
        </Button>
      </VStack>
    </Card>
  );
};
```

## Using Blocks in Screens

```typescript
// app/(main)/profile.tsx
import React from 'react';
import { ScrollView } from 'react-native';
import {
  Container,
  VStack,
} from '@/components/universal';
import {
  UserProfileBlock,
  UserSettingsBlock,
  UserActivityBlock,
} from '@/components/blocks/user';

export default function ProfileScreen() {
  return (
    <Container>
      <ScrollView className="flex-1">
        <VStack className="space-y-6 py-6">
          <UserProfileBlock />
          <UserSettingsBlock />
          <UserActivityBlock />
        </VStack>
      </ScrollView>
    </Container>
  );
}
```

## Animation Patterns

### 1. Entry Animations

```typescript
const ListItem = ({ item, index }) => {
  const { animatedStyle } = useEntranceAnimation({
    type: 'slide',
    delay: index * 50, // Stagger effect
  });
  
  return (
    <Animated.View style={animatedStyle}>
      <Card className="p-4">
        <Text>{item.title}</Text>
      </Card>
    </Animated.View>
  );
};
```

### 2. Interactive Animations

```typescript
const InteractiveCard = ({ onPress, children }) => {
  const { animatedStyle, trigger } = useAnimation('scale', {
    duration: 'fast',
  });
  
  return (
    <AnimatedPressable
      style={animatedStyle}
      onPress={() => {
        haptic('light');
        trigger();
        onPress();
      }}
      className="bg-card p-4 rounded-lg active:scale-95"
    >
      {children}
    </AnimatedPressable>
  );
};
```

### 3. Gesture Animations

```typescript
const SwipeableCard = ({ onSwipe, children }) => {
  const translateX = useSharedValue(0);
  
  const gesture = Gesture.Pan()
    .onStart(() => {
      haptic('light');
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) > 100) {
        haptic('medium');
        onSwipe();
      }
      translateX.value = withSpring(0);
    });
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};
```

## Haptic Feedback Patterns

```typescript
// Different haptic patterns for different interactions
const interactions = {
  // Navigation
  onNavigate: () => {
    haptic('selection');
    router.push('/path');
  },
  
  // Form submission
  onSubmit: async () => {
    haptic('light');
    try {
      await submitForm();
      haptic('success');
    } catch (error) {
      haptic('error');
    }
  },
  
  // Toggle states
  onToggle: (value) => {
    haptic('light');
    setValue(value);
  },
  
  // Destructive actions
  onDelete: () => {
    haptic('heavy');
    showDeleteConfirmation();
  },
};
```

## Responsive Design Patterns

### 1. Using Tailwind Breakpoints

```typescript
<Card className="p-4 sm:p-6 lg:p-8">
  <HStack className="flex-col sm:flex-row gap-4">
    <Box className="w-full sm:w-1/2 lg:w-1/3">
      {/* Content */}
    </Box>
  </HStack>
</Card>
```

### 2. Using Responsive Hook

```typescript
const MyComponent = () => {
  const { isSmall, isMedium, isLarge } = useResponsive();
  
  return (
    <VStack className={cn(
      'space-y-4',
      isLarge && 'flex-row space-y-0 space-x-6'
    )}>
      {/* Adaptive layout */}
    </VStack>
  );
};
```

## Theme Integration

```typescript
const ThemedComponent = () => {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  
  return (
    <Card className={cn(
      // Base styles
      'p-4 rounded-lg',
      // Theme-aware styles using Tailwind
      'bg-card text-card-foreground',
      // Dark mode handled by Tailwind/NativeWind
      'dark:bg-card-dark dark:text-card-foreground-dark'
    )}>
      {/* Content */}
    </Card>
  );
};
```

## Best Practices

### 1. Component Composition

```typescript
// ❌ Don't create mega-components
const UserDashboard = () => {
  // 500 lines of code...
};

// ✅ Do compose from smaller pieces
const UserDashboard = () => (
  <VStack className="space-y-6">
    <UserHeaderBlock />
    <UserStatsBlock />
    <UserActivityBlock />
    <UserSettingsBlock />
  </VStack>
);
```

### 2. Styling Approach

```typescript
// ❌ Don't mix styling systems
<Box style={{ padding: spacing.md }} className="p-4">

// ✅ Do use Tailwind consistently
<Box className="p-4">
```

### 3. Animation Usage

```typescript
// ❌ Don't animate everything
<AnimatedView style={animatedStyle}>
  <AnimatedText style={textAnimation}>
    <AnimatedIcon style={iconAnimation} />
  </AnimatedText>
</AnimatedView>

// ✅ Do animate purposefully
<AnimatedCard onPress={handlePress}>
  <Text>Static content</Text>
  <Icon name="chevron" />
</AnimatedCard>
```

### 4. Platform Considerations

```typescript
const PlatformAwareComponent = () => {
  return (
    <Card className={cn(
      // Base styles
      'p-4 rounded-lg',
      // Platform-specific adjustments
      'ios:shadow-sm android:elevation-2 web:hover:shadow-md'
    )}>
      {Platform.select({
        ios: <IOSSpecificFeature />,
        android: <AndroidSpecificFeature />,
        web: <WebSpecificFeature />,
      })}
    </Card>
  );
};
```

## Testing Patterns

```typescript
// Component test example
describe('MyComponent', () => {
  it('renders with correct styles', () => {
    const { getByTestId } = render(
      <MyComponent variant="primary" size="lg" />
    );
    
    const component = getByTestId('my-component');
    expect(component).toHaveClass('bg-primary', 'p-6');
  });
  
  it('triggers haptic feedback on press', () => {
    const mockHaptic = jest.spyOn(haptics, 'light');
    const { getByTestId } = render(
      <MyComponent onPress={jest.fn()} />
    );
    
    fireEvent.press(getByTestId('my-component'));
    expect(mockHaptic).toHaveBeenCalled();
  });
});
```