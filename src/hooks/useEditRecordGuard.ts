import type { GridApi } from 'ag-grid-community';

export interface UseEditRecordGuardOptions {
  getGridApi: () => GridApi | null | undefined;
  // guard should perform the permissions check for 'edit' and return allowed/message
  guard: () => { allowed: boolean; message?: string };
}

export function useEditRecordGuard({ getGridApi, guard }: UseEditRecordGuardOptions) {
  /**
   * @param recordId - If provided, skips selection validation (used for row-level edit buttons)
   */
  const openEditDialogIfAllowed = (recordId?: string | null): boolean => {
    const g = guard();
    if (!g.allowed) {
      throw new Error(g.message || 'Edit permission not assigned');
    }

    // If recordId is provided (from row edit button), skip selection validation
    if (recordId) {
      return true;
    }

    const api = getGridApi();
    const selected = api?.getSelectedNodes() ?? [];
    if (selected.length > 1) {
      throw new Error('Only 1 record can be selected for editing!');
    }
    if (selected.length === 0) {
      throw new Error('Select a record to edit!');
    }

    return true;
  };

  return { openEditDialogIfAllowed };
}

export default useEditRecordGuard;

