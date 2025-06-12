/**
 * Compatibility hook for gradual migration from SpacingContext to Zustand store
 * This replaces the context-based useSpacing with store-based implementation
 */

import { useSpacingStore, useSpacing as useSpacingFromStore } from '@/lib/stores/spacing-store';

// Re-export the store-based hook with the same name
export const useSpacing = useSpacingFromStore;

// Also export a responsive helper for backward compatibility
export function useResponsive<T>(values: { compact: T; medium: T; large: T }): T {
  const { density } = useSpacingStore();
  return values[density];
}