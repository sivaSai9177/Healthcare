# Hardcoded Colors Audit Report

This report identifies all hardcoded colors found in the `app/` and `components/` directories.

## Summary

Found hardcoded colors in **56 files** across the following categories:
- Hex colors (#fff, #000000, etc.)
- RGB/RGBA colors
- Named colors (white, black, red, etc.)

## Issues by Type

### 1. Hex Colors

#### Critical Files with Multiple Hex Colors:
- **app/(auth)/login.tsx**
  - `#ffeb3b` - Debug panel background
  - `#000000` - Debug text color
  - `#e8e9eb`, `#f2f3f5`, `#ffffff` - LinearGradient colors
  - `rgba(0, 0, 0, 0.25)` - Box shadow

- **components/EnhancedDebugPanel.tsx**
  - `#ef4444` - Error color
  - `#f59e0b` - Warning color  
  - `#3b82f6` - Info color
  - `#10b981` - Debug color
  - `#fff` - Background color
  - `#9ca3af`, `#374151`, `#6b7280` - Text colors

- **app/app/(organization)/analytics.tsx**
  - `#3b82f6`, `#10b981`, `#f59e0b`, `#8b5cf6` - Chart colors
  - `#ef4444` - Emergency department color

- **app/(healthcare)/response-analytics.tsx**
  - `#EF4444`, `#F59E0B`, `#3B82F6`, `#8B5CF6`, `#6B7280` - Chart colors

### 2. Named Colors

#### Files using 'white', 'black', etc.:
- **app/app/(organization)/billing.tsx**
  - `color: 'white'` - Text color
  - `backgroundColor: '#1a1a1a'` - Card background

- **app/(home)/operator-dashboard-simple.tsx**
  - `backgroundColor: '#ffffff'`
  - `color: '#000'`, `#666`, `#333`
  - `backgroundColor: '#f5f5f5'`

- **app/index-debug.tsx**
  - `backgroundColor: '#f0f0f0'`, `#fff`
  - `color: '#000'`, `#666`

- **app/api/auth/[...auth]+api.ts**
  - `background: white`
  - `background: #f8f9fa`
  - `color: #28a745`, `#dc3545`, `#666`

### 3. RGB/RGBA Colors

#### Files using rgb() notation:
- **components/EnhancedDebugPanel.tsx**
  - `rgba(0, 0, 0, 0.05)` - Box shadow

- **app/(auth)/login.tsx**
  - `rgba(0, 0, 0, 0.25)` - Web box shadow

- **components/universal/Badge.tsx**
  - Opacity-based colors with hex + opacity suffix

### 4. Component-Specific Issues

#### Google Sign-In Button
- **components/GoogleSignInButton.tsx**
  - `#4285F4` - Google brand color
  - `#ffffff` - White color for icon

#### Theme Selector Components
- **components/ThemeSelector.tsx**
- **components/SpacingDensitySelector.tsx**
  - Using rgba colors for theme previews

#### Chart Components
- **components/universal/charts/**
  - Multiple hardcoded colors for data visualization

## Recommended Actions

1. **Create a centralized color palette** in the theme system
2. **Replace all hex values** with theme references
3. **Use semantic color names** (e.g., `theme.error` instead of `#ef4444`)
4. **Create chart color schemes** in the theme for consistency
5. **Define brand colors** (like Google blue) as constants
6. **Use theme-aware alternatives** for debug/development UI

## Priority Files to Fix

### High Priority (User-facing):
1. app/(auth)/login.tsx
2. app/(home)/operator-dashboard-simple.tsx
3. components/GoogleSignInButton.tsx
4. app/(healthcare)/alerts.tsx
5. app/(healthcare)/response-analytics.tsx

### Medium Priority (Internal tools):
1. components/EnhancedDebugPanel.tsx
2. app/index-debug.tsx
3. components/MobileDebugger.tsx

### Low Priority (Email templates):
1. src/server/services/email-templates/**

## Migration Strategy

Replace hardcoded colors with theme references:
```tsx
// Before
color: '#ef4444'
backgroundColor: 'white'

// After
color: theme.destructive
backgroundColor: theme.background
```

For chart colors, create a dedicated palette:
```tsx
// In theme
chartColors: {
  primary: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
  semantic: {
    emergency: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981'
  }
}
```