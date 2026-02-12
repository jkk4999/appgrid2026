import type { GridApi } from 'ag-grid-community';
import * as XLSX from 'xlsx';

/**
 * Exports AG Grid data as CSV.
 * Uses the built-in AG Grid export, safe for LWC.
 */
export function exportGridToCsv(gridApi: GridApi, fileName = 'export.csv') {
  if (!gridApi) return;

  gridApi.exportDataAsCsv({ fileName });
}

/**
 * Exports AG Grid data as Excel (.xlsx) using SheetJS.
 * Works in LWC and avoids Lightning Web Security restrictions.
 */
export function exportGridToExcel(gridApi: GridApi, fileName = 'export.xlsx') {
  if (!gridApi) return;

  const rowData: any[] = [];
  gridApi.forEachNode((node) => {
    if (node.data) rowData.push(node.data);
  });

  if (rowData.length === 0) {
    console.warn('No data to export.');
    return;
  }

  // Convert JSON row data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(rowData);

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Trigger download
  XLSX.writeFile(workbook, fileName);
}
