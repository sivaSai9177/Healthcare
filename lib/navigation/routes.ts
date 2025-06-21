/**
 * Centralized routing configuration
 * Type-safe navigation with proper route definitions
 */

export const ROUTES = {
  // Auth routes
  auth: {
    login: '/(public)/auth/login' as const,
    register: '/(public)/auth/register' as const,
    forgotPassword: '/(public)/auth/forgot-password' as const,
    verifyEmail: '/(public)/auth/verify-email' as const,
    completeProfile: '/(public)/auth/complete-profile' as const,
  },
  
  // Main app tabs
  tabs: {
    home: '/(app)/(tabs)/home' as const,
    alerts: {
      index: '/(app)/(tabs)/alerts' as const,
      detail: (id: string) => `/(app)/(tabs)/alerts/${id}` as const,
    },
    patients: '/(app)/(tabs)/patients' as const,
    settings: {
      index: '/(app)/(tabs)/settings' as const,
      members: '/(app)/(tabs)/settings/members' as const,
      invitations: '/(app)/(tabs)/settings/invitations' as const,
    },
  },
  
  // Healthcare specific routes
  healthcare: {
    alerts: {
      list: '/(app)/(tabs)/alerts' as const,
      detail: (id: string) => `/(app)/(tabs)/alerts/${id}` as const,
      history: '/(app)/alerts/history' as const,
      escalationQueue: '/(app)/alerts/escalation-queue' as const,
    },
    patients: {
      list: '/(app)/(tabs)/patients' as const,
      detail: (id: string) => `/(app)/patients/${id}` as const,
      vitals: (id: string) => `/(app)/patients/${id}/vitals` as const,
      medications: (id: string) => `/(app)/patients/${id}/medications` as const,
      notes: (id: string) => `/(app)/patients/${id}/notes` as const,
    },
    shifts: {
      handover: '/(app)/shifts/handover' as const,
      schedule: '/(app)/shifts/schedule' as const,
      history: '/(app)/shifts/history' as const,
    },
    analytics: {
      response: '/(app)/(tabs)/response-analytics' as const,
      performance: '/(app)/analytics/performance' as const,
      trends: '/(app)/analytics/trends' as const,
    },
    logs: {
      activity: '/(app)/(tabs)/activity-logs' as const,
      audit: '/(app)/admin/audit' as const,
    },
  },
  
  // Organization routes
  organization: {
    dashboard: '/(app)/organization/dashboard' as const,
    settings: '/(app)/organization/settings' as const,
    members: '/(app)/(tabs)/settings/members' as const,
    billing: '/(app)/organization/billing' as const,
  },
  
  // Admin routes
  admin: {
    users: '/(app)/admin/users' as const,
    organizations: '/(app)/admin/organizations' as const,
    system: '/(app)/admin/system' as const,
    audit: '/(app)/admin/audit' as const,
  },
  
  // Modal routes
  modals: {
    createAlert: '/(modals)/create-alert' as const,
    alertDetails: (id: string) => `/(modals)/alert-details?alertId=${id}` as const,
    patientDetails: (id: string) => `/(modals)/patient-details?patientId=${id}` as const,
    acknowledgeAlert: (id: string) => `/(modals)/acknowledge-alert?alertId=${id}` as const,
    // hospitalSelection: '/(modals)/hospital-selection' as const, // Removed - hospital selection is now optional
    inviteMember: '/(modals)/invite-member' as const,
  },
  
  // Profile & Security
  profile: {
    index: '/(app)/profile' as const,
    security: {
      changePassword: '/(app)/security/change-password' as const,
      twoFactor: '/(app)/security/2fa' as const,
    },
  },
  
  // Support
  support: '/(app)/support' as const,
  
  // Other routes
  authCallback: '/auth-callback' as const,
  index: '/' as const,
  
  // Route groupings for easier access
  PUBLIC: {
    login: '/(public)/auth/login' as const,
    register: '/(public)/auth/register' as const,
    forgotPassword: '/(public)/auth/forgot-password' as const,
    verifyEmail: '/(public)/auth/verify-email' as const,
    completeProfile: '/(public)/auth/complete-profile' as const,
    index: '/' as const,
  },
  
  APP: {
    home: '/(app)/(tabs)/home' as const,
    alerts: '/(app)/(tabs)/alerts' as const,
    patients: '/(app)/(tabs)/patients' as const,
    settings: '/(app)/(tabs)/settings' as const,
    profile: '/(app)/profile' as const,
  },
} as const;

