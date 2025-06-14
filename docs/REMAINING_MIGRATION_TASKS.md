# Remaining Migration Tasks

Last Updated: January 15, 2025

## Overview
Current Migration Progress: **75%** (27/36 blocks migrated)

## Remaining Blocks to Migrate

### 1. Healthcare Blocks (2 remaining)
- [ ] **AlertTimeline** (`/components/blocks/healthcare/AlertTimeline/`)
  - Status: Uses `useTheme` hook
  - Tasks: Replace with Tailwind classes, fix hardcoded colors
  
- [ ] **EscalationTimer** (`/components/blocks/healthcare/EscalationTimer/`)
  - Status: Uses `useThemeStore` with some theme dependencies
  - Tasks: Remove theme dependencies, use semantic variants

### 2. Navigation Blocks (1 remaining)
- [x] **UserMenu** (`/components/blocks/navigation/UserMenu.tsx`)
  - Status: Fixed typo `haptics.toggle()` to `haptic('light')`
  - Tasks: ✅ COMPLETE
  
- [ ] **Navigation** (`/components/blocks/navigation/Navigation.tsx`)
  - Status: Web-specific component
  - Tasks: Add React Native support or create RN variant

### 3. Auth Screens to Block Migration (1 component remaining)
These components exist in `/app/(auth)` but should be extracted to blocks:

- [x] **SignIn Block** (from `login.tsx`)
  - Extract: Login form, social login section, terms footer
  - Create: `/components/blocks/auth/SignIn/SignIn.tsx` ✅ COMPLETE
  
- [x] **Register Block** (from `register.tsx`)
  - Extract: Registration form, password strength, terms section
  - Create: `/components/blocks/auth/Register/Register.tsx` ✅ COMPLETE
  
- [ ] **ForgotPassword Block** (from `forgot-password.tsx`)
  - Extract: Forgot password form
  - Create: `/components/blocks/auth/ForgotPassword/ForgotPassword.tsx`
  
- [x] **VerifyEmail Block** (from `verify-email.tsx`)
  - Extract: Email verification form, resend section
  - Create: `/components/blocks/auth/VerifyEmail/VerifyEmail.tsx` ✅ COMPLETE
  - Note: Theme migration also completed

- [x] **Common Auth Components** ✅ ALL COMPLETE
  - Created: `AuthCard` - responsive auth wrapper ✅
  - Created: `AuthFormField` - consistent form fields ✅
  - Created: `SocialLoginButtons` - reusable social login group ✅
  - Created: `PasswordStrengthIndicator` - visual password requirements ✅
  - Created: `TermsFooter` - terms and privacy footer ✅

## Code Quality Issues

### TODOs in Code
- `AlertDashboard.tsx` - TODO for manual escalation implementation
- `register.tsx` (line 44) - TODO comment needs addressing

### Console.logs to Remove
- Check all migrated components for any remaining console.log statements

## Documentation Updates Needed

After completing migrations:
1. Update `/docs/INDEX.md` - main documentation index
2. Update `/docs/modules/` - module-specific documentation
3. Update `/docs/COMPONENT_STRUCTURE.md` - component organization
4. Update `/MIGRATION_TRACKER.md` - final migration status
5. Create `/docs/AUTH_FLOW.md` - document new auth block structure
6. Update component exports in `/components/index.ts`
7. Update block-specific READMEs in each block folder

## Migration Pattern Reference

### For Theme Migration:
```tsx
// ❌ Old
const theme = useTheme();
style={{ backgroundColor: theme.background }}

// ✅ New
className="bg-background"
```

### For Spacing:
```tsx
// ❌ Old
padding: spacing.md

// ✅ New
padding: spacing[3]
// or
className="p-3"
```

### For Shadows:
```tsx
// ❌ Old
shadow: PLATFORM_TOKENS.shadow?.md

// ✅ New
const shadowMd = useShadow({ size: 'md' });
style={shadowMd}
```

### For Animations:
```tsx
// ✅ Add
import Animated, { FadeIn, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// Add entrance animations
entering={FadeIn.springify()}

// Add interaction animations
const scale = useSharedValue(1);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));
```

## Priority Order

1. **High Priority**: Auth screen to block migration (affects user flow)
2. **Medium Priority**: Healthcare blocks (AlertTimeline, EscalationTimer)
3. **Low Priority**: Navigation blocks (mostly working, minor fixes)

## Estimated Completion

- Auth blocks extraction: ✅ 4 hours completed (1 block remaining: ~1 hour)
- Healthcare blocks: 1-2 hours
- Navigation blocks: ✅ UserMenu fixed, Navigation RN support: ~1 hour
- Documentation updates: 2 hours

**Total Estimated Time Remaining**: 5-6 hours

## Completed in This Session
- ✅ SignIn block extracted with useSignIn hook
- ✅ Register block extracted with useRegister hook  
- ✅ VerifyEmail block extracted with useVerifyEmail hook
- ✅ AuthCard responsive wrapper component
- ✅ AuthFormField consistent form field component
- ✅ PasswordStrengthIndicator standalone component
- ✅ SocialLoginButtons reusable social login component
- ✅ TermsFooter reusable terms/privacy component
- ✅ Fixed UserMenu typo (haptics.toggle() → haptic('light'))