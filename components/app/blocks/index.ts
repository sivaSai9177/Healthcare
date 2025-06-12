/**
 * App Blocks - Modular, composable application-level components
 * These blocks combine universal components into functional units
 */

export * from './AppSidebarBlock';
export * from './NavigationBlock';
export * from './UserMenuBlock';
export * from './TeamSwitcherBlock';

// Re-export with namespacing to avoid conflicts
export * as HomeBlocks from './home';
export * as HealthcareBlocks from './healthcare';