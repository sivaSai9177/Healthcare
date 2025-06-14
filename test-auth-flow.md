# Auth Flow Test Checklist

## 1. Login Flow
- [ ] Navigate to login page
- [ ] Check if card wrapper is visible with shadow
- [ ] Verify Google sign-in button displays correctly
- [ ] Test email/password login with invalid credentials
- [ ] Test email/password login with valid credentials
- [ ] Verify haptic feedback on button press
- [ ] Check error handling and alerts

## 2. Registration Flow
- [ ] Navigate to register page
- [ ] Check if card wrapper is visible with shadow
- [ ] Verify Google sign-up button displays correctly
- [ ] Test form validation (email, password strength)
- [ ] Test successful registration
- [ ] Verify navigation to email verification

## 3. Email Verification Flow
- [ ] Check verification screen displays correctly
- [ ] Test resend code functionality
- [ ] Test invalid code entry
- [ ] Test successful verification

## 4. Forgot Password Flow
- [ ] Navigate to forgot password
- [ ] Check card wrapper and styling
- [ ] Test email submission
- [ ] Verify success message

## 5. Complete Profile Flow
- [ ] Verify profile completion screen appears for new users
- [ ] Test form fields and validation
- [ ] Test skip functionality
- [ ] Test successful profile completion

## 6. Google OAuth Flow
- [ ] Test Google sign-in button click
- [ ] Verify OAuth redirect handling
- [ ] Check session creation after OAuth
- [ ] Verify navigation after successful OAuth

## 7. Styling Verification
- [ ] Tailwind classes working on iOS and Web
- [ ] Card shadows visible
- [ ] Dark mode support
- [ ] Responsive design
- [ ] Consistent spacing

## 8. API Integration
- [ ] TRPC endpoints responding correctly
- [ ] Session management working
- [ ] Error responses handled properly
- [ ] Rate limiting working

## Test Credentials
- Email: test@example.com
- Password: Test123!