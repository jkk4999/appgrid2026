import React, { useCallback, useRef, useEffect } from 'react';
import type { CellValueChangedEvent } from 'ag-grid-community';

export interface UseTimeSeriesCellEditingParams {
   transposedRowData: Record<string, any>[];
   setTransposedRowData: (data: Record<string, any>[]) => void;
   setChangedRows: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export interface UseTimeSeriesCellEditingReturn {
   onCellValueChanged: (event: CellValueChangedEvent) => void;
   clearChangedRows: () => void;
}

/**
 * Custom hook to handle cell value changes in the time series grid.
 * Ensures data synchronization between the grid and the application state.
 * Uses a ref to avoid stale closure issues with transposedRowData.
 *
 * @param params - Configuration object
 * @returns Object with event handlers
 */
export function useTimeSeriesCellEditing({
   transposedRowData,
   setTransposedRowData,
   setChangedRows
}: UseTimeSeriesCellEditingParams): UseTimeSeriesCellEditingReturn {

   // Use ref to always access latest transposedRowData (avoids stale closure)
   const transposedRowDataRef = useRef(transposedRowData);

   // Keep ref in sync with state
   useEffect(() => {
      transposedRowDataRef.current = transposedRowData;
   }, [transposedRowData]);

   const onCellValueChanged = useCallback(
      (event: CellValueChangedEvent) => {
         const { data, colDef, newValue, oldValue } = event;

         // Only process if value actually changed
         if (newValue === oldValue) {
            return;
         }

         const property = data.property as string;
         const columnId = colDef.field!;

         // Use ref to get current data (avoids stale closure)
         const currentData = transposedRowDataRef.current;

         // Update transposedRowData with the new value
         const updatedData = currentData.map((row) =>
            row.property === property
               ? { ...row, [columnId]: newValue }
               : row
         );

         setTransposedRowData(updatedData);

         // Track which column (record) has been modified
         setChangedRows((prev) => {
            const newSet = new Set(prev);
            newSet.add(columnId);
            return newSet;
         });
      },
      [setTransposedRowData, setChangedRows]
   );

   const clearChangedRows = useCallback(() => {
      setChangedRows(new Set());
   }, [setChangedRows]);

   return {
      onCellValueChanged,
      clearChangedRows
   };
}
