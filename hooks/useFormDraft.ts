import { useEffect, useRef, useCallback, useState } from 'react';
import { UseFormWatch, UseFormReset, FieldValues } from 'react-hook-form';
import { draftStorage } from '@/lib/storage/draft-storage';
import { logger } from '@/lib/core/debug/unified-logger';
import { useAuth } from '@/hooks/useAuth';
import { showAlert } from '@/lib/core/alert';
import { debounce } from '@/lib/core/utils/debounce';

interface UseFormDraftOptions<T extends FieldValues> {
  /**
   * Unique key for this form's draft
   */
  formKey: string;
  
  /**
   * react-hook-form watch function
   */
  watch: UseFormWatch<T>;
  
  /**
   * react-hook-form reset function
   */
  reset: UseFormReset<T>;
  
  /**
   * Fields to exclude from draft (e.g., passwords)
   */
  excludeFields?: (keyof T)[];
  
  /**
   * Auto-save delay in milliseconds (default: 1000ms)
   */
  autoSaveDelay?: number;
  
  /**
   * Whether to show notification when draft is restored
   */
  showRestoreNotification?: boolean;
  
  /**
   * Callback when draft is restored
   */
  onDraftRestored?: (data: T) => void;
}

/**
 * Hook for persisting form drafts to AsyncStorage/localStorage
 * Automatically saves form data as user types and restores on mount
 */
export function useFormDraft<T extends FieldValues>({
  formKey,
  watch,
  reset,
  excludeFields = [],
  autoSaveDelay = 1000,
  showRestoreNotification = true,
  onDraftRestored,
}: UseFormDraftOptions<T>) {
  const { user } = useAuth();
  const [draftAge, setDraftAge] = useState<number | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const isMountedRef = useRef(true);
  const hasRestoredRef = useRef(false);
  
  // Create user-specific draft key
  const draftKey = user ? `${user.id}:${formKey}` : formKey;
  
  // Watch form values
  const watchedValues = watch();
  
  // Filter out excluded fields
  const getFilteredData = useCallback((data: T): Partial<T> => {
    const filtered = { ...data };
    excludeFields.forEach(field => {
      delete filtered[field];
    });
    return filtered;
  }, [excludeFields]);
  
  // Save draft function with debouncing
  const saveDraftDebounced = useRef(
    debounce(async (data: T) => {
      if (!isMountedRef.current) return;
      
      const filteredData = getFilteredData(data);
      
      // Don't save empty forms
      const hasData = Object.values(filteredData).some(
        value => value !== undefined && value !== '' && value !== null
      );
      
      if (hasData) {
        await draftStorage.saveDraft(draftKey, filteredData);
        logger.healthcare.debug('Form draft saved', { 
          formKey, 
          fields: Object.keys(filteredData).length 
        });
      }
    }, autoSaveDelay)
  ).current;
  
  // Save draft
  const saveDraft = useCallback(async () => {
    await saveDraftDebounced(watchedValues);
  }, [watchedValues, saveDraftDebounced]);
  
  // Clear draft
  const clearDraft = useCallback(async () => {
    await draftStorage.removeDraft(draftKey);
    logger.healthcare.debug('Form draft cleared', { formKey });
  }, [draftKey, formKey]);
  
  // Restore draft on mount
  useEffect(() => {
    const restoreDraft = async () => {
      // Only restore once per mount
      if (hasRestoredRef.current) return;
      hasRestoredRef.current = true;
      
      setIsRestoring(true);
      try {
        const draft = await draftStorage.loadDraft<Partial<T>>(draftKey);
        
        if (draft && Object.keys(draft).length > 0) {
          // Get draft age
          const age = await draftStorage.getDraftAge(draftKey);
          setDraftAge(age);
          
          // Reset form with draft data
          reset(draft as T);
          
          logger.healthcare.info('Form draft restored', { 
            formKey, 
            fields: Object.keys(draft).length,
            ageMinutes: age 
          });
          
          // Show notification
          if (showRestoreNotification && age !== null) {
            const ageText = age < 60 
              ? `${age} minute${age !== 1 ? 's' : ''} ago`
              : `${Math.floor(age / 60)} hour${Math.floor(age / 60) !== 1 ? 's' : ''} ago`;
              
            showAlert({
              title: 'Draft Restored',
              description: `We found a draft from ${ageText}. You can continue where you left off.`,
              variant: 'success',
            });
          }
          
          // Call callback
          onDraftRestored?.(draft as T);
        }
      } catch (error) {
        logger.healthcare.error('Failed to restore draft', { 
          formKey, 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      } finally {
        setIsRestoring(false);
      }
    };
    
    restoreDraft();
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
      saveDraftDebounced.cancel();
    };
  }, [draftKey, formKey, reset, showRestoreNotification, onDraftRestored, saveDraftDebounced]);
  
  // Auto-save draft when form values change
  useEffect(() => {
    // Don't auto-save while restoring
    if (isRestoring) return;
    
    // Don't save on first render
    if (!hasRestoredRef.current) return;
    
    saveDraft();
  }, [watchedValues, saveDraft, isRestoring]);
  
  return {
    /**
     * Manually save the current draft
     */
    saveDraft,
    
    /**
     * Clear the saved draft
     */
    clearDraft,
    
    /**
     * Age of the restored draft in minutes
     */
    draftAge,
    
    /**
     * Whether draft is currently being restored
     */
    isRestoring,
  };
}

/**
 * Hook to clear all drafts (useful for logout)
 */
export function useClearAllDrafts() {
  const clearAllDrafts = useCallback(async () => {
    await draftStorage.clearAllDrafts();
    logger.healthcare.info('All form drafts cleared');
  }, []);
  
  return clearAllDrafts;
}