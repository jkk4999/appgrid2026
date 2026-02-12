/**
 * Unified Dialog State Hook
 *
 * This hook provides access to dialog-related state using a context parameter
 * instead of separate main/subgrid hooks.
 *
 * @example
 * // In main grid component
 * const { showDeleteRecordDialog, setShowDeleteRecordDialog } = useGridDialogState('main');
 *
 * // In subgrid component
 * const { showDeleteRecordDialog, setShowDeleteRecordDialog } = useGridDialogState('subgrid');
 */

import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore';
import type { GridContext, DialogStateWithActions } from './types';

/**
 * Creates a selector function for dialog state based on context.
 */
const createDialogSelector = (context: GridContext) => (state: any): DialogStateWithActions => {
  if (context === 'main') {
    return {
      showDeleteRecordDialog: state.showDeleteRecordDialog,
      setShowDeleteRecordDialog: state.setShowDeleteRecordDialog,
      showEditDialog: state.showGridEditDialog,
      setShowEditDialog: state.setShowGridEditDialog,
      showCreateFilterDialog: state.showCreateFilterDialog,
      setShowCreateFilterDialog: state.setShowCreateFilterDialog,
      showDeleteFilterDialog: state.showDeleteFilterDialog,
      setShowDeleteFilterDialog: state.setShowDeleteFilterDialog,
      showCreateTemplateDialog: state.showCreateTemplateDialog,
      setShowCreateTemplateDialog: state.setShowCreateTemplateDialog,
      showDeleteTemplateDialog: state.showDeleteTemplateDialog,
      setShowDeleteTemplateDialog: state.setShowDeleteTemplateDialog,
    };
  }
  // Subgrid context
  return {
    showDeleteRecordDialog: state.showSubgridDeleteRecordDialog,
    setShowDeleteRecordDialog: state.setShowSubgridDeleteRecordDialog,
    showEditDialog: state.showSubgridEditDialog,
    setShowEditDialog: state.setShowSubgridEditDialog,
    showCreateFilterDialog: state.showSubgridCreateFilterDialog,
    setShowCreateFilterDialog: state.setShowSubgridCreateFilterDialog,
    showDeleteFilterDialog: state.showSubgridDeleteFilterDialog,
    setShowDeleteFilterDialog: state.setShowSubgridDeleteFilterDialog,
    showCreateTemplateDialog: state.showSubgridCreateTemplateDialog,
    setShowCreateTemplateDialog: state.setShowSubgridCreateTemplateDialog,
    showDeleteTemplateDialog: state.showSubgridDeleteTemplateDialog,
    setShowDeleteTemplateDialog: state.setShowSubgridDeleteTemplateDialog,
  };
};

// Pre-created selectors for each context to ensure referential stability
const mainDialogSelector = createDialogSelector('main');
const subgridDialogSelector = createDialogSelector('subgrid');

/**
 * Unified hook for dialog-related state.
 *
 * @param context - The grid context ('main' or 'subgrid')
 * @returns Dialog state and setters with consistent property names
 */
export function useGridDialogState(context: GridContext): DialogStateWithActions {
  const selector = context === 'main' ? mainDialogSelector : subgridDialogSelector;
  return useStore(useShallow(selector));
}

export default useGridDialogState;
