import { StateCreator } from 'zustand';
import type { Store, ConfirmationDialogSlice } from '../types';

// Re-export types for convenience
export type {
  ConfirmationDialogConfig,
  ConfirmationDialogSlice
} from '../types';

export const createConfirmationDialogSlice: StateCreator<
  Store,
  [['zustand/devtools', never]],
  [],
  ConfirmationDialogSlice
> = (set, get) => ({
  // Initial state
  confirmationDialog: {
    isOpen: false,
    config: null,
    resolve: null
  },

  // Open the dialog and return a promise that resolves when user confirms/cancels
  openConfirmationDialog: (config) => {
    return new Promise<boolean>((resolve) => {
      set({
        confirmationDialog: {
          isOpen: true,
          config,
          resolve
        }
      });
    });
  },

  // Close the dialog and resolve the promise
  closeConfirmationDialog: (confirmed) => {
    const { confirmationDialog } = get();
    if (confirmationDialog.resolve) {
      confirmationDialog.resolve(confirmed);
    }
    set({
      confirmationDialog: {
        isOpen: false,
        config: null,
        resolve: null
      }
    });
  }
});
