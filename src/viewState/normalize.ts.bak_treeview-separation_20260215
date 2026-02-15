import { decode } from 'he';
import type { ViewStateDto, SelectedViewLike } from './types';
import type { FilterOption } from '../appInterfaces/grid/gridInterfaces';

function safeParse<T = any>(s?: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(decode(s)) as T;
  } catch {
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }
}

export function extractViewState(selectedView: SelectedViewLike): {
  viewState: ViewStateDto | null;
  recordId: string | undefined;
} {
  if (!selectedView) return { viewState: null, recordId: undefined };

  // Views are normalized by viewSlice.normalizeViewRecord() before reaching here,
  // so we only need to read the DTO shape (camelCase fields)
  const gridState = safeParse<any>(selectedView.gridState ?? '');
  const columnState = safeParse<any[]>(selectedView.columnState ?? '');
  const columnStyles = safeParse<any>(selectedView.columnStyles ?? '');
  const rowStyles = safeParse<any>(selectedView.rowStyles ?? '');
  const calculatedColumns = safeParse<any>(selectedView.calculatedColumns ?? '');

  // filterOptions are stored inside gridState.filter.savedFilters
  const savedFilters = gridState?.filter?.savedFilters;
  const filterOptions: FilterOption[] = Array.isArray(savedFilters) ? savedFilters : [];

  // Check both the direct pivotMode field on the view AND the gridState.pivot.pivotMode
  // The direct field is the primary source (from Pivot_Mode__c), gridState is secondary
  // Also check the subgrid shape (AppGridAg__Pivot_Mode__c)
  const pivotMode = !!(
    selectedView.pivotMode ??
    selectedView.AppGridAg__Pivot_Mode__c ??
    gridState?.pivot?.pivotMode
  );
  const advancedFilterEnabled = !!(
    selectedView.showAdvancedFilter ??
    selectedView.AppGridAg__ShowAdvancedFilter__c ??
    gridState?.filter?.advancedFilterModel
  );

  const viewState: ViewStateDto = {
    gridState: gridState || null,
    columnState: columnState || null,
    filterOptions,
    columnStyles: columnStyles || null,
    rowStyles: rowStyles || null,
    calculatedColumns: calculatedColumns || null,
    pivotMode,
    advancedFilterEnabled
  };

  const recordId = selectedView.id;

  return { viewState, recordId };
}
