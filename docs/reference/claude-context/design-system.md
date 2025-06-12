# 🎨 Universal Design System - Claude Context Module

*Last Updated: January 10, 2025*

## Overview

The project includes a comprehensive universal design system that provides consistent, cross-platform components for iOS, Android, and Web with **5 built-in themes** and dynamic theme switching.

## Theme System

### Built-in Themes
1. **Default** (shadcn) - Clean, modern design
2. **Bubblegum** - Playful pink/purple theme
3. **Ocean** - Calming blue/teal theme
4. **Forest** - Natural green theme
5. **Sunset** - Warm orange/red theme

### Theme Features
- **Dynamic Switching**: Change themes at runtime with persistence
- **Dark Mode**: All themes support light/dark color schemes
- **Shadow System**: 8 levels (shadow2xs to shadow2xl)
- **Persistence**: AsyncStorage/localStorage for theme preferences

### Key Theme Files
- `lib/theme/enhanced-theme-provider.tsx` - Enhanced theme provider
- `lib/theme/theme-registry.tsx` - Theme definitions and registry
- `lib/theme/theme-provider.tsx` - Re-exports enhanced provider
- `components/ThemeSelector.tsx` - Theme selection UI

## Universal Components (48+ Components)

### Core Layout Components
- **Box**: Flexible container with spacing, layout, and visual props
- **Container**: Page wrapper with safe area and scroll support
- **Grid**: Responsive grid layout system
- **Stack (VStack/HStack)**: Layout components for consistent spacing
- **ScrollContainer**: Scrollable container with animations
- **ScrollHeader**: Header that shrinks on scroll

### Typography Components
- **Text**: Base text component with variants
- **Heading1-4**: Heading components
- **Label**: Form label component

### Form Components
- **Input**: Form input with validation and theming
- **Button**: Accessible button with variants and states
- **Checkbox**: Accessible checkbox with theme support
- **Switch**: Toggle switch with platform-specific styling
- **Select**: Dropdown select component
- **Slider**: Range slider with value display
- **RadioGroup**: Radio button group
- **DatePicker**: Calendar date picker
- **FilePicker**: File upload component
- **ColorPicker**: Color selection tool
- **Search**: Search input with suggestions
- **Form**: Form wrapper with validation

### Feedback Components
- **Alert**: Notification alerts
- **Badge**: Status badges
- **Progress**: Progress bars
- **Skeleton**: Loading placeholders
- **Toast**: Temporary notifications
- **EmptyState**: Empty content states
- **ErrorDisplay**: Error message display

### Navigation Components
- **Tabs**: Tab navigation
- **Breadcrumb**: Navigation breadcrumbs
- **Pagination**: Page navigation
- **Stepper**: Multi-step forms
- **NavigationMenu**: Navigation menus
- **Link**: Navigation links
- **Navbar**: Navigation bar

### Data Display Components
- **Card**: Content container
- **Table**: Data tables
- **List**: List component
- **Avatar**: User avatars
- **Timeline**: Event timeline
- **Rating**: Star ratings
- **Stats**: Statistics display

### Overlay Components
- **Dialog**: Modal dialogs
- **Drawer**: Slide-out panels
- **DropdownMenu**: Floating menus
- **Popover**: Floating content
- **Tooltip**: Hover tooltips
- **ContextMenu**: Right-click menus
- **Collapsible**: Expandable content
- **Accordion**: Collapsible sections

### Chart Components
- **LineChart**: Line graphs
- **BarChart**: Bar graphs
- **PieChart**: Pie charts
- **AreaChart**: Area charts
- **RadarChart**: Radar charts
- **RadialChart**: Radial progress

## Design Tokens

### Spacing System
- **Base Scale**: 4px-based (0-96)
- **Density Modes**:
  - Compact (75% of base)
  - Medium (100% of base)
  - Large (125% of base)
- **Component Spacing**: Predefined for consistency

### Typography
- **Font Sizes**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl
- **Font Weights**: normal, medium, semibold, bold
- **Line Heights**: Optimized for readability
- **Font Families**: Platform-specific system fonts

### Colors
- **Semantic Colors**: primary, secondary, destructive, etc.
- **Foreground/Background**: Automatic contrast
- **State Colors**: hover, active, disabled states
- **Dark Mode**: Automatic color inversion

### Shadows
```typescript
shadow2xs: 1px elevation
shadowxs: 2px elevation
shadowsm: 4px elevation
shadow: 6px elevation
shadowmd: 8px elevation
shadowlg: 12px elevation
shadowxl: 16px elevation
shadow2xl: 24px elevation
```

### Border Radius
- **Radius Scale**: 0, 2, 4, 6, 8, 12, 16, 24, 9999 (full)
- **Component Defaults**: Consistent radius per component type

## Animation Variant System

### Variants
- **Subtle**: Minimal animations for professional apps
- **Moderate**: Balanced animations (default)
- **Energetic**: Playful animations for engaging experiences
- **None**: Disables animations for accessibility

### Animation Types
- **fade**: Opacity transitions
- **scale**: Size transitions
- **slide**: Position transitions
- **bounce**: Bounce effects
- **shake**: Error feedback
- **stagger**: Sequential animations

## Responsive System

### Breakpoints
```typescript
xs: 0px
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Responsive Values
```typescript
// Component props accept responsive objects
<Box p={{ xs: 4, md: 6, lg: 8 }} />
```

### Responsive Hooks
- `useBreakpoint()` - Current breakpoint
- `useResponsiveValue()` - Responsive values
- `useMediaQuery()` - Media query matching
- `useIsMobile()` - Mobile detection

## Usage Patterns

### Theme Access Pattern
```typescript
// CORRECT - useTheme() returns ExtendedTheme directly
const theme = useTheme();
const bgColor = theme.primary; // Direct access
const textColor = theme.primaryForeground;

// WRONG - Do NOT use theme.colors
const bgColor = theme.colors.primary; // ❌ INCORRECT
```

### Component Usage
```typescript
import { Container, VStack, Heading1, Text, Button } from '@/components/universal';

<Container scroll>
  <VStack p={4} spacing={4}>
    <Heading1>Welcome</Heading1>
    <Text colorTheme="mutedForeground">Get started with our app</Text>
    <Button onPress={handleStart}>Begin</Button>
  </VStack>
</Container>
```

### Animation Usage
```typescript
<Button 
  animated
  animationVariant="moderate"
  animationType="scale"
  onPress={handlePress}
>
  Animated Button
</Button>
```

## Key Files
- `lib/design-system/index.ts` - Design tokens and constants
- `lib/design-system/spacing-theme.ts` - Responsive spacing system
- `lib/design-system/animation-variants.ts` - Animation variant configs
- `lib/design-system/responsive.ts` - Responsive design tokens
- `contexts/SpacingContext.tsx` - Spacing density provider
- `components/universal/` - Universal component library
- `hooks/useAnimationVariant.ts` - Animation variant hook
- `hooks/useReducedMotion.ts` - Accessibility motion detection

---

*This module contains design system details. For implementation patterns, see patterns-conventions.md.*