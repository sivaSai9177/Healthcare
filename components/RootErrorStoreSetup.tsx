import { useGlobalErrorStore } from '@/hooks/healthcare/useGlobalErrorStore';

/**
 * Component to set up global error store at the root level
 * This ensures TRPC can access error handlers
 */
export function RootErrorStoreSetup() {
  useGlobalErrorStore();
  return null;
}