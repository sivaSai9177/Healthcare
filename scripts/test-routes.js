const { isValidRoute } = require('../lib/navigation/route-validator.ts');

// All routes that should be valid
const routesToTest = [
  // Public routes
  '/auth/login',
  '/auth/register',
  '/auth/complete-profile',
  '/auth/forgot-password',
  '/auth/verify-email',
  
  // Main tabs
  '/home',
  '/alerts',
  '/alerts/escalation-queue',
  '/alerts/history',
  '/alerts/123', // Dynamic route
  '/patients',
  '/patients/456', // Dynamic route
  '/settings',
  '/settings/members',
  '/settings/invitations',
  '/settings/notifications',
  
  // Shifts
  '/shifts',
  '/shifts/schedule',
  '/shifts/handover',
  '/shifts/reports',
  
  // Analytics
  '/analytics/response-analytics',
  
  // Logs
  '/logs/activity-logs',
  
  // Admin
  '/admin/audit',
  '/admin/organizations',
  '/admin/system',
  '/admin/users',
  
  // Organization
  '/organization/dashboard',
  '/organization/settings',
  
  // Security
  '/security/2fa',
  '/security/change-password',
  
  // Other routes
  '/profile',
  '/support',
  
  // Modals
  '/create-alert',
  '/acknowledge-alert',
  '/alert-details',
  '/patient-details',
  '/register-patient',
  '/notification-center',
  '/search',
  '/invite-member',
  '/member-details',
  '/shift-management',
];

console.log('Testing all routes...\n');

let passed = 0;
let failed = 0;

routesToTest.forEach(route => {
  const isValid = isValidRoute(route);
  if (isValid) {
    console.log(`✅ ${route}`);
    passed++;
  } else {
    console.log(`❌ ${route}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}