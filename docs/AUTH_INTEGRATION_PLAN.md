# Auth Integration & Navigation Plan

## Phase 1: Backend Integration ✅

### 1.1 Review Current Auth API
- [x] Better Auth setup at `/app/api/auth/[...auth]+api.ts`
- [x] tRPC auth router integration
- [ ] Verify all auth endpoints are working:
  - [ ] `/api/auth/sign-in`
  - [ ] `/api/auth/sign-up`
  - [ ] `/api/auth/sign-out`
  - [ ] `/api/auth/reset-password`
  - [ ] `/api/auth/verify-email` (needs implementation)
  - [ ] `/api/auth/resend-verification` (needs implementation)

### 1.2 Missing API Endpoints
Need to implement in tRPC router:
```typescript
// server/api/routers/auth.ts
verifyEmail: publicProcedure
  .input(z.object({
    email: z.string().email(),
    code: z.string().length(6)
  }))
  .mutation(async ({ input }) => {
    // Verify OTP code
  }),

resendVerificationEmail: publicProcedure
  .input(z.object({
    email: z.string().email()
  }))
  .mutation(async ({ input }) => {
    // Resend verification email
  })
```

## Phase 2: Update Auth Screens

### 2.1 Replace Old Screens with New Blocks
- [ ] Rename current screens to `.old.tsx`
- [ ] Rename `.new.tsx` files to replace originals
- [ ] Test each screen individually

### 2.2 Update Imports in App
- [ ] Update `_layout.tsx` imports
- [ ] Update any direct screen references
- [ ] Ensure proper typing throughout

## Phase 3: Navigation Structure

### 3.1 Current App Structure
```
app/
├── (auth)/              # Public auth routes
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── verify-email.tsx
│   └── forgot-password.tsx
├── (home)/              # General authenticated routes
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── admin.tsx
│   └── manager.tsx
├── (healthcare)/        # Healthcare-specific routes
│   ├── _layout.tsx
│   ├── dashboard.tsx
│   └── alert-details.tsx
├── (organization)/      # Organization management
│   ├── _layout.tsx
│   └── settings.tsx
└── _layout.tsx          # Root layout with NavigationGuard
```

### 3.2 Navigation Updates Needed

1. **Update NavigationGuard** in `app/_layout.tsx`:
   - [ ] Improve auth state detection
   - [ ] Add loading states during navigation
   - [ ] Handle edge cases (network errors, etc.)

2. **Add Protected Route Wrapper**:
   ```typescript
   // components/navigation/ProtectedRoute.tsx
   export function ProtectedRoute({ 
     children, 
     requiredRole,
     requiredOrgRole 
   }) {
     // Check auth and redirect if needed
   }
   ```

3. **Update Tab Navigation**:
   - [ ] Show different tabs based on user role
   - [ ] Healthcare tabs for medical staff
   - [ ] Admin tabs for system admins
   - [ ] Organization tabs for managers

## Phase 4: Testing Checklist

### 4.1 Auth Flow Tests
- [ ] **Login Flow**
  - [ ] Valid credentials → Dashboard
  - [ ] Invalid credentials → Error message
  - [ ] Remember me functionality
  - [ ] Social login (Google)

- [ ] **Registration Flow**
  - [ ] Email validation
  - [ ] Password strength check
  - [ ] Role selection
  - [ ] Organization code/creation
  - [ ] Terms acceptance
  - [ ] Redirect to verify email

- [ ] **Email Verification**
  - [ ] Valid code → Dashboard/Profile
  - [ ] Invalid code → Error
  - [ ] Resend functionality
  - [ ] 60s cooldown timer

- [ ] **Password Reset**
  - [ ] Valid email → Success message
  - [ ] Invalid email → Generic success
  - [ ] Rate limiting

### 4.2 Navigation Tests
- [ ] **Unauthenticated User**
  - [ ] Can access auth screens
  - [ ] Cannot access protected routes
  - [ ] Redirected to login

- [ ] **Authenticated User**
  - [ ] Cannot access auth screens
  - [ ] Can access appropriate dashboard
  - [ ] Role-based route access

- [ ] **Special Cases**
  - [ ] Unverified email → Verify screen
  - [ ] Incomplete profile → Complete profile
  - [ ] Expired session → Login

## Phase 5: Mobile-Specific Considerations

### 5.1 iOS
- [ ] Test keyboard avoidance
- [ ] Test safe area handling
- [ ] Test gesture navigation
- [ ] Test biometric auth (future)

### 5.2 Android
- [ ] Test back button handling
- [ ] Test keyboard behavior
- [ ] Test deep linking
- [ ] Test app resume state

### 5.3 Web
- [ ] Test responsive layouts
- [ ] Test browser back/forward
- [ ] Test refresh handling
- [ ] Test OAuth redirects

## Implementation Order

1. **Day 1: Backend Integration**
   - Implement missing API endpoints
   - Test all auth endpoints
   - Fix any API issues

2. **Day 2: Screen Updates**
   - Replace auth screens with blocks
   - Test each screen flow
   - Fix any UI issues

3. **Day 3: Navigation**
   - Update NavigationGuard
   - Implement role-based navigation
   - Test all navigation paths

4. **Day 4: Testing & Polish**
   - Complete all test cases
   - Fix edge cases
   - Performance optimization

## Success Metrics

- [ ] All auth flows work end-to-end
- [ ] No console errors or warnings
- [ ] Smooth navigation transitions
- [ ] Proper error handling
- [ ] Loading states for all async operations
- [ ] Accessible on all platforms
- [ ] TypeScript fully typed
- [ ] 0 runtime errors

## Known Issues to Address

1. **API Issues**
   - `verifyEmail` endpoint missing
   - `resendVerificationEmail` endpoint missing
   - Need to check Better Auth email integration

2. **UI Issues**
   - Theme colors in auth screens need verification
   - Shadow styles may need platform-specific adjustments
   - Keyboard avoidance on some devices

3. **Navigation Issues**
   - Race condition in NavigationGuard
   - Flash of wrong screen during redirect
   - Deep linking not fully implemented

## Resources

- [Better Auth Docs](https://better-auth.com)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [tRPC Docs](https://trpc.io)
- [React Hook Form](https://react-hook-form.com)