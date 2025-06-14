/**
 * Healthcare Blocks
 * 
 * All healthcare-related block components for the hospital alert system.
 * These blocks are fully migrated to the new design system with:
 * - Tailwind/NativeWind styling
 * - Semantic color variants (no hardcoded colors)
 * - useShadow hook for platform-aware shadows
 * - useSpacing hook for density-aware spacing
 * - useResponsive hooks for adaptive layouts
 * - Animation hooks for smooth interactions
 * - Haptic feedback on user interactions
 */

// Alert Management Components
export { AlertCreationForm } from './AlertCreationForm';
export { AlertList } from './AlertList';
export { AlertSummary } from './AlertSummary';
export { AlertTimeline } from './AlertTimeline';
export { AlertItem } from './AlertItem';
export { AlertFilters } from './AlertFilters';
export { AlertActions } from './AlertActions';

// Alert Support Components
export { EscalationTimer } from './EscalationTimer';

// Patient Management Components
export { ActivePatients } from './ActivePatients';
export { PatientCardBlock as PatientCard } from './PatientCard';

// Metrics & Analytics
export { MetricsOverviewBlock as MetricsOverview } from './MetricsOverview';

// Type exports for better type safety
export type { AlertSummaryBlockProps } from './AlertSummary';