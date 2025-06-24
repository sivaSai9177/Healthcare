/**
 * Route Validator
 * Validates navigation routes to ensure they exist and are accessible
 */

export const VALID_ROUTES = [
  '/',
  '/home',
  '/alerts',
  '/alerts/escalation-queue',
  '/alerts/history',
  '/patients',
  '/settings',
  '/settings/notifications',
  '/settings/members',
  '/settings/invitations',
  '/auth/login',
  '/auth/register',
  '/auth/complete-profile',
  '/auth/forgot-password',
  '/auth/verify-email',
  '/create-alert',
  '/notification-center',
  '/invite-member',
  '/patient-details',
  '/register-patient',
  '/profile',
  '/shifts/handover',
  '/shifts/schedule',
  '/shifts/reports',
  '/shift-management',
  '/organization/dashboard',
  '/organization/settings',
  '/organization/create',
  '/organization/join',
  '/organization/browse',
  '/analytics/response-analytics',
  '/analytics/performance',
  '/analytics/trends',
  '/logs/activity-logs',
  '/logs/audit',
  '/docs',
  '/support',
  '/security/2fa',
  '/security/change-password',
] as const;

export type ValidRoute = typeof VALID_ROUTES[number];

/**
 * Check if a route is valid
 */
export function isValidRoute(route: string): boolean {
  // Check exact matches
  if (VALID_ROUTES.includes(route as ValidRoute)) {
    return true;
  }
  
  // Check dynamic routes
  if (route.match(/^\/alerts\/[a-zA-Z0-9-]+$/)) {
    return true; // Alert details route
  }
  
  if (route.match(/^\/patients\/[a-zA-Z0-9-]+$/)) {
    return true; // Patient details route
  }
  
  return false;
}

/**
 * Get all valid routes for a given prefix
 */
export function getRoutesForPrefix(prefix: string): ValidRoute[] {
  return VALID_ROUTES.filter(route => route.startsWith(prefix)) as ValidRoute[];
}

/**
 * Validate route parameters
 */
export function validateRouteParams(route: string, params?: Record<string, any>): boolean {
  // Alert routes require valid ID
  if (route === '/alerts/[id]' && params?.id) {
    return /^[a-zA-Z0-9-]+$/.test(params.id);
  }
  
  // Patient routes require valid ID
  if (route === '/patients/[id]' && params?.id) {
    return /^[a-zA-Z0-9-]+$/.test(params.id);
  }
  
  return true;
}

/**
 * Get the parent route for nested routes
 */
export function getParentRoute(route: string): string | null {
  const parts = route.split('/').filter(Boolean);
  if (parts.length <= 1) return null;
  
  parts.pop();
  return '/' + parts.join('/');
}

/**
 * Check if user has access to route based on role
 */
export function canAccessRoute(route: string, userRole?: string): boolean {
  // Public routes
  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/verify-email',
    '/auth/complete-profile',
  ];
  
  if (publicRoutes.includes(route)) {
    return true;
  }
  
  // Routes that require authentication
  if (!userRole) {
    return false;
  }
  
  // Admin-only routes
  const adminRoutes = [
    '/organization/settings',
    '/logs/audit',
    '/analytics/performance',
  ];
  
  if (adminRoutes.includes(route) && userRole !== 'admin') {
    return false;
  }
  
  // Healthcare-only routes
  const healthcareRoutes = [
    '/alerts',
    '/alerts/escalation-queue',
    '/alerts/history',
    '/patients',
    '/shifts/handover',
  ];
  
  const healthcareRoles = ['doctor', 'nurse', 'operator', 'head_doctor', 'head_nurse'];
  if (healthcareRoutes.some(r => route.startsWith(r)) && !healthcareRoles.includes(userRole)) {
    return false;
  }
  
  return true;
}

/**
 * Get breadcrumb trail for a route
 */
export function getBreadcrumbs(route: string): Array<{ label: string; href: string }> {
  const routeMap: Record<string, string> = {
    '/home': 'Home',
    '/alerts': 'Alerts',
    '/alerts/escalation-queue': 'Escalation Queue',
    '/alerts/history': 'Alert History',
    '/patients': 'Patients',
    '/settings': 'Settings',
    '/settings/notifications': 'Notifications',
    '/settings/members': 'Team Members',
    '/organization/dashboard': 'Organization',
    '/organization/settings': 'Organization Settings',
  };
  
  const parts = route.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; href: string }> = [
    { label: 'Home', href: '/home' },
  ];
  
  let currentPath = '';
  for (const part of parts) {
    currentPath += '/' + part;
    if (routeMap[currentPath]) {
      breadcrumbs.push({
        label: routeMap[currentPath],
        href: currentPath,
      });
    }
  }
  
  return breadcrumbs;
}