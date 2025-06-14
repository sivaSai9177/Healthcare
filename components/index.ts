/**
 * Components Barrel Export
 * 
 * Organization:
 * 1. Universal Design System (./universal)
 * 2. Feature Blocks (./blocks)
 * 3. Providers
 * 4. UI Utilities
 */

// ============================================
// 1. Universal Design System Components
// ============================================
// Re-export all 60+ universal components
export * from './universal';

// ============================================
// 2. Feature Blocks (Self-contained components)
// ============================================

// Auth Blocks
export { GoogleSignIn, useGoogleSignIn } from './blocks/auth/GoogleSignIn';
export { ProfileCompletionFlowEnhanced } from './blocks/auth/ProfileCompletion/ProfileCompletionFlowEnhanced';
export { ProtectedRoute } from './blocks/auth/ProtectedRoute';

// Dashboard Blocks
export { MetricsOverviewBlock as DashboardMetricsOverview } from './blocks/dashboard/MetricsOverview';
export { QuickActionsBlock as DashboardQuickActions } from './blocks/dashboard/QuickActions';
export { WelcomeHeaderBlock } from './blocks/dashboard/WelcomeHeader';

// Healthcare Blocks
export * from './blocks/healthcare/ActivePatients';
export * from './blocks/healthcare/AlertCreationForm';
export * from './blocks/healthcare/AlertList';
export * from './blocks/healthcare/AlertSummary';
export * from './blocks/healthcare/AlertTimeline';
export * from './blocks/healthcare/EscalationTimer';
export * from './blocks/healthcare/AlertItem';
export * from './blocks/healthcare/AlertFilters';
export * from './blocks/healthcare/AlertActions';
export { MetricsOverviewBlock as HealthcareMetricsOverview } from './blocks/healthcare/MetricsOverview';
export * from './blocks/healthcare/PatientCard';

// Organization Blocks  
export * from './blocks/organization/GeneralSettings';
export * from './blocks/organization/MemberManagement';
export * from './blocks/organization/OrganizationMetrics';
export * from './blocks/organization/OrganizationOverview';
export { QuickActionsBlock as OrganizationQuickActions } from './blocks/organization/QuickActions';
export { OrganizationCreationWizard as OrganizationCreation } from './blocks/organization/OrganizationCreationWizard';

// Navigation Blocks
export * from './blocks/navigation/AppSidebar';
export * from './blocks/navigation/Navigation';
export * from './blocks/navigation/TeamSwitcher';
export * from './blocks/navigation/UserMenu';

// Form Blocks
export { OrganizationField } from './blocks/forms/OrganizationField/OrganizationField';
export { RoleSelector } from './blocks/forms/RoleSelector/RoleSelector';

// Theme Blocks
export { DarkModeToggle } from './blocks/theme/DarkModeToggle/DarkModeToggle';
export { ThemeSelector } from './blocks/theme/ThemeSelector/ThemeSelector';
export { SpacingDensitySelector } from './blocks/theme/DensitySelector/SpacingDensitySelector';

// Debug Blocks - Consolidated
export { DebugPanel } from './blocks/debug/DebugPanel';

// Navigation Components
export { AnimatedScreen } from './navigation/AnimatedScreen';
export { AnimatedTabBar } from './navigation/AnimatedTabBar';
export { AnimatedTabBar as AnimatedTabBarCustom, AnimatedTabContent } from './navigation/AnimatedTabs';
export { WebNavBar } from './navigation/WebNavBar';
export { WebTabBar } from './navigation/WebTabBar';

// Layout Components
export { AnimatedLayout, PageContainer, StaggeredList } from './layout/AnimatedLayout';

// ============================================
// 3. Providers
// ============================================
export { ErrorBoundary } from './providers/ErrorBoundary';
export { SyncProvider } from './providers/SyncProvider';

// ============================================
// 4. UI Utilities
// ============================================
export { default as TabBarBackground, useBottomTabOverflow } from './universal/navigation/TabBarBackground';

// ============================================
// Legacy Exports (for backward compatibility)
// ============================================
// These will be removed in next major version
export { GoogleSignIn as GoogleSignInButton } from './blocks/auth/GoogleSignIn';
export { ProfileCompletionFlowEnhanced as ProfileCompletion } from './blocks/auth/ProfileCompletion/ProfileCompletionFlowEnhanced';
export { OrganizationField as OrganizationFieldBlock } from './blocks/forms/OrganizationField/OrganizationField';
export { RoleSelector as RoleSelectorBlock } from './blocks/forms/RoleSelector/RoleSelector';
export { DarkModeToggle as DarkModeToggleBlock } from './blocks/theme/DarkModeToggle/DarkModeToggle';
export { ThemeSelector as ThemeSelectorBlock } from './blocks/theme/ThemeSelector/ThemeSelector';
export { SpacingDensitySelector as DensitySelector } from './blocks/theme/DensitySelector/SpacingDensitySelector';
// Debug utilities
export { debugLog } from './blocks/debug/DebugPanel';
export type { LogLevel, DebugLog } from './blocks/debug/DebugPanel';

// ============================================
// Type Exports
// ============================================
// export type * from './types'; // Uncomment when types are available

/**
 * Component Structure:
 * 
 * Universal (60+):
 * - Core UI components (Button, Card, Input, etc.)
 * - Charts (6 components)
 * - Fully cross-platform
 * 
 * Blocks:
 * - Self-contained features
 * - Include their own hooks and state
 * - Can be composed together
 * 
 * Providers:
 * - Global app providers
 * - Error boundaries
 * 
 * UI Utilities:
 * - Platform-specific components
 * - Themed components
 */