/**
 * Root Components Barrel Export
 * Central export point for all component categories
 */

// Universal Design System Components (Primary)
// Export all universal components (includes charts)
export * from './universal';

// Healthcare Components
export * from './healthcare/AlertCreationForm';
export * from './healthcare/AlertDashboard';
export * from './healthcare/EscalationTimer';

// Organization Components
export * from './organization/OrganizationCreationWizard';

// Note: Shadcn UI components are available via './shadcn/ui' 
// but not re-exported here to avoid naming conflicts with universal components

// Navigation Components
export { AnimatedScreen } from './navigation/AnimatedScreen';
export { AnimatedTabBar } from './navigation/AnimatedTabBar';

// UI Components
export { PrimaryButton } from './ui/PrimaryButton';
export { default as TabBarBackground, useBottomTabOverflow } from './ui/TabBarBackground';
// ValidationIcon is now exported from universal components
export { IconSymbol } from './ui/IconSymbol';

// Themed Components
export { ThemedText } from './ThemedText';

// Application Components
export { DarkModeToggle } from './DarkModeToggle';
export { EnhancedDebugPanel } from './EnhancedDebugPanel';
export { ErrorBoundary } from './ErrorBoundary';
export { GoogleSignInButton } from './GoogleSignInButton';
export { HapticTab } from './HapticTab';
export { LoadingView } from './LoadingView';
export { MobileDebugger } from './MobileDebugger';
export { OrganizationField } from './OrganizationField';
export { ProfileCompletionFlowEnhanced } from './ProfileCompletionFlowEnhanced';
export { ProtectedRoute } from './ProtectedRoute';
export { RoleSelector } from './RoleSelector';
export { SimpleMobileDebugger } from './SimpleMobileDebugger';
export { SpacingDensitySelector } from './SpacingDensitySelector';
export { SyncProvider } from './SyncProvider';
export { TanStackDebugInfo } from './TanStackDebugInfo';
export { ThemeSelector } from './ThemeSelector';
export { WebNavBar } from './WebNavBar';
export { WebTabBar } from './WebTabBar';

// App Blocks - Modular application components
export * from './app/blocks/AppSidebarBlock';
export * from './app/blocks/NavigationBlock';
export * from './app/blocks/UserMenuBlock';
export * from './app/blocks/TeamSwitcherBlock';

// Optimized Components
export { default as OptimizedHomeScreen } from './optimized/OptimizedHomeScreen';

// Re-export component types
export type * from '@/types/components';