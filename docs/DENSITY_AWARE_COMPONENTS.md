# Density-Aware Component System

## Overview

Our component system supports three density modes: **Compact**, **Medium**, and **Large**. These modes adjust spacing, text sizes, and component dimensions based on user preferences and device capabilities.

## Density Settings

### Compact Mode
- **Use Case**: Small screens, users who prefer denser information
- **Spacing**: 75% of base values
- **Text**: Smaller sizes for more content visibility
- **Components**: Reduced padding and heights

### Medium Mode (Default)
- **Use Case**: Standard phones and tablets
- **Spacing**: 100% of base values
- **Text**: Standard sizes for optimal readability
- **Components**: Balanced padding and heights

### Large Mode
- **Use Case**: Large screens, accessibility needs
- **Spacing**: 125% of base values  
- **Text**: Larger sizes for better readability
- **Components**: Generous padding and heights

## Implementation

### 1. Using the Spacing Store

```tsx
import { useSpacing } from '@/lib/stores/spacing-store';

function MyComponent() {
  const { density, spacing, componentSpacing } = useSpacing();
  
  // Access density-aware values
  const padding = spacing[4]; // Returns 12, 16, or 20 based on density
}
```

### 2. Density-Aware Tailwind Classes

```tsx
import { useDensityClasses, getGapClass } from '@/lib/core/utils/density-classes';

function MyComponent() {
  const densityClasses = useDensityClasses();
  
  return (
    <View className={densityClasses.p('md')}> // Returns p-3, p-4, or p-6
      <Text className={densityClasses.text('lg')}> // Returns text-base, text-lg, or text-xl
        Content
      </Text>
    </View>
  );
}
```

### 3. Components with Built-in Density Support

#### Stack Components
```tsx
// Gap values automatically adjust based on density
<VStack gap={4}> // Renders as gap-2, gap-3, or gap-4
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</VStack>
```

#### Button Component
```tsx
// Button sizes adjust automatically
<Button size="default"> // Height and padding adapt to density
  Click Me
</Button>
```

#### Text Component
```tsx
// Text sizes scale with density
<Text size="base"> // Renders as text-sm, text-base, or text-lg
  Adaptive text
</Text>
```

#### Card Component
```tsx
// Card padding adjusts to density
<Card> // Padding is p-3, p-4, or p-6
  <CardContent>Content</CardContent>
</Card>
```

## Density Mappings

### Spacing Scale
| Base Value | Compact | Medium | Large |
|------------|---------|---------|--------|
| 4 (1rem)   | 3       | 4       | 5      |
| 8 (2rem)   | 6       | 8       | 10     |
| 16 (4rem)  | 12      | 16      | 20     |
| 24 (6rem)  | 18      | 24      | 30     |

### Text Sizes
| Size | Compact | Medium | Large |
|------|---------|---------|--------|
| xs   | 10px    | 12px    | 14px   |
| sm   | 12px    | 14px    | 16px   |
| base | 14px    | 16px    | 18px   |
| lg   | 16px    | 18px    | 20px   |
| xl   | 18px    | 20px    | 24px   |

### Component Heights
| Component | Size | Compact | Medium | Large |
|-----------|------|---------|---------|--------|
| Button    | sm   | 32px    | 36px    | 44px   |
| Button    | md   | 36px    | 44px    | 52px   |
| Button    | lg   | 40px    | 52px    | 60px   |
| Input     | md   | 36px    | 44px    | 52px   |

## Best Practices

1. **Always use density-aware values** for spacing and sizing
2. **Test all three density modes** during development
3. **Consider touch targets** - maintain minimum 44px touch areas
4. **Use semantic sizing** (sm, md, lg) instead of fixed pixel values
5. **Leverage the spacing store** for consistent density handling

## Migration Guide

### Old Approach
```tsx
<Box p={4} flex={1}>
  <VStack spacing={3}>
    <Text size="base">Content</Text>
  </VStack>
</Box>
```

### New Density-Aware Approach
```tsx
<Box className={`flex-1 ${densityClasses.p('md')}`}>
  <VStack gap={3}> // Gap automatically adjusts
    <Text size="base">Content</Text> // Size automatically adjusts
  </VStack>
</Box>
```

## User Settings

Users can change density through:
- Settings screen with SpacingDensitySelector component
- Auto-detection based on screen size
- Persistence across app sessions

## Platform Considerations

- **iOS**: Respects Dynamic Type settings
- **Android**: Compatible with display size preferences
- **Web**: Responsive to viewport and zoom levels