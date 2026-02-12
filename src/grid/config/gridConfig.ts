import type { ColDef, GridOptions, RowSelectionOptions } from 'ag-grid-community';

export function createDefaultColDef(overrides?: ColDef): ColDef {
  const base: ColDef = {
    editable: true,
    filter: true,
    minWidth: 150,
    enableRowGroup: true,
    enableValue: true,
  };
  return { ...base, ...(overrides || {}) } as ColDef;
}

export function createGridOptions<TData = any>(overrides?: Partial<GridOptions<TData>>): Partial<GridOptions<TData>> {
  const base: Partial<GridOptions<TData>> = {
    popupParent: typeof document !== 'undefined' ? (document.body as any) : undefined,
    suppressColumnMoveAnimation: false,
    suppressDragLeaveHidesColumns: false,
    // Allow columns to reorder even under Aura/LWS; our stabilizer finalizes drops
    suppressMoveWhenColumnDragging: false,
    loadThemeGoogleFonts: false,
  };
  return { ...base, ...(overrides || {}) } as Partial<GridOptions<TData>>;
}

export function createDefaultRowSelection(
  overrides?: Partial<RowSelectionOptions> | 'single' | 'multiple'
): RowSelectionOptions | 'single' | 'multiple' {
  if (overrides === 'single' || overrides === 'multiple') return overrides;
  const base: RowSelectionOptions = {
    mode: 'multiRow',
    groupSelects: 'self',
    headerCheckbox: true,
    checkboxLocation: 'autoGroupColumn',
  } as RowSelectionOptions;
  return { ...base, ...(overrides || {}) } as RowSelectionOptions;
}
