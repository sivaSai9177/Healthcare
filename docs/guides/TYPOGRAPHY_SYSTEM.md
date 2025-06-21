# Typography System Guide

## Overview

The typography system provides a comprehensive, density-aware text styling solution that adapts to different screen sizes and respects system accessibility settings.

## Key Features

- **Density-aware sizing**: Typography scales based on spacing density (compact, medium, large)
- **Typography presets**: Pre-configured text styles for common use cases
- **Responsive typography**: Automatic scaling based on screen size
- **System font scaling**: Respects user's accessibility settings
- **Platform-optimized**: Uses appropriate system fonts for each platform
- **Performance optimized**: Memoized styles and conditional animations

## Typography Presets

### Display Styles
```tsx
import { Display1, Display2 } from '@/components/universal/typography';

// Large marketing headings
<Display1>Welcome to Our App</Display1>
<Display2>Powerful Features</Display2>
```

### Heading Hierarchy
```tsx
import { Heading1, Heading2, Heading3 } from '@/components/universal/typography';

<Heading1>Page Title</Heading1>
<Heading2>Section Header</Heading2>
<Heading3>Subsection</Heading3>
```

### Body Text
```tsx
import { BodyLarge, Body, BodySmall } from '@/components/universal/typography';

<BodyLarge>Important paragraph text</BodyLarge>
<Body>Regular content</Body>
<BodySmall>Fine print</BodySmall>
```

### UI Components
```tsx
import { Label, Caption, Overline } from '@/components/universal/typography';

<Label>Form Field Label</Label>
<Caption>Helper text or descriptions</Caption>
<Overline>SECTION LABEL</Overline>
```

## Using the Text Component

### Basic Usage
```tsx
import { Text } from '@/components/universal/typography';

// Size and weight
<Text size="lg" weight="semibold">Large Semibold Text</Text>

// With preset
<Text preset="h2">Section Title</Text>

// Responsive sizing
<Text size={{ xs: 'sm', md: 'base', lg: 'lg' }}>
  Responsive Text
</Text>
```

### Typography Hooks

#### useTypography
Access typography tokens and utilities:

```tsx
import { useTypography } from '@/hooks/useTypography';

function MyComponent() {
  const typography = useTypography();
  
  // Access font sizes
  const largeSize = typography.sizes.lg; // e.g., 18
  
  // Get preset styles
  const headingStyle = typography.getPresetStyle('h1');
  
  // Calculate line height
  const lineHeight = typography.getLineHeight(16, 'relaxed');
}
```

#### useResponsiveTypography
Handle responsive text sizing:

```tsx
import { useResponsiveTypography } from '@/hooks/useTypography';

function ResponsiveText() {
  const { getResponsiveSize, getFluidSize } = useResponsiveTypography();
  
  // Different sizes for different screens
  const fontSize = getResponsiveSize('sm', 'base', 'lg');
  
  // Fluid scaling between sizes
  const fluidSize = getFluidSize('base', '2xl');
}
```

#### useSystemFontScale
Respect system accessibility settings:

```tsx
import { useSystemFontScale } from '@/hooks/useTypography';

function AccessibleText() {
  const { fontScale, scaleFont } = useSystemFontScale();
  
  // Scale a specific size
  const scaledSize = scaleFont(16); // Adjusts based on system settings
}
```

## Text Truncation

### Expandable Truncated Text
```tsx
import { TruncatedText } from '@/components/universal/typography';

<TruncatedText 
  lines={3}
  expandable
  showMoreText="Read more"
  showLessText="Show less"
>
  Long content that will be truncated after 3 lines...
</TruncatedText>
```

### Single Line Ellipsis
```tsx
import { EllipsisText } from '@/components/universal/typography';

<EllipsisText>
  This text will be truncated with ellipsis if it exceeds one line
</EllipsisText>
```

### Multi-line Clamping
```tsx
import { ClampedText } from '@/components/universal/typography';

<ClampedText lines={2}>
  This text will be clamped to 2 lines without expand/collapse
</ClampedText>
```

## Platform Considerations

### Font Families
The system automatically selects appropriate fonts:

- **iOS**: SF Pro Display/Text, Georgia (serif), Menlo (mono)
- **Android**: System sans-serif, serif, monospace
- **Web**: System font stack with fallbacks

### Font Weights
Weights are optimized for each platform:

```tsx
// Automatically uses platform-appropriate weight values
<Text weight="semibold">Semibold text</Text>
```

## Best Practices

1. **Use presets for consistency**
   ```tsx
   // ✅ Good
   <Heading2>Section Title</Heading2>
   
   // ❌ Avoid
   <Text size="2xl" weight="semibold">Section Title</Text>
   ```

2. **Respect system scaling**
   ```tsx
   // ✅ Good - respects accessibility by default
   <Text>Accessible text</Text>
   
   // Only disable when absolutely necessary
   <Text respectSystemScale={false}>Fixed size text</Text>
   ```

3. **Use semantic components**
   ```tsx
   // ✅ Good
   <Label>Email Address</Label>
   <Caption>We'll never share your email</Caption>
   
   // ❌ Avoid
   <Text size="sm" weight="medium">Email Address</Text>
   <Text size="xs" color="muted">We'll never share your email</Text>
   ```

4. **Leverage responsive typography**
   ```tsx
   // ✅ Good
   <Heading1 size={{ xs: '2xl', md: '3xl', lg: '4xl' }}>
     Responsive Heading
   </Heading1>
   ```

## Migration from Legacy Text

If you're migrating from the old text system:

1. Replace font size numbers with size tokens:
   ```tsx
   // Before
   <Text style={{ fontSize: 16 }}>Text</Text>
   
   // After
   <Text size="base">Text</Text>
   ```

2. Use presets instead of manual styling:
   ```tsx
   // Before
   <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Title</Text>
   
   // After
   <Heading2>Title</Heading2>
   ```

3. Update color props:
   ```tsx
   // Before
   <Text colorTheme="primary">Text</Text>
   
   // After
   <Text color="primary">Text</Text>
   ```

## Performance Tips

1. **Use presets**: Pre-configured styles are memoized
2. **Avoid inline styles**: Use className and props instead
3. **Disable animations when not needed**: `animated={false}`
4. **Use TruncatedText sparingly**: It requires layout measurements

## Accessibility

The typography system is designed with accessibility in mind:

- Respects system font scaling by default
- Provides sufficient contrast ratios
- Supports screen readers
- Allows text selection on all platforms

## Troubleshooting

### Text not scaling with density
Ensure you're using the Text component from `@/components/universal/typography`, not React Native's Text.

### Custom fonts not working
Platform-specific fonts should be configured in the app's native code and referenced in the typography tokens.

### Performance issues with many text elements
- Disable animations for lists: `animated={false}`
- Use `TruncatedText` only when necessary
- Consider virtualization for long lists