// Legacy aliases for backward compatibility
export const ROUTES_LEGACY = {
  PUBLIC: {
    LOGIN: ROUTES.auth.login,
    REGISTER: ROUTES.auth.register,
    FORGOT_PASSWORD: ROUTES.auth.forgotPassword,
    VERIFY_EMAIL: ROUTES.auth.verifyEmail,
    COMPLETE_PROFILE: ROUTES.auth.completeProfile,
  },
  APP: {
    HOME: ROUTES.tabs.home,
    ALERTS: ROUTES.tabs.alerts.index,
    ALERT_DETAILS: ROUTES.tabs.alerts.detail,
    PATIENTS: ROUTES.tabs.patients,
    SETTINGS: ROUTES.tabs.settings.index,
    PROFILE: ROUTES.profile.index,
    ADMIN: {
      USERS: ROUTES.admin.users,
      SYSTEM: ROUTES.admin.system,
      AUDIT: ROUTES.admin.audit,
      ORGANIZATIONS: ROUTES.admin.organizations,
    },
    ORGANIZATION: {
      DASHBOARD: ROUTES.organization.dashboard,
      SETTINGS: ROUTES.organization.settings,
    },
  },
  MODALS: {
    CREATE_ALERT: ROUTES.modals.createAlert,
    ALERT_DETAILS: ROUTES.modals.alertDetails,
    PATIENT_DETAILS: ROUTES.modals.patientDetails,
    INVITE_MEMBER: ROUTES.modals.inviteMember,
  },
  AUTH_CALLBACK: ROUTES.authCallback,
  INDEX: ROUTES.index,
} as const;

// Type-safe route helpers
export function getLoginRoute(returnTo?: string): string {
  if (returnTo) {
    return `${ROUTES.auth.login}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return ROUTES.auth.login;
}

export function getAlertDetailsRoute(id: string): string {
  return ROUTES.tabs.alerts.detail(id);
}

// Navigation helpers
export const navigation = {
  // Navigate to alert detail
  goToAlertDetail: (id: string) => ROUTES.tabs.alerts.detail(id),
  
  // Navigate to patient detail
  goToPatientDetail: (id: string) => ROUTES.healthcare.patients.detail(id),
  
  // Navigate to patient vitals
  goToPatientVitals: (id: string) => ROUTES.healthcare.patients.vitals(id),
  
  // Open modal
  openAlertModal: (id: string) => ROUTES.modals.alertDetails(id),
  openPatientModal: (id: string) => ROUTES.modals.patientDetails(id),
  
  // Auth navigation
  goToLogin: () => ROUTES.auth.login,
  goToRegister: () => ROUTES.auth.register,
  goToHome: () => ROUTES.tabs.home,
};

// Page transition configurations
export const PAGE_TRANSITIONS = {
  // Slide transitions
  slide: {
    animation: 'slide-from-right',
    animationDuration: 300,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
  },
  
  // Modal transitions
  modal: {
    animation: 'slide-from-bottom',
    animationDuration: 400,
    gestureEnabled: true,
    gestureDirection: 'vertical',
    presentation: 'modal' as const,
  },
  
  // Fade transitions
  fade: {
    animation: 'fade',
    animationDuration: 200,
  },
  
  // iOS-style transitions
  ios: {
    animation: 'ios',
    animationDuration: 350,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
  },
} as const;

// Navigation options for different screen types
export const SCREEN_OPTIONS = {
  // Main screens
  main: {
    headerShown: true,
    ...PAGE_TRANSITIONS.ios,
  },
  
  // Modal screens
  modal: {
    headerShown: true,
    ...PAGE_TRANSITIONS.modal,
  },
  
  // Tab screens
  tab: {
    headerShown: false,
    ...PAGE_TRANSITIONS.fade,
  },
  
  // Auth screens
  auth: {
    headerShown: false,
    ...PAGE_TRANSITIONS.fade,
  },
} as const;