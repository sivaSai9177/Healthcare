import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
}

interface ToastState {
  toasts: Toast[];
  position: ToastPosition;
  maxToasts: number;
  
  // Actions
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setPosition: (position: ToastPosition) => void;
  setMaxToasts: (max: number) => void;
  
  // Helper methods
  showSuccess: (title: string, description?: string) => string;
  showError: (title: string, description?: string) => string;
  showWarning: (title: string, description?: string) => string;
  showInfo: (title: string, description?: string) => string;
}

let toastIdCounter = 0;

export const useToastStore = create<ToastState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        toasts: [],
        position: 'bottom',
        maxToasts: 3,
        
        addToast: (toast) => {
          const id = `toast-${Date.now()}-${++toastIdCounter}`;
          const newToast: Toast = {
            ...toast,
            id,
            duration: toast.duration ?? 4000,
          };
          
          set((state) => {
            // Add new toast
            state.toasts.push(newToast);
            
            // Remove oldest toasts if exceeding max
            while (state.toasts.length > state.maxToasts) {
              state.toasts.shift();
            }
          });
          
          // Auto dismiss if duration is set
          if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
              get().removeToast(id);
            }, newToast.duration);
          }
          
          return id;
        },
        
        removeToast: (id) => {
          set((state) => {
            const index = state.toasts.findIndex(t => t.id === id);
            if (index !== -1) {
              const toast = state.toasts[index];
              toast.onDismiss?.();
              state.toasts.splice(index, 1);
            }
          });
        },
        
        clearToasts: () => {
          set((state) => {
            state.toasts.forEach(toast => toast.onDismiss?.());
            state.toasts = [];
          });
        },
        
        setPosition: (position) => {
          set((state) => {
            state.position = position;
          });
        },
        
        setMaxToasts: (max) => {
          set((state) => {
            state.maxToasts = Math.max(1, max);
            // Remove excess toasts
            while (state.toasts.length > state.maxToasts) {
              state.toasts.shift();
            }
          });
        },
        
        // Helper methods
        showSuccess: (title, description) => {
          return get().addToast({
            type: 'success',
            title,
            description,
          });
        },
        
        showError: (title, description) => {
          return get().addToast({
            type: 'error',
            title,
            description,
            duration: 6000, // Errors stay longer
          });
        },
        
        showWarning: (title, description) => {
          return get().addToast({
            type: 'warning',
            title,
            description,
          });
        },
        
        showInfo: (title, description) => {
          return get().addToast({
            type: 'info',
            title,
            description,
          });
        },
      })),
    ),
    {
      name: 'toast-store',
    }
  )
);

// Convenience hooks
export const useToasts = () => useToastStore((state) => state.toasts);
export const useToastActions = () => useToastStore((state) => ({
  addToast: state.addToast,
  removeToast: state.removeToast,
  clearToasts: state.clearToasts,
  showSuccess: state.showSuccess,
  showError: state.showError,
  showWarning: state.showWarning,
  showInfo: state.showInfo,
}));