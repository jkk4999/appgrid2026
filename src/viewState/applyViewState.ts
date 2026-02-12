import type { GridApi } from 'ag-grid-community';

import type { ApplyOptions, ApplySetters, SelectedViewLike } from './types';

import { extractViewState } from './normalize';

import { VIEW_STATE_APPLIED } from './topics';

// import { prettyPrint } from '../utilities/prettyPrint';

export async function applyViewState({
  gridApi,
  selectedView,
  setters,
  opts
}: {
  gridApi: GridApi;
  selectedView: SelectedViewLike;
  setters: ApplySetters;
  opts?: ApplyOptions;
}): Promise<boolean> {
  try {
    const { viewState, recordId } = extractViewState(selectedView);

    if (!viewState) return false;

    const {
      setCurrentState,
      setFilterOptions,
      setShowAdvancedFilter,
      setPivotMode,
      setObjColumnStyles,
      setObjRowStyles,
      setObjCalculatedColumns,
      setSelectedChart,
      setSelectedViewProcessed,
      setSelectedViewRecordId,
      setLastViewId
    } = setters;

    // Record id + grid prefs
    if (recordId) {
      setSelectedViewRecordId?.(recordId);
      setLastViewId?.(recordId);
    }

    // update current state in store
    setCurrentState({
      gridState: viewState.gridState,
      columnState: viewState.columnState
    });

    // 1) Apply pivot mode FIRST to the grid API (before column state)
    // This ensures the grid is in the correct mode when we apply column state.
    // Always set explicitly so switching FROM a pivot view back to a non-pivot
    // view correctly disables pivot mode on the grid API.
    gridApi.setGridOption('pivotMode', !!viewState.pivotMode);

    setPivotMode(!!viewState.pivotMode);

    // 2) column state - apply with applyOrder true to maintain column order
    if (viewState.columnState) {
      gridApi.applyColumnState({
        state: viewState.columnState as any,
        applyOrder: true
      });

      // Ensure error column starts hidden and pinned left at index 0 for stability
      const state = gridApi.getColumnState?.() || [];

      const errorCol = state.find((s: any) => s.colId === 'error');

      if (errorCol) {
        const normalized = state.map((s: any) =>
          s.colId === 'error' ? { ...s, hide: true, pinned: 'left' } : s
        );

        const ordered = [
          normalized.find((s: any) => s.colId === 'error')!,
          ...normalized.filter((s: any) => s.colId !== 'error')
        ];

        gridApi.applyColumnState({ state: ordered as any, applyOrder: true });
      }
    }

    // 3) Row groups - check both gridState AND columnState for row group columns
    // The gridState.rowGroup.groupColIds is the primary source
    // But we also check columnState for rowGroup:true or rowGroupIndex >= 0 as fallback
    let rowGroupIds: string[] = [];
    if (
      viewState.gridState &&
      (viewState.gridState as any).rowGroup?.groupColIds?.length
    ) {
      rowGroupIds = (viewState.gridState as any).rowGroup.groupColIds;
    } else if (viewState.columnState) {
      // Fallback: extract from column state
      rowGroupIds = viewState.columnState
        .filter(
          (col: any) =>
            col.rowGroup === true ||
            (col.rowGroupIndex !== null &&
              col.rowGroupIndex !== undefined &&
              col.rowGroupIndex >= 0)
        )
        .sort(
          (a: any, b: any) =>
            (a.rowGroupIndex ?? 999) - (b.rowGroupIndex ?? 999)
        )
        .map((col: any) => col.colId)
        .filter(Boolean);
    }

    // Always set row group columns - use empty array to clear when switching
    // to a view without row groups
    gridApi.setRowGroupColumns(rowGroupIds);

    // 4) filters - Always clear/set filters so switching to a view without
    // saved filters doesn't leave stale filters from the previous view.
    //
    // IMPORTANT: Set the advanced-filter UI flag FIRST so the grid's
    // enableAdvancedFilter prop is updated before we call
    // setAdvancedFilterModel (AG Grid silently ignores the call when the
    // feature is disabled).
    const fm = (viewState.gridState as any)?.filter?.filterModel ?? null;
    const afm = (viewState.gridState as any)?.filter?.advancedFilterModel ?? null;

    setShowAdvancedFilter(!!viewState.advancedFilterEnabled);

    // Column filters can be applied immediately
    gridApi.setFilterModel(fm);

    // Advanced filter model can only be applied after the grid re-renders
    // with enableAdvancedFilter=true, so defer it to the pendingFilters
    // effect.  When switching to a view WITHOUT an advanced filter we can
    // clear immediately (enableAdvancedFilter is already true or the call
    // is a harmless no-op).
    if (!afm) {
      gridApi.setAdvancedFilterModel?.(null);
    }

    setters.setPendingFilters?.({
      filterModel: fm,
      advancedFilterModel: afm
    });

    // Match the active filter to a saved filter template so the dropdown
    // shows the correct name.  Clear if no match (prevents stale selection
    // from the previous view re-applying via the selectedFilter effect).
    const opts_filters = viewState.filterOptions || [];
    let matchedFilter: any = null;

    if (afm && opts_filters.length) {
      const afmJson = JSON.stringify(afm);
      matchedFilter = opts_filters.find(
        (f: any) => f.type === 'AdvancedFilterModel' && JSON.stringify(f.filterModel) === afmJson
      ) ?? null;
    } else if (fm && opts_filters.length) {
      const fmJson = JSON.stringify(fm);
      matchedFilter = opts_filters.find(
        (f: any) => f.type === 'FilterModel' && JSON.stringify(f.filterModel) === fmJson
      ) ?? null;
    }

    setters.setSelectedFilter?.(matchedFilter);

    // 6) Pivot columns - check both gridState AND columnState
    let pivotColIds: string[] = [];
    if (
      viewState.gridState &&
      (viewState.gridState as any).pivot?.pivotColIds?.length
    ) {
      pivotColIds = (viewState.gridState as any).pivot.pivotColIds;
    } else if (viewState.columnState) {
      // Fallback: extract from column state
      pivotColIds = viewState.columnState
        .filter(
          (col: any) =>
            col.pivot === true ||
            (col.pivotIndex !== null &&
              col.pivotIndex !== undefined &&
              col.pivotIndex >= 0)
        )
        .sort((a: any, b: any) => (a.pivotIndex ?? 999) - (b.pivotIndex ?? 999))
        .map((col: any) => col.colId)
        .filter(Boolean);
    }
    // Always set pivot columns - use empty array to clear when switching
    // away from a pivot view, otherwise stale pivot columns persist
    gridApi.setPivotColumns(pivotColIds);

    // 8) filter options (normalized in extractViewState)
    setFilterOptions(viewState.filterOptions || []);

    // 9) column styles
    if (viewState.columnStyles) setObjColumnStyles(viewState.columnStyles);

    // 10) row styles
    if (viewState.rowStyles) setObjRowStyles(viewState.rowStyles);

    // 11) calculated columns
    if (viewState.calculatedColumns)
      setObjCalculatedColumns(viewState.calculatedColumns);

    // 12) chart + post events
    setSelectedChart?.(null);

    opts?.publish?.(VIEW_STATE_APPLIED);

    // Only set processed if not skipped (caller will handle it with delay)
    if (!opts?.skipSetProcessed) {
      setSelectedViewProcessed?.(true);
    }

    return true;
  } catch (e: any) {
    opts?.onError?.(e?.message ?? 'Error applying view state');

    return false;
  }
}
