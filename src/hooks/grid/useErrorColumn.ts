import { useCallback } from 'react';
import type { GridApi, ColumnState } from 'ag-grid-community';

export interface UseErrorColumnParams {
  getApi: () => GridApi | null | undefined;
}

export function useErrorColumn({ getApi }: UseErrorColumnParams) {
  const showErrorColumn = useCallback((visibility: boolean) => {
    const api = getApi?.();
    if (!api) return;

    const state = api.getColumnState();
    const errorColumn = state.find((col: ColumnState) => col.colId === 'error');
    if (!errorColumn) return;

    // Always keep error column first (index 0) and pinned left for layout stability.
    // Only toggle hide/show based on visibility flag.
    const nextError = { ...errorColumn, hide: !visibility, pinned: 'left' as const };
    const others = state.filter((c) => c.colId !== 'error');
    const ordered: ColumnState[] = [nextError, ...others];

    try {
      api.applyColumnState({ state: ordered, applyOrder: true });
      api.refreshHeader();
      api.refreshCells({ force: true });
    } catch {
      // no-op; callers can surface errors if needed
    }
  }, [getApi]);

  const showErrorRecords = useCallback((showErrorsOnly: boolean) => {
    const api = getApi?.();
    if (!api) return;

    // Clear existing filter model
    api.setFilterModel(null);

    // Apply/remove error filter on the 'error' column
    api
      .setColumnFilterModel(
        'error',
        showErrorsOnly
          ? { filterType: 'text', type: 'contains', filter: 'ERROR', caseSensitive: false }
          : null
      )
      .then(() => {
        api.onFilterChanged();
      });
  }, [getApi]);

  return { showErrorColumn, showErrorRecords };
}
