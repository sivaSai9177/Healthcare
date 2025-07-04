#!/bin/bash

echo "🔐 Complete Auth Flow Test Guide"
echo "================================"
echo ""
echo "This guide will walk you through testing the complete auth flow:"
echo "1. Database reset"
echo "2. User registration"
echo "3. User login"
echo "4. Role-based navigation"
echo ""
echo "STEP 1: Reset Database"
echo "---------------------"
echo "Run: bun run db:local:reset"
echo "This will:"
echo "- Stop and remove existing containers"
echo "- Start fresh PostgreSQL and Redis"
echo ""
echo "STEP 2: Run Migrations"
echo "---------------------"
echo "Run: bun run db:migrate:local"
echo ""
echo "STEP 3: Setup Healthcare Demo (Optional)"
echo "---------------------------------------"
echo "Run: bun run healthcare:setup:local"
echo "This creates demo users for healthcare roles"
echo ""
echo "STEP 4: Start the App"
echo "--------------------"
echo "Run: bun dev"
echo ""
echo "STEP 5: Test Registration Flow"
echo "-----------------------------"
echo "1. You should see /(auth)/login screen"
echo "2. Click 'Don't have an account? Register'"
echo "3. Fill in registration form:"
echo "   - Name: Test User"
echo "   - Email: test@example.com"
echo "   - Select Role: User/Manager/Admin"
echo "   - Password: TestPassword123!"
echo "   - Accept Terms & Privacy"
echo "4. Click 'Create account'"
echo ""
echo "Expected Console Logs:"
echo "- [RegisterScreen] Component rendering"
echo "- [RegisterScreen] Form submitted with data"
echo "- [RegisterScreen] Sign up successful"
echo "- [RegisterScreen] Navigating to home"
echo ""
echo "STEP 6: Test Login Flow"
echo "----------------------"
echo "1. If logged out, navigate to login"
echo "2. Use credentials:"
echo "   - Email: test@example.com"
echo "   - Password: TestPassword123!"
echo "3. Click 'Login'"
echo ""
echo "Expected Console Logs:"
echo "- [LoginSimple] Component rendering"
echo "- [LoginSimple] Login successful"
echo "- [LoginSimple] Navigating to home"
echo "- [HomeScreen] Redirecting based on role"
echo ""
echo "STEP 7: Verify Navigation"
echo "------------------------"
echo "Based on user role:"
echo "- Operator/Doctor/Nurse → Healthcare Dashboard"
echo "- Admin → Admin Dashboard"
echo "- Manager → Manager Dashboard"
echo "- User → Home Dashboard"
echo ""
echo "Debug Panel Checks:"
echo "- Router tab: Shows navigation history"
echo "- Auth State: ✅ Authenticated"
echo "- User Role: Shows selected role"
echo ""
echo "Common Issues:"
echo "1. Registration fails: Check API is running on port 8081"
echo "2. Login screen not visible: Check theme (might be white on white)"
echo "3. Navigation stuck: Check Router tab for current route"
echo "4. Auth not persisting: Check Settings tab → Enable auth logging"
echo ""
echo "Healthcare Demo Users (if setup):"
echo "- johncena@gmail.com (operator)"
echo "- therock@gmail.com (doctor)"
echo "- undertaker@gmail.com (nurse)"
echo "- Password for all: password"