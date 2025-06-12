# App Navigation Architecture & Layout Plan

**Last Updated**: January 11, 2025  
**Status**: Implementation In Progress  
**Version**: 2.0.0

## Overview

This document outlines the complete navigation structure, user flows, and screen organization for the Expo Modern Starter Kit with integrated Hospital Alert System. It follows React Navigation and Expo Router best practices while integrating our animation system.

## Navigation Structure

### 1. Root Navigator
```
Root (_layout.tsx)
├── Auth Stack (unauthenticated)
│   └── (auth)/_layout.tsx
└── App Stack (authenticated)
    └── (home)/_layout.tsx (Tab Navigator)
```

### 2. Authentication Stack
```
(auth)/
├── _layout.tsx (Stack Navigator) ✅
├── login.tsx ✅
├── register.tsx ✅
├── forgot-password.tsx ✅
├── complete-profile.tsx ✅
└── verify-email.tsx ✅
```

### 3. Main App Navigation
```
(home)/
├── _layout.tsx (Tab Navigator) ✅
├── index.tsx (Home Dashboard) ✅
├── explore.tsx ✅
├── healthcare-dashboard.tsx ✅
├── organization-dashboard.tsx ✅
├── organization-settings.tsx ✅
├── settings.tsx ✅
├── admin.tsx (admin role) ✅
├── manager.tsx (manager role) ✅
├── operator-dashboard.tsx (operator role) ✅
└── create-organization.tsx ✅
```

### 4. Modal/Stack Screens
```
(modals)/
├── _layout.tsx (Stack Navigator with modal presentation) ✅
├── create-alert.tsx ✅
├── patient-details.tsx ✅
├── member-details.tsx ✅
├── profile-edit.tsx ✅
├── notification-center.tsx ✅
└── search.tsx ✅
```

### 5. Feature Sections

#### Healthcare Section
```
(healthcare)/
├── _layout.tsx (Stack Navigator) ✅
├── alerts.tsx ✅
└── patients.tsx ✅
```

#### Organization Section
```
(organization)/
├── _layout.tsx (Stack Navigator) ✅
├── members.tsx ✅
├── analytics.tsx ✅
└── billing.tsx ✅
```

## Screen Organization by User Flow

### 1. Guest/Unauthenticated Flow
```
Landing → Login/Register → Email Verification → Profile Completion → Home
```

**Screens Required:**
- `/` - Landing page ✅
- `/(auth)/login` - Login screen ✅
- `/(auth)/register` - Registration screen ✅
- `/(auth)/forgot-password` - Password reset ✅
- `/(auth)/verify-email` - Email verification ✅
- `/(auth)/complete-profile` - Profile completion ✅

### 2. Authenticated User Flows

#### 2.1 General User Flow
```
Home Dashboard → Explore Features → View Profile → Settings
```

**Screens:**
- `/(home)/` - Home dashboard (role-based content)
- `/(home)/explore` - Feature discovery
- `/(home)/settings` - User settings
- `/(modals)/profile-edit` - Edit profile (modal)

#### 2.2 Healthcare Flow (Hospital Alert System)
```
Operator Dashboard → Create Alert → Monitor Status
Medical Staff → Receive Alert → Acknowledge → View Patient Details
```

**Screens:**
- `/(home)/operator-dashboard` - Operator alert creation ✅
- `/(home)/healthcare-dashboard` - Medical staff dashboard ✅
- `/(modals)/create-alert` - Create new alert (modal) ✅
- `/(modals)/patient-details` - Patient info (modal) ✅
- `/(healthcare)/alerts` - Alert management ✅
- `/(healthcare)/patients` - Patient list ✅

#### 2.3 Organization Flow
```
Organization Dashboard → Manage Members → Settings → Analytics
```

**Screens:**
- `/(home)/organization-dashboard` - Org overview
- `/(home)/organization-settings` - Org settings
- `/(home)/create-organization` - Create new org
- `/(modals)/member-details` - Member info (modal)
- `/(organization)/members` - Member list (NEW)
- `/(organization)/analytics` - Org analytics (NEW)
- `/(organization)/billing` - Billing management (NEW)

#### 2.4 Admin Flow
```
Admin Dashboard → User Management → System Settings → Audit Logs
```

**Screens:**
- `/(home)/admin` - Admin dashboard
- `/(admin)/users` - User management (NEW)
- `/(admin)/system` - System settings (NEW)
- `/(admin)/audit` - Audit logs (NEW)

#### 2.5 Manager Flow
```
Manager Dashboard → Team Overview → Task Assignment → Reports
```

**Screens:**
- `/(home)/manager` - Manager dashboard
- `/(manager)/team` - Team management (NEW)
- `/(manager)/tasks` - Task management (NEW)
- `/(manager)/reports` - Team reports (NEW)

## Navigation Implementation Plan

### Phase 1: Core Navigation Structure
1. **Update Root Layout** (`app/_layout.tsx`)
   - Implement auth state checking
   - Add transition animations
   - Configure gesture handling

2. **Auth Stack Enhancement** (`app/(auth)/_layout.tsx`)
   - Add slide transitions between screens
   - Implement back gesture handling
   - Add loading states during navigation

3. **Tab Navigator Update** (`app/(home)/_layout.tsx`)
   - Implement tab switch animations
   - Add role-based tab visibility
   - Configure tab bar animations

### Phase 2: Screen Transitions

#### Stack Transitions
```typescript
// For auth stack - slide from right
animation: 'slide_from_right',
animationDuration: 300,
gestureEnabled: true,
gestureDirection: 'horizontal',
```

#### Modal Presentations
```typescript
// For modals - slide from bottom
presentation: 'modal',
animation: 'slide_from_bottom',
animationDuration: 400,
gestureEnabled: true,
gestureDirection: 'vertical',
```

#### Tab Transitions
```typescript
// For tabs - fade with scale
lazy: false,
animationEnabled: true,
tabBarShowLabel: true,
```

### Phase 3: Deep Linking Structure
```
myapp://
├── auth/
│   ├── login
│   ├── register
│   └── reset-password
├── home/
│   ├── dashboard
│   ├── explore
│   └── settings
├── organization/
│   ├── [id]/dashboard
│   ├── [id]/members
│   └── create
└── patient/[id]
```

### Phase 4: Navigation Helpers

Create navigation utility functions:
```typescript
// lib/navigation/helpers.ts
export const navigateToRole = (role: string) => {
  switch(role) {
    case 'admin': return router.push('/(home)/admin');
    case 'manager': return router.push('/(home)/manager');
    case 'healthcare': return router.push('/(home)/healthcare-dashboard');
    default: return router.push('/(home)');
  }
};

export const navigateToOrganization = (orgId: string) => {
  router.push(`/(organization)/${orgId}/dashboard`);
};
```

## Screen Components & Blocks

### 1. Home Dashboard (`/(home)/index.tsx`)
**Blocks to Include:**
- WelcomeHeader
- QuickActions (role-based)
- RecentActivity
- MetricsOverview (role-based)
- UpcomingTasks

### 2. Healthcare Dashboard
**Blocks to Include:**
- AlertSummaryBlock
- ActivePatientsBlock
- EscalationQueueBlock
- ShiftOverviewBlock
- QuickAlertCreation

### 3. Organization Dashboard
**Blocks to Include:**
- OrganizationOverviewBlock
- MemberManagementBlock
- OrganizationMetricsBlock
- QuickActionsBlock
- ActivityFeedBlock

### 4. Settings Screen
**Blocks to Include:**
- ProfileSection
- AppearanceSettings (theme, spacing)
- SecuritySettings
- NotificationSettings
- DataManagement
- AboutSection

## Animation Strategy

### 1. Page Transitions
- **Stack Navigation**: Slide from right (iOS), fade (Android)
- **Modal Navigation**: Slide from bottom with spring
- **Tab Navigation**: Fade with subtle scale

### 2. Shared Element Transitions
- Profile avatar from list to detail
- Card expansion from grid to full screen
- Chart zoom from dashboard to analytics

### 3. Gesture-Based Navigation
- Swipe back on iOS (stack navigation)
- Swipe down to dismiss modals
- Pull to refresh on scrollable screens

## Implementation Priorities

### High Priority (Week 1)
1. Fix current navigation structure
2. Implement missing screens (verify-email, etc.)
3. Add role-based navigation
4. Configure page transitions

### Medium Priority (Week 2)
1. Create modal screens
2. Implement deep linking
3. Add gesture handling
4. Create navigation helpers

### Low Priority (Week 3)
1. Shared element transitions
2. Advanced animations
3. Navigation persistence
4. Analytics tracking

## Best Practices

### 1. Navigation Patterns
- Use stack for linear flows (auth, wizards)
- Use tabs for main app sections
- Use modals for temporary tasks
- Use drawers for navigation menus (optional)

### 2. Performance
- Lazy load tab screens
- Preload critical screens
- Use navigation state persistence
- Optimize transition animations

### 3. Accessibility
- Provide screen reader labels
- Support keyboard navigation (web)
- Announce screen changes
- Maintain focus management

### 4. State Management
- Navigation state in Expo Router
- Screen params for data passing
- Global state for user/org context
- Local state for screen-specific data

## Next Steps

1. **Create Missing Screens**
   - Email verification screen
   - Healthcare/Organization/Admin sub-screens
   - Modal screens for quick actions

2. **Update Navigation Structure**
   - Implement proposed folder structure
   - Add navigation guards for auth/roles
   - Configure transitions

3. **Integrate Animation System**
   - Use lib/navigation/transitions
   - Add custom animations where needed
   - Test on all platforms

4. **Test User Flows**
   - Complete auth flow
   - Role-based dashboard access
   - Organization switching
   - Deep linking