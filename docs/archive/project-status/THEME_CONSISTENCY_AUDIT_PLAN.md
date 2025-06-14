# Theme Consistency Audit Plan

**Created**: January 12, 2025  
**Priority**: HIGH - Next Task  
**Target**: Complete theme consistency across all components

## 🎯 Objectives

1. Ensure all components use the theme system correctly
2. Remove any hardcoded colors or styles
3. Verify dark mode support works everywhere
4. Ensure consistent spacing using the design system
5. Remove unused theme imports and utilities

## 📋 Audit Checklist

### 1. Theme Provider Usage
- [ ] Verify EnhancedThemeProvider is used in _layout.tsx
- [ ] Check all screens have access to theme context
- [ ] Ensure no duplicate theme providers

### 2. Component Audit - Universal Components (48 components)
- [ ] Accordion - Check theme colors, dark mode
- [ ] Alert - Verify variant colors use theme
- [ ] AppSidebar - Check background, borders
- [ ] Avatar - Verify fallback colors
- [ ] Badge - Check all variant colors
- [ ] Box - Verify bgTheme, borderTheme props
- [ ] Breadcrumb - Check separator, text colors
- [ ] Button - Verify all variants use theme
- [ ] Card - Check shadow, background, border
- [ ] Checkbox - Verify checked state colors
- [ ] ... (continue for all 48 components)

### 3. Screen Audit
- [ ] Login screens - Check form styles, backgrounds
- [ ] Dashboard screens - Verify card styles, metrics
- [ ] Healthcare screens - Check alert colors, status badges
- [ ] Settings screens - Verify toggle states, selections
- [ ] Modal screens - Check overlay, backdrop colors

### 4. Common Issues to Fix
- [ ] Replace hardcoded colors with theme values
- [ ] Remove inline styles using color values
- [ ] Fix any backgroundColor: 'white' → theme.background
- [ ] Fix any color: 'black' → theme.foreground
- [ ] Replace opacity values with theme opacity
- [ ] Ensure borders use theme.border color

### 5. Dark Mode Verification
- [ ] Test all screens in dark mode
- [ ] Verify text remains readable
- [ ] Check contrast ratios
- [ ] Ensure shadows work in dark mode
- [ ] Verify chart colors adapt

### 6. Spacing Consistency
- [ ] Replace hardcoded padding/margin with SpacingScale
- [ ] Use consistent gap values (1-12)
- [ ] Verify responsive spacing works
- [ ] Check component spacing matches design system

## 🔍 Search Patterns

### Find Hardcoded Colors
```bash
# Search for hex colors
grep -r "#[0-9a-fA-F]\{3,6\}" app/ components/

# Search for rgb/rgba
grep -r "rgb\|rgba" app/ components/

# Search for named colors
grep -r "color: ['\"]\\(white\\|black\\|red\\|blue\\|green\\)" app/ components/
```

### Find Hardcoded Spacing
```bash
# Search for pixel values
grep -r "padding: [0-9]\|margin: [0-9]" app/ components/

# Search for style objects with numbers
grep -r "style=.*[0-9]" app/ components/
```

### Find Unused Theme Imports
```bash
# Search for theme imports
grep -r "useTheme" app/ components/ | grep -v "theme\."
```

## 🛠️ Fix Templates

### Replace Hardcoded Color
```typescript
// Before
style={{ backgroundColor: '#ffffff' }}
style={{ color: 'black' }}

// After
style={{ backgroundColor: theme.background }}
style={{ color: theme.foreground }}
```

### Replace Hardcoded Spacing
```typescript
// Before
style={{ padding: 16 }}
<Box padding={20}>

// After
style={{ padding: spacing[4] }}
<Box p={4}>
```

### Fix Dark Mode Support
```typescript
// Add proper theme colors
const cardStyle = {
  backgroundColor: theme.card,
  borderColor: theme.border,
  shadowColor: theme.foreground,
  ...Platform.select({
    ios: {
      shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.1,
    },
    android: {
      elevation: theme.mode === 'dark' ? 8 : 4,
    },
  }),
};
```

## 📊 Success Metrics

1. **No Hardcoded Colors**: 0 hex/rgb/named colors in styles
2. **Consistent Spacing**: All spacing uses SpacingScale
3. **Dark Mode Works**: All screens readable in dark mode
4. **No Unused Imports**: Clean theme imports
5. **Type Safety**: All theme props properly typed

## 🚀 Execution Plan

### Phase 1: Automated Cleanup (30 min)
1. Run search scripts to find issues
2. Create list of files needing updates
3. Use find/replace for common patterns

### Phase 2: Component Audit (2 hours)
1. Check each universal component
2. Fix theme usage issues
3. Test in light/dark mode

### Phase 3: Screen Audit (1 hour)
1. Review all app screens
2. Fix any remaining issues
3. Verify navigation transitions

### Phase 4: Testing (30 min)
1. Test app in light mode
2. Test app in dark mode
3. Verify no visual regressions
4. Check TypeScript compilation

## 📝 Documentation Updates

After completion:
1. Update theme usage guide
2. Document any new patterns
3. Create migration guide for remaining issues
4. Update component examples

---

*This plan ensures consistent theming throughout the application*