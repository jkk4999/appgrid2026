/**
 * Dialog State Hooks
 *
 * Provides hooks for accessing dialog visibility state with automatic
 * main/subgrid context handling.
 */

import { createContextHooks, createSimpleHook } from './createSelector';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Return type for useDialogState hook */
export interface DialogStateReturn {
  showDeleteRecordDialog: boolean;
  setShowDeleteRecordDialog: (show: boolean) => void;
  showEditDialog: boolean;
  setShowEditDialog: (show: boolean) => void;
  showCreateFilterDialog: boolean;
  setShowCreateFilterDialog: (show: boolean) => void;
  showDeleteFilterDialog: boolean;
  setShowDeleteFilterDialog: (show: boolean) => void;
  showCreateTemplateDialog: boolean;
  setShowCreateTemplateDialog: (show: boolean) => void;
  showDeleteTemplateDialog: boolean;
  setShowDeleteTemplateDialog: (show: boolean) => void;
}

// ============================================================
// CONTEXT-AWARE HOOKS (main vs subgrid)
// ============================================================

const dialogHooks = createContextHooks<DialogStateReturn>({
  showDeleteRecordDialog: { main: 'showDeleteRecordDialog', subgrid: 'showSubgridDeleteRecordDialog' },
  showEditDialog: { main: 'showGridEditDialog', subgrid: 'showSubgridEditDialog' },
  showCreateFilterDialog: { main: 'showCreateFilterDialog', subgrid: 'showSubgridCreateFilterDialog' },
  showDeleteFilterDialog: { main: 'showDeleteFilterDialog', subgrid: 'showSubgridDeleteFilterDialog' },
  showCreateTemplateDialog: { main: 'showCreateTemplateDialog', subgrid: 'showSubgridCreateTemplateDialog' },
  showDeleteTemplateDialog: { main: 'showDeleteTemplateDialog', subgrid: 'showSubgridDeleteTemplateDialog' },
});

/** Hook for dialog state - pass 'main' or 'subgrid' context */
export const useDialogState = dialogHooks.useHook;

/** Hook for main grid dialog state */
export const useMainDialogState = dialogHooks.useMainHook;

/** Hook for subgrid dialog state */
export const useSubgridDialogState = dialogHooks.useSubgridHook;

// ============================================================
// SHARED HOOKS (same for main and subgrid)
// ============================================================

/** Hook for shared dialog state (not context-specific) */
export const useSharedDialogState = createSimpleHook([
  'showDeleteViewDialog',
  'showCloneViewDialog',
  'showSaveViewDialog',
  'showApexCodeViewerDialog',
]);

export default useDialogState;
