import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../zustandStore';
import type { ConfirmationDialogConfig } from '../store/types';

/**
 * Hook to access and control the unified confirmation dialog.
 *
 * @example
 * ```tsx
 * const { showConfirmation } = useConfirmationDialog();
 *
 * // For delete operations
 * const handleDeleteRecord = async () => {
 *   const confirmed = await showConfirmation({
 *     title: 'Delete Record',
 *     message: 'Are you sure you want to delete this record? This action cannot be undone.',
 *     confirmText: 'Delete',
 *     variant: 'danger',
 *   });
 *
 *   if (confirmed) {
 *     await deleteRecord(recordId);
 *   }
 * };
 *
 * // For other confirmations
 * const handleReset = async () => {
 *   const confirmed = await showConfirmation({
 *     title: 'Reset Settings',
 *     message: 'Are you sure you want to reset all settings to defaults?',
 *     confirmText: 'Reset',
 *     variant: 'warning',
 *   });
 *
 *   if (confirmed) {
 *     resetSettings();
 *   }
 * };
 * ```
 */
export function useConfirmationDialog() {
  const {
    confirmationDialog,
    openConfirmationDialog,
    closeConfirmationDialog,
  } = useStore(
    useShallow((state) => ({
      confirmationDialog: state.confirmationDialog,
      openConfirmationDialog: state.openConfirmationDialog,
      closeConfirmationDialog: state.closeConfirmationDialog,
    }))
  );

  /**
   * Show a confirmation dialog and wait for user response.
   * Returns a promise that resolves to true if confirmed, false if cancelled.
   */
  const showConfirmation = useCallback(
    (config: ConfirmationDialogConfig): Promise<boolean> => {
      return openConfirmationDialog(config);
    },
    [openConfirmationDialog]
  );

  /**
   * Programmatically confirm the current dialog.
   */
  const handleConfirm = useCallback(() => {
    closeConfirmationDialog(true);
  }, [closeConfirmationDialog]);

  /**
   * Programmatically cancel/close the current dialog.
   */
  const handleCancel = useCallback(() => {
    closeConfirmationDialog(false);
  }, [closeConfirmationDialog]);

  return {
    /** Whether the dialog is currently open */
    isOpen: confirmationDialog.isOpen,
    /** Current dialog configuration */
    config: confirmationDialog.config,
    /** Show a confirmation dialog (returns promise) */
    showConfirmation,
    /** Confirm the current dialog */
    handleConfirm,
    /** Cancel the current dialog */
    handleCancel,
  };
}

// Convenience functions for common confirmation types
export const confirmationPresets = {
  deleteRecord: (recordName?: string): ConfirmationDialogConfig => ({
    title: 'Delete Record',
    message: recordName
      ? `Are you sure you want to delete "${recordName}"? This action cannot be undone.`
      : 'Are you sure you want to delete this record? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  }),

  deleteFilter: (filterName?: string): ConfirmationDialogConfig => ({
    title: 'Delete Filter',
    message: filterName
      ? `Are you sure you want to delete the filter "${filterName}"?`
      : 'Are you sure you want to delete this filter?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  }),

  deleteTemplate: (templateName?: string): ConfirmationDialogConfig => ({
    title: 'Delete Template',
    message: templateName
      ? `Are you sure you want to delete the template "${templateName}"?`
      : 'Are you sure you want to delete this template?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  }),

  deleteChart: (chartName?: string): ConfirmationDialogConfig => ({
    title: 'Delete Chart',
    message: chartName
      ? `Are you sure you want to delete the chart "${chartName}"?`
      : 'Are you sure you want to delete this chart?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  }),

  deleteQuery: (queryName?: string): ConfirmationDialogConfig => ({
    title: 'Delete Query',
    message: queryName
      ? `Are you sure you want to delete the query "${queryName}"?`
      : 'Are you sure you want to delete this query?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  }),

  deleteView: (viewName?: string): ConfirmationDialogConfig => ({
    title: 'Delete View',
    message: viewName
      ? `Are you sure you want to delete the view "${viewName}"?`
      : 'Are you sure you want to delete this view?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
  }),

  unsavedChanges: (): ConfirmationDialogConfig => ({
    title: 'Unsaved Changes',
    message: 'You have unsaved changes. Are you sure you want to leave without saving?',
    confirmText: 'Leave',
    cancelText: 'Stay',
    variant: 'warning',
  }),

  resetSettings: (): ConfirmationDialogConfig => ({
    title: 'Reset Settings',
    message: 'Are you sure you want to reset all settings to their defaults?',
    confirmText: 'Reset',
    cancelText: 'Cancel',
    variant: 'warning',
  }),
};

export default useConfirmationDialog;
