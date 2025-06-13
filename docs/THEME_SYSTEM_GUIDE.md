# Theme System Guide

## Overview

Our app uses a comprehensive theme system that supports:
- Multiple theme presets (Default, Bubblegum, Ocean, Forest, Sunset, Healthcare)
- Light and dark modes for each theme
- Semantic color tokens
- Dynamic theme switching
- Persistence across sessions

## Using Themes in Components

### 1. Accessing Theme Colors

```tsx
import { useTheme } from '@/lib/theme/provider';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.foreground }}>
        Hello World
      </Text>
    </View>
  );
}
```

### 2. Semantic Colors

Each theme provides semantic colors for consistent UI:

- **Primary/Secondary**: Main brand colors
- **Destructive**: Errors, critical states, deletions
- **Success**: Positive states, confirmations
- **Warning**: Cautions, warnings (if available in theme)
- **Muted**: Disabled states, secondary information
- **Accent**: Highlights, interactive elements

### 3. Healthcare-Specific Usage

For healthcare contexts, use semantic colors:

```tsx
// Vital sign status
const statusColors = {
  critical: theme.destructive,    // Red - Critical/Emergency
  warning: theme.warning || theme.accent,  // Amber/Yellow - Warning
  normal: theme.success,          // Green - Normal/Good
  unknown: theme.mutedForeground, // Gray - No data
};

// Alert levels
const alertColors = {
  emergency: theme.destructive,
  urgent: theme.warning || theme.accent,
  standard: theme.primary,
  low: theme.muted,
};
```

### 4. Theme-Aware Components

Components should adapt to the current theme:

```tsx
// Bad - Hardcoded colors
<Card style={{ backgroundColor: '#ffffff' }}>

// Good - Theme-aware
<Card style={{ backgroundColor: theme.card }}>

// Better - Using Tailwind with theme
<Card className="bg-card">
```

## Available Themes

### Default Theme
- Clean, professional appearance
- High contrast for readability
- Suitable for general use

### Bubblegum Theme
- Playful pink and blue colors
- Fun shadow effects
- Great for consumer apps

### Ocean Theme
- Cool blues and teals
- Calming, professional
- Good for productivity apps

### Forest Theme
- Natural greens and earth tones
- Easy on the eyes
- Perfect for wellness apps

### Sunset Theme
- Warm oranges and reds
- Energetic feel
- Ideal for creative apps

### Healthcare Theme (Optional)
- Professional medical colors
- Clear status indicators
- Optimized for medical contexts

## Theme Store Usage

### Switching Themes

```tsx
import { useThemeActions } from '@/lib/stores/theme-store';

function ThemeSwitcher() {
  const { setThemeId } = useThemeActions();
  
  return (
    <Button onPress={() => setThemeId('bubblegum')}>
      Switch to Bubblegum
    </Button>
  );
}
```

### Toggle Dark Mode

```tsx
const { toggleColorScheme } = useThemeActions();

<Button onPress={toggleColorScheme}>
  Toggle Dark Mode
</Button>
```

### Check Current Theme

```tsx
import { useThemeId, useColorScheme } from '@/lib/stores/theme-store';

function ThemeInfo() {
  const themeId = useThemeId();
  const colorScheme = useColorScheme();
  
  return (
    <Text>Current: {themeId} ({colorScheme})</Text>
  );
}
```

## Tailwind Integration

Our Tailwind classes automatically use theme colors:

```tsx
// These classes use colors from the current theme
<View className="bg-primary text-primary-foreground">
<View className="bg-destructive text-destructive-foreground">
<View className="bg-success text-success-foreground">
<View className="border-border bg-card">
```

## Best Practices

1. **Always use semantic colors** - Don't hardcode hex values
2. **Test in both light and dark modes** - Ensure good contrast
3. **Use theme colors for all UI elements** - Consistency is key
4. **Provide fallbacks** - Some themes may not have all colors (e.g., warning)
5. **Consider accessibility** - Ensure sufficient contrast ratios

## Adding Custom Themes

To add a new theme:

1. Create a theme definition:
```tsx
export const myTheme: ThemeDefinition = {
  id: 'mytheme',
  name: 'My Theme',
  description: 'Description of theme',
  colors: {
    light: { /* color definitions */ },
    dark: { /* color definitions */ },
  },
};
```

2. Add to theme registry:
```tsx
// In registry.tsx
export const themes = {
  // ... existing themes
  mytheme: myTheme,
};
```

## Migration from Old System

### Old Approach (healthcareColors)
```tsx
// Don't do this
const statusColors = {
  normal: healthcareColors.success,
  warning: healthcareColors.warning,
  critical: healthcareColors.emergency,
};
```

### New Approach (Theme System)
```tsx
// Do this instead
const theme = useTheme();
const statusColors = {
  normal: theme.success,
  warning: theme.warning || theme.accent,
  critical: theme.destructive,
};
```

This approach ensures colors adapt to the user's chosen theme while maintaining semantic meaning.