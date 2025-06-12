import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface DialogConfig {
  id: string;
  title?: string;
  description?: string;
  content?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
  type?: 'default' | 'danger' | 'warning';
  preventClose?: boolean;
}

interface DialogState {
  dialogs: DialogConfig[];
  baseZIndex: number;
  
  // Actions
  openDialog: (config: Omit<DialogConfig, 'id'>) => string;
  closeDialog: (id: string) => void;
  closeAllDialogs: () => void;
  updateDialog: (id: string, updates: Partial<DialogConfig>) => void;
  
  // Helper methods
  confirm: (title: string, description?: string) => Promise<boolean>;
  alert: (title: string, description?: string) => Promise<void>;
  prompt: (title: string, description?: string, defaultValue?: string) => Promise<string | null>;
  
  // Z-index management
  getZIndex: (id: string) => number;
}

let dialogIdCounter = 0;

export const useDialogStore = create<DialogState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        dialogs: [],
        baseZIndex: 1000,
        
        openDialog: (config) => {
          const id = `dialog-${Date.now()}-${++dialogIdCounter}`;
          const newDialog: DialogConfig = {
            ...config,
            id,
            showCancel: config.showCancel ?? true,
            type: config.type ?? 'default',
          };
          
          set((state) => {
            state.dialogs.push(newDialog);
          });
          
          return id;
        },
        
        closeDialog: (id) => {
          set((state) => {
            const index = state.dialogs.findIndex(d => d.id === id);
            if (index !== -1) {
              const dialog = state.dialogs[index];
              if (!dialog.preventClose) {
                dialog.onCancel?.();
                state.dialogs.splice(index, 1);
              }
            }
          });
        },
        
        closeAllDialogs: () => {
          set((state) => {
            state.dialogs = state.dialogs.filter(d => d.preventClose);
          });
        },
        
        updateDialog: (id, updates) => {
          set((state) => {
            const dialog = state.dialogs.find(d => d.id === id);
            if (dialog) {
              Object.assign(dialog, updates);
            }
          });
        },
        
        // Helper methods
        confirm: (title, description) => {
          return new Promise((resolve) => {
            const id = get().openDialog({
              title,
              description,
              confirmText: 'Confirm',
              cancelText: 'Cancel',
              onConfirm: () => {
                get().closeDialog(id);
                resolve(true);
              },
              onCancel: () => {
                get().closeDialog(id);
                resolve(false);
              },
            });
          });
        },
        
        alert: (title, description) => {
          return new Promise((resolve) => {
            const id = get().openDialog({
              title,
              description,
              confirmText: 'OK',
              showCancel: false,
              onConfirm: () => {
                get().closeDialog(id);
                resolve();
              },
            });
          });
        },
        
        prompt: (title, description, defaultValue) => {
          // This would require a custom dialog component with input
          // For now, return a simple implementation
          return new Promise<string | null>((resolve) => {
            const result = window.prompt(description || title, defaultValue);
            resolve(result);
          });
        },
        
        getZIndex: (id) => {
          const state = get();
          const index = state.dialogs.findIndex(d => d.id === id);
          return state.baseZIndex + (index + 1) * 10;
        },
      })),
    ),
    {
      name: 'dialog-store',
    }
  )
);

// Convenience hooks
export const useDialogs = () => useDialogStore((state) => state.dialogs);
export const useDialog = (id: string) => useDialogStore((state) => state.dialogs.find(d => d.id === id));
export const useDialogActions = () => useDialogStore((state) => ({
  openDialog: state.openDialog,
  closeDialog: state.closeDialog,
  closeAllDialogs: state.closeAllDialogs,
  updateDialog: state.updateDialog,
  confirm: state.confirm,
  alert: state.alert,
  prompt: state.prompt,
}));