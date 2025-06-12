/**
 * Healthcare Components Barrel Export
 * Central export point for all healthcare-related components
 */

// Main Healthcare Components
export { AlertCreationForm } from './AlertCreationForm';
export { AlertDashboard } from './AlertDashboard';
export { EscalationTimer } from './EscalationTimer';

// Healthcare Blocks
export * from './blocks';

// Type exports
export type {
  Alert,
  AlertFormData,
  AlertWithRelations,
} from '@/types/healthcare';