import type { GridApi } from 'ag-grid-community';

// Detects whether the grid is currently grouped or in pivot mode.
// Accepts a getter to safely obtain the latest GridApi instance.
export function isGridGroupedOrPivoted(getGridApi: () => GridApi | null | undefined): boolean {
  try {
    const api = getGridApi?.();
    if (!api) return false;

    // Some environments expose pivot mode on GridApi; others via ColumnApi
    const columnApi = (api as any).getColumnApi ? (api as any).getColumnApi() : null;
    const pivot = typeof (api as any).isPivotMode === 'function'
      ? (api as any).isPivotMode()
      : (columnApi && typeof columnApi.isPivotMode === 'function' ? columnApi.isPivotMode() : false);

    const rowGroupCols = columnApi && typeof columnApi.getRowGroupColumns === 'function'
      ? columnApi.getRowGroupColumns()
      : [];

    return !!pivot || (Array.isArray(rowGroupCols) && rowGroupCols.length > 0);
  } catch {
    return false;
  }
}

