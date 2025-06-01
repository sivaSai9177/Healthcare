# Bubblegum Theme Implementation

## Overview
The Bubblegum theme is a playful, vibrant color scheme featuring various shades of pink, from soft pastels to bright bubblegum pink, with turquoise accents for contrast.

## Color Palette

### Light Mode Colors (HSL)
- **Background**: `350 100% 99%` (#fff0f7 - Lavender Blush)
- **Foreground**: `327 30% 20%` (Dark pink for text)
- **Card**: `346 85% 95%` (#fde2e9 - Piggy Pink)
- **Primary**: `346 100% 88%` (#ffc1cc - Bubblegum Pink)
- **Secondary**: `343 91% 85%` (#fbbad8 - Cotton Candy)
- **Accent**: `177 70% 70%` (#81d3cc - Turquoise)
- **Muted**: `346 70% 92%` (Soft pink)
- **Destructive**: `348 83% 47%` (Deep pink)
- **Border**: `346 60% 90%` (Light pink)
- **Ring**: `346 100% 88%` (Bubblegum Pink)

### Dark Mode Colors (HSL)
- **Background**: `327 20% 10%` (Deep purple-pink)
- **Foreground**: `346 80% 90%` (Light pink text)
- **Card**: `327 25% 15%` (Darker card background)
- **Primary**: `328 100% 71%` (#ff48a5 - Bright bubblegum pink)
- **Secondary**: `309 60% 55%` (#d656b4 - Purple-pink)
- **Accent**: `177 90% 60%` (#5fe6df - Bright turquoise)
- **Muted**: `327 20% 25%` (Muted dark pink)
- **Destructive**: `348 100% 50%` (Bright red-pink)
- **Border**: `327 30% 25%` (Dark pink border)
- **Ring**: `328 100% 71%` (Bright bubblegum pink)

## Hex Color Reference

### Primary Bubblegum Colors
- `#ffc1cc` - Classic Bubblegum Pink (Light mode primary)
- `#ff48a5` - Bright Bubblegum Pink (Dark mode primary)
- `#fff0f7` - Lavender Blush (Light background)
- `#fde2e9` - Piggy Pink (Light cards)
- `#fbbad8` - Cotton Candy (Secondary)
- `#d656b4` - Purple-pink (Dark secondary)

### Accent Colors
- `#81d3cc` - Soft Turquoise (Light mode accent)
- `#5fe6df` - Bright Turquoise (Dark mode accent)

### Dark Mode Backgrounds
- `#2a1620` - Deep purple-pink background
- `#3d2330` - Card background

## Implementation Details

### 1. Global CSS (`app/global.css`)
The theme is implemented using CSS custom properties (CSS variables) in HSL format, which provides better color manipulation and consistency with shadcn/ui patterns.

### 2. Tailwind Configuration (`tailwind.config.ts`)
The Tailwind config references these CSS variables, allowing you to use color classes like:
- `bg-primary` for bubblegum pink backgrounds
- `text-foreground` for properly contrasted text
- `border-accent` for turquoise accent borders

### 3. Platform-Specific Colors (`constants/Colors.ts`)
Updated with hex values for native components that don't use Tailwind:
- Light mode tint: `#ffc1cc`
- Dark mode tint: `#ff48a5`
- Icon and tab colors matching the theme

### 4. App Configuration (`app.json`)
- Android adaptive icon background: `#ffc1cc`
- Splash screen background: `#fff0f7`

## Usage Examples

### Button Component
```tsx
<Button variant="default">
  Bubblegum Button
</Button>
```
This will render with the bubblegum pink background and appropriate foreground color.

### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Bubblegum Card</CardTitle>
  </CardHeader>
</Card>
```
Cards will have the soft pink background in light mode and deep purple-pink in dark mode.

### Custom Styling
You can use the theme colors in your custom components:
```tsx
<View className="bg-primary rounded-lg p-4">
  <Text className="text-primary-foreground">
    Bubblegum styled content
  </Text>
</View>
```

## Theme Switching
The theme supports automatic switching between light and dark modes based on the device settings. The `userInterfaceStyle: "automatic"` in `app.json` enables this feature.

## Accessibility
The color contrast ratios have been carefully chosen to ensure readability:
- Light mode uses dark pink text on light pink backgrounds
- Dark mode uses light pink text on deep purple-pink backgrounds
- The turquoise accent provides good contrast for interactive elements

## Customization
To further customize the theme:
1. Modify the HSL values in `app/global.css`
2. Update hex values in `constants/Colors.ts` for native components
3. Adjust the splash screen and icon backgrounds in `app.json`

The theme is designed to be cohesive across all platforms while maintaining the playful, bubblegum aesthetic.