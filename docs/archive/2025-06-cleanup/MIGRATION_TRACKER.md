# Block Components Migration Tracker

## Overview
This document tracks the migration status of all block components in `/components/blocks/` to the new design system.

## Migration Criteria
Each component is evaluated against the following criteria:
- ✅ **Theme System**: Using new theme provider, not old useTheme/Colors
- ✅ **Color System**: Using semantic colors (colorTheme prop), not hardcoded
- ✅ **Shadow System**: Using shadow props from design system
- ✅ **Spacing System**: Using SpacingScale types and spacing store
- ✅ **Responsive**: Using responsive hooks and breakpoints
- ✅ **Animations**: Has proper animations (where appropriate)
- ✅ **Design Patterns**: Follows new universal component patterns

## Status Legend
- 🟢 **Complete**: Fully migrated, follows all patterns
- 🟡 **Partial**: Some migration done, needs work
- 🔴 **Not Started**: Still using old patterns
- ⚡ **Priority**: High priority based on PRD (healthcare alerts)

---

## Healthcare Blocks ⚡ (HIGHEST PRIORITY)

### 1. AlertDashboard (/healthcare/AlertDashboard/)
- **Status**: 🟡 Partial
- **Issues**:
  - ❌ Using old `useTheme` hook (line 25)
  - ❌ Hardcoded colors in styles (lines 166, 183, 325, 333)
  - ❌ Direct theme color access (theme.destructive, theme.warning)
  - ✅ Has animations (useFadeAnimation, useScaleAnimation)
  - ✅ Using spacing system partially
  - ✅ Has haptic feedback
- **Action**: Replace useTheme with color tokens, use semantic colors

### 2. AlertCreationForm (/healthcare/AlertCreationForm/)
- **Status**: 🟡 Partial  
- **Issues**:
  - ❌ Using old `useTheme` hook (line 15)
  - ❌ Hardcoded healthcare colors object (lines 37-44)
  - ❌ Direct color assignments in styles
  - ✅ Using spacing system (useHealthcareSpacing)
  - ✅ Has React 19 features (useTransition, useDeferredValue)
  - ✅ Responsive design
- **Action**: Remove hardcoded colors, use design system colors

### 3. AlertTimeline (/healthcare/AlertTimeline/)
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 4. EscalationTimer (/healthcare/EscalationTimer/)
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 5. AlertList.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 6. AlertSummary.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 7. ActivePatients.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 8. MetricsOverview.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 9. PatientCard.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

---

## Dashboard Blocks

### 1. MetricsOverview.tsx
- **Status**: 🟡 Partial
- **Issues**:
  - ❌ Using old `useTheme` hook (line 24)
  - ❌ Hardcoded colors in icon containers (line 218)
  - ❌ Direct theme color access (theme.primary, theme.secondary, etc.)
  - ❌ Using className for styling (lines 189, 231, 247)
  - ✅ Using spacing system
  - ✅ Role-based filtering logic
- **Action**: Replace theme hook, remove className usage

### 2. QuickActions.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 3. WelcomeHeader.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

---

## Navigation Blocks

### 1. AppSidebar.tsx
- **Status**: 🟢 Complete
- **Notes**:
  - ✅ No theme hook usage
  - ✅ Uses animation hooks properly
  - ✅ Clean component structure
  - ✅ Platform-specific animations
- **Action**: None needed

### 2. Navigation.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 3. TeamSwitcher.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 4. UserMenu.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 5. NavMain.tsx, NavProjects.tsx, NavUser.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

---

## Organization Blocks

### 1. OrganizationCreationWizard.tsx
- **Status**: 🟡 Partial
- **Issues**:
  - ❌ Using old `useTheme` hook (line 119, returns `colors`)
  - ❌ Direct color access (colors[plan.color], line 526)
  - ❌ Inline backgroundColor styles
  - ✅ Using new universal components
  - ✅ Has animations (Reanimated)
  - ✅ Form validation with Zod
  - ✅ Responsive design
- **Action**: Replace useTheme with design tokens

### 2. GeneralSettings.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 3. MemberManagement.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 4. OrganizationMetrics.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 5. OrganizationOverview.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 6. QuickActions.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

---

## Auth Blocks

### 1. GoogleSignIn
- **Status**: 🟢 Complete
- **Notes**:
  - ✅ Clean implementation
  - ✅ Uses universal components
  - ✅ No theme hook usage
  - ❌ Minor: Hardcoded Google blue color (#4285F4)
- **Action**: Consider using design token for brand color

### 2. ProtectedRoute.tsx
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 3. ProfileCompletion
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 4. ForgotPassword, Register, SignIn
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

---

## Theme Blocks

### 1. DarkModeToggle
- **Status**: 🟢 Complete
- **Notes**:
  - ✅ Uses colorScheme context properly
  - ✅ Clean implementation
  - ✅ No old theme usage
- **Action**: None needed

### 2. ThemeSelector
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 3. SpacingDensitySelector
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

---

## Debug Blocks

### 1. DebugPanel and variants
- **Status**: 🔴 Not Checked
- **Priority**: Low (developer tools)
- **Action**: Can be migrated last

---

## Forms Blocks

### 1. OrganizationField
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

### 2. RoleSelector
- **Status**: 🔴 Not Checked
- **Action**: Needs full audit

---

## Migration Priority Order

### Phase 1: Healthcare Blocks (Week 1) ⚡
1. **AlertDashboard** - Core PRD feature
2. **AlertCreationForm** - Core PRD feature  
3. **EscalationTimer** - Core PRD feature
4. **AlertTimeline** - Supporting feature
5. Other healthcare blocks

### Phase 2: Dashboard & Organization (Week 2)
1. **MetricsOverview** - Common component
2. **OrganizationCreationWizard** - User onboarding
3. Other dashboard blocks
4. Organization settings blocks

### Phase 3: Auth & Forms (Week 3)
1. Auth flow components
2. Form components
3. Navigation components (mostly done)

### Phase 4: Low Priority (Week 4)
1. Debug blocks
2. Theme selector blocks
3. Any remaining components

---

## Common Migration Tasks

### For Components Using `useTheme`:
```tsx
// OLD
import { useTheme } from '@/lib/theme/provider';
const theme = useTheme();
style={{ color: theme.destructive }}

// NEW
import { useColorScheme } from '@/lib/design/color';
const colors = useColorScheme();
style={{ color: colors.destructive }}
// OR use colorTheme prop on Text/components
```

### For Hardcoded Colors:
```tsx
// OLD
const healthcareColors = {
  critical: '#ef4444',
  high: '#f59e0b',
}

// NEW
// Use semantic colors from design system
import { SEMANTIC_COLORS } from '@/lib/design/color';
```

### For Shadow Implementation:
```tsx
// OLD
style={{ shadowColor: '#000', shadowOffset: {...} }}

// NEW
import { useShadow } from '@/hooks/useShadow';
const shadow = useShadow('md');
```

---

## Success Metrics
- All healthcare blocks migrated and tested
- No hardcoded colors in any block
- All blocks using new theme system
- Consistent spacing and responsive behavior
- Proper shadow implementation across platforms

---

## Notes
- Healthcare blocks are highest priority per PRD
- Focus on removing all `useTheme` imports
- Ensure all colors use semantic tokens
- Test on both web and mobile platforms
- Maintain backwards compatibility during migration