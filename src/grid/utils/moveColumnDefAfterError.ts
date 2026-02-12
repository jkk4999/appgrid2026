import type { ColDef } from 'ag-grid-community';

/**
 * Moves the column with the provided `field` so that it appears immediately after the
 * special 'error' column. Returns the same array reference after in-place reordering
 * to preserve existing behavior in callers that rely on mutation.
 */
export function moveColumnDefAfterError(columnDefs: ColDef[], field: string): ColDef[] {
  if (!columnDefs || columnDefs.length === 0) {
    console.warn('ColumnDefs is empty or undefined.');
    return columnDefs;
  }

  const errorIndex = columnDefs.findIndex((colDef) => colDef && colDef.colId === 'error');
  if (errorIndex === -1) {
    console.error('Error column not found in column definitions.');
    return columnDefs;
  }

  const targetIndex = columnDefs.findIndex((colDef) => colDef && colDef.colId === field);
  if (targetIndex === -1) {
    console.warn(`Field "${field}" not found in column definitions.`);
    return columnDefs;
  }

  const [targetColDef] = columnDefs.splice(targetIndex, 1);
  columnDefs.splice(errorIndex + 1, 0, targetColDef);

  return columnDefs;
}

