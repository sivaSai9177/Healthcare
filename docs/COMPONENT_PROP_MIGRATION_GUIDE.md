# Component Props Migration Guide

This guide helps migrate from the old design system props to the new Tailwind-based props.

## Box Component

### Old Props → New Props

```tsx
// OLD
<Box p={4} flex={1} bgTheme="background" />

// NEW
<Box className="p-4 flex-1 bg-background" />
```

Common mappings:
- `p={n}` → `className="p-{n}"`
- `px={n}` → `className="px-{n}"`
- `py={n}` → `className="py-{n}"`
- `m={n}` → `className="m-{n}"`
- `flex={1}` → `className="flex-1"`
- `bgTheme="background"` → `className="bg-background"`
- `alignItems="center"` → `className="items-center"`
- `justifyContent="center"` → `className="justify-center"`

## Stack Components (VStack, HStack)

### Old Props → New Props

```tsx
// OLD
<VStack spacing={4} alignItems="center" justifyContent="center" />

// NEW
<VStack gap={4} align="center" justify="center" />
```

Changes:
- `spacing` → `gap`
- `alignItems` → `align` (values: 'start' | 'center' | 'end' | 'stretch')
- `justifyContent` → `justify` (values: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly')

## Card Component

### Old Props → New Props

```tsx
// OLD
<Card p={4} shadow="md" bgTheme="card" borderTheme="border" />

// NEW
<Card className="p-4" variant="default" />
```

Card variants:
- `variant="default"` - includes shadow and background
- `variant="outline"` - border only
- `variant="ghost"` - no background or border

## Button Component

### Size Changes

```tsx
// OLD
<Button size="md" />

// NEW
<Button size="default" />
```

Size mappings:
- `"xs"` → `"sm"`
- `"sm"` → `"sm"`
- `"md"` → `"default"`
- `"lg"` → `"lg"`
- `"xl"` → `"lg"`

## Text Component

### Old Props → New Props

```tsx
// OLD
<Text colorTheme="mutedForeground" size="sm" weight="medium" />

// NEW
<Text variant="muted" size="sm" weight="medium" />
```

Color theme mappings:
- `colorTheme="foreground"` → `variant="default"`
- `colorTheme="mutedForeground"` → `variant="muted"`
- `colorTheme="primary"` → `variant="primary"`
- `colorTheme="destructive"` → `variant="destructive"`

## Common Patterns

### Flex containers
```tsx
// OLD
<Box flex={1} flexDirection="row" alignItems="center" />

// NEW
<Box className="flex-1 flex-row items-center" />
```

### Spacing
```tsx
// OLD
<Box mt={4} mb={2} mx={3} />

// NEW
<Box className="mt-4 mb-2 mx-3" />
```

### Colors
```tsx
// OLD
<Box bgTheme="background" borderTheme="border" />

// NEW
<Box className="bg-background border-border" />
```

## Migration Script

To help with migration, use these regex patterns:

1. Box spacing props:
   - Find: `<Box([^>]*)\sp={(\d+)}`
   - Replace: `<Box$1 className="p-$2"`

2. Stack spacing:
   - Find: `spacing={(\d+)}`
   - Replace: `gap={$1}`

3. Stack alignment:
   - Find: `alignItems="([^"]*)"`
   - Replace: `align="$1"`

4. Button size:
   - Find: `size="md"`
   - Replace: `size="default"`