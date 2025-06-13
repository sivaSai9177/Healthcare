# Tailwind Migration Guide for Team

## 🚀 Quick Start

This guide helps you migrate components from our custom design system to Tailwind/NativeWind.

---

## 🔄 Migration Cheat Sheet

### Spacing Migration

```typescript
// ❌ OLD: Custom spacing
<Box style={{ padding: spacing[4] }}>
<VStack space={theme.md}>
<HStack gap={spacing.lg}>
margin: ${({ theme }) => theme.spacing[2]}px

// ✅ NEW: Tailwind classes
<Box className="p-4">
<VStack className="space-y-4">
<HStack className="gap-6">
className="m-2"
```

### Spacing Reference
```
OLD → NEW
spacing[1] → p-1 (4px)
spacing[2] → p-2 (8px)
spacing[3] → p-3 (12px)
spacing[4] → p-4 (16px)
spacing[6] → p-6 (24px)
spacing[8] → p-8 (32px)

theme.xs → gap-2 (8px)
theme.sm → gap-3 (12px)
theme.md → gap-4 (16px)
theme.lg → gap-6 (24px)
theme.xl → gap-8 (32px)
```

### Color Migration

```typescript
// ❌ OLD: Theme colors
backgroundColor: theme.colors.primary
color: theme.colors.background
borderColor: theme.colors.border

// ✅ NEW: Tailwind colors
className="bg-primary"
className="text-background"
className="border-border"
```

### Component Patterns

#### Button Migration
```typescript
// ❌ OLD
<Button
  variant="solid"
  colorScheme="primary"
  size={buttonSize}
  style={{ backgroundColor: theme.primary }}
>

// ✅ NEW
<Button
  variant="default"
  size="md"
  className="bg-primary text-primary-foreground"
>
```

#### Card Migration
```typescript
// ❌ OLD
<Card
  style={{
    padding: spacing[4],
    backgroundColor: theme.card,
    shadowColor: theme.shadow,
  }}
>

// ✅ NEW
<Card className="p-4 bg-card shadow-sm">
```

#### Layout Migration
```typescript
// ❌ OLD
<VStack space={theme.md} style={{ padding: spacing[4] }}>
  <HStack gap={spacing[2]} align="center">

// ✅ NEW
<VStack className="space-y-4 p-4">
  <HStack className="gap-2 items-center">
```

---

## 🎨 Complete Class Reference

### Spacing Classes
```
Padding: p-{0-96}
Margin: m-{0-96}
Gap: gap-{0-96}

Directional:
- Top: pt-4, mt-4
- Right: pr-4, mr-4
- Bottom: pb-4, mb-4
- Left: pl-4, ml-4
- X-axis: px-4, mx-4
- Y-axis: py-4, my-4
```

### Color Classes
```
Background: bg-{color}
Text: text-{color}
Border: border-{color}

Theme colors:
- primary, primary-foreground
- secondary, secondary-foreground
- destructive, destructive-foreground
- muted, muted-foreground
- accent, accent-foreground
- card, card-foreground
- background, foreground
```

### Typography Classes
```
Size: text-{xs|sm|base|lg|xl|2xl|3xl|4xl}
Weight: font-{thin|light|normal|medium|semibold|bold}
Style: italic, not-italic
Align: text-{left|center|right|justify}
```

### Layout Classes
```
Display: flex, hidden, block
Direction: flex-row, flex-col
Justify: justify-{start|center|end|between|around}
Align: items-{start|center|end|baseline|stretch}
Wrap: flex-wrap, flex-nowrap
```

### Interactive States
```
Hover: hover:bg-primary-dark
Active: active:scale-95
Focus: focus:ring-2
Disabled: disabled:opacity-50
```

### Responsive Classes
```
Small: sm:p-4
Medium: md:p-6
Large: lg:p-8
XL: xl:p-10

Example:
className="p-4 sm:p-6 lg:p-8"
```

---

## 🔧 Component Migration Examples

### Example 1: Simple Component
```typescript
// ❌ OLD
const Card = styled.View`
  padding: ${({ theme }) => theme.spacing[4]}px;
  background-color: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius.md}px;
`;

// ✅ NEW
const Card = ({ className, ...props }) => (
  <View
    className={cn("p-4 bg-card rounded-md", className)}
    {...props}
  />
);
```

### Example 2: Complex Component
```typescript
// ❌ OLD
const ComplexCard = () => {
  const { spacing, colors } = useTheme();
  
  return (
    <View
      style={{
        padding: spacing[4],
        marginBottom: spacing[2],
        backgroundColor: colors.card,
        shadowColor: colors.shadow,
        gap: spacing.md,
      }}
    >
      {children}
    </View>
  );
};

// ✅ NEW
const ComplexCard = () => {
  return (
    <View className="p-4 mb-2 bg-card shadow-md space-y-4">
      {children}
    </View>
  );
};
```

### Example 3: Responsive Component
```typescript
// ❌ OLD
const ResponsiveBox = () => {
  const { isSmall, isMedium } = useResponsive();
  const padding = isSmall ? 16 : isMedium ? 24 : 32;
  
  return <View style={{ padding }} />;
};

// ✅ NEW
const ResponsiveBox = () => {
  return <View className="p-4 sm:p-6 lg:p-8" />;
};
```

---

## 🎭 Animation Migration

### Keep Our Animation System!
```typescript
// ✅ KEEP: Our animation hooks
const { animatedStyle } = useAnimation('fadeIn');
const { className } = useAnimation('slideUp'); // Returns Tailwind class on web

// ✅ KEEP: Haptic feedback
onPress={() => {
  haptic('light');
  handlePress();
}}

// ✅ KEEP: Animation preferences
const { reducedMotion } = useAnimationStore();
```

---

## ⚠️ Common Pitfalls

### 1. Don't Mix Systems
```typescript
// ❌ BAD: Mixing systems
<Box className="p-4" style={{ margin: spacing[2] }}>

// ✅ GOOD: Use one system
<Box className="p-4 m-2">
```

### 2. Don't Forget Platform Differences
```typescript
// ✅ Platform-aware classes
<View className="shadow-sm ios:shadow-md android:elevation-2">
```

### 3. Don't Hardcode Colors
```typescript
// ❌ BAD: Hardcoded
<Text style={{ color: '#007AFF' }}>

// ✅ GOOD: Theme colors
<Text className="text-primary">
```

---

## 📝 Migration Checklist

For each component:
- [ ] Remove all `useTheme()` and `useSpacing()` hooks
- [ ] Replace style objects with className
- [ ] Convert spacing values to Tailwind scale
- [ ] Update color references
- [ ] Test responsive behavior
- [ ] Verify animations still work
- [ ] Update component tests
- [ ] Update TypeScript types

---

## 🔍 Quick Lookup

### Most Used Classes
```
p-4          // padding: 16px
m-2          // margin: 8px
space-y-4    // vertical gap: 16px
gap-2        // flexbox gap: 8px
rounded-md   // border-radius: 6px
shadow-sm    // small shadow
bg-card      // card background
text-primary // primary text color
flex-1       // flex: 1
w-full       // width: 100%
```

### Conversion Formula
```
Tailwind number * 4 = pixels
p-1 = 4px
p-2 = 8px
p-3 = 12px
p-4 = 16px
p-5 = 20px
p-6 = 24px
p-8 = 32px
```

---

## 🆘 Need Help?

1. Check Tailwind docs: https://tailwindcss.com/docs
2. Check NativeWind docs: https://www.nativewind.dev/
3. Look at migrated components in `components/universal/`
4. Ask in #frontend-help channel
5. Refer to `COMPONENT_PATTERNS.md`