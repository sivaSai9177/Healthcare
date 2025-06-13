# Bundling Journey - January 2025

## Overview
This document chronicles the bundling issues encountered and resolved on January 12, 2025, while working with the Expo + Metro bundler setup.

## Issues Encountered & Solutions

### 1. Theme Import Path Error

**Error:**
```
Metro error: Unable to resolve module ../theme/theme-registry from lib/stores/theme-store.ts
```

**Root Cause:**
- The actual file was named `registry.tsx`, not `theme-registry.tsx`
- Import statement was looking for the wrong filename

**Solution:**
```typescript
// Before
import { themes, getTheme, ExtendedTheme } from '../theme/theme-registry';

// After
import { themes, getTheme, ExtendedTheme } from '../theme/registry';
```

### 2. _interopRequireDefault Error

**Error:**
```
Uncaught TypeError: _interopRequireDefault is not a function
```

**Root Cause:**
- Babel runtime helpers were missing
- CommonJS/ES module interop issues with Metro bundler

**Solution:**
Created `lib/core/platform/babel-helpers.js` to provide missing helpers:
```javascript
// Helper for CommonJS interop
if (typeof globalThis._interopRequireDefault === 'undefined') {
  globalThis._interopRequireDefault = function(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  };
}
```

Added early import in `index.js`:
```javascript
import './polyfills';
import '@/lib/core/platform/babel-helpers'; // Load babel helpers before other imports
import '@/lib/core/platform/web-init';
```

### 3. import.meta Transformation

**Error:**
```
Uncaught SyntaxError: Cannot use 'import.meta' outside a module
```

**Root Cause:**
- Some dependency was using `import.meta` which Metro doesn't support
- ES2020 feature not fully compatible with React Native bundler

**Solution:**
Created custom babel plugin `babel-plugin-transform-import-meta.js`:
```javascript
module.exports = function(babel) {
  const { types: t } = babel;
  
  return {
    visitor: {
      MetaProperty(path) {
        if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
          // Transform import.meta references
        }
      }
    }
  };
}
```

### 4. Missing Component Exports

**Issue:** Multiple TypeScript errors for missing exports
- `SelectTrigger`, `SelectContent` - Components trying to use shadcn-style API
- Missing icon exports (XCircle, User, Calendar, etc.)

**Solutions:**

**a) Select Component API Mismatch**
- Apps were using nested component pattern (SelectTrigger, SelectContent)
- Our Select component uses options prop pattern
- Fixed all 9 files to use correct API:
```tsx
// Before
<Select>
  <SelectTrigger>
    <SelectValue placeholder="All items" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All items</SelectItem>
  </SelectContent>
</Select>

// After
<Select 
  value={filter} 
  onValueChange={setFilter}
  placeholder="All items"
  options={[
    { value: "all", label: "All items" },
  ]}
/>
```

**b) Missing Icon Exports**
Added missing icons to `components/universal/Symbols.tsx`:
```typescript
export const XCircle = (props) => <Symbol name="xmark.circle" {...props} />;
export const User = (props) => <Symbol name="person" {...props} />;
export const Calendar = (props) => <Symbol name="calendar" {...props} />;
// ... and others
```

### 5. Theme Access Pattern Issues

**Issue:** Components trying to access `theme.colors.primary` but theme doesn't have nested colors object

**Solution:** Fixed all instances to access theme properties directly:
```typescript
// Before
theme.colors.primary
theme.colors.background

// After
theme.primary
theme.background
```

### 6. Missing Design Tokens

**Issue:** Components trying to use:
- `SCREEN_WIDTH`, `useResponsive` (not exported)
- Spacing tokens like `theme.md`, `theme.lg` (don't exist)

**Solution:**
Added exports to `lib/design/responsive.ts`:
```typescript
export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;

export function useResponsive() {
  // Hook implementation
}
```

## Key Learnings

### 1. Metro Bundler Behavior
- Aggressive caching can show old errors even after fixes
- Always clear caches when seeing persistent syntax errors
- Use `--clear` flag with expo start

### 2. Module System Compatibility
- Metro has limited ES2020+ support
- May need babel plugins for newer JS features
- CommonJS interop helpers may be required

### 3. Component API Consistency
- Ensure all components follow consistent API patterns
- Document expected component APIs clearly
- TypeScript helps catch API mismatches early

### 4. Design System Architecture
- Avoid duplicating what Tailwind already provides
- Use Tailwind tokens instead of custom ones when possible
- Keep design system focused on what Tailwind doesn't cover

### 5. Import/Export Management
- Be explicit about exports in index files
- Ensure all used components/utilities are properly exported
- Use TypeScript to catch missing exports early

## Bundle Size Impact
- Added babel helpers: ~1KB
- Added babel plugin: Build-time only, no runtime impact
- Fixed imports: No additional bundle size

## Performance Considerations
- Babel helpers loaded early for minimal overhead
- No runtime transformation needed
- All fixes are build-time or one-time setup

## Future Recommendations
1. Consider migrating fully to Tailwind/NativeWind patterns
2. Remove duplicate design system implementations
3. Standardize on single component API pattern
4. Add pre-commit hooks to catch import issues
5. Document component APIs in TypeScript interfaces