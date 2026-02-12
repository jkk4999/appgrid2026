import type { SObject } from '../../../sObjectMetadataTypes';
import type { ColumnState } from 'ag-grid-community';

export interface TransposedRow {
   property: string;
   rowIndex?: string;
   [key: string]: any; // field0, field1, field2, etc.
}

export interface TransformedData {
   name: string;
   values: any[];
}

/**
 * Gets a value from a record, supporting dot notation for parent fields.
 * e.g., 'Account.AccountSource' will access record['Account']['AccountSource']
 *
 * @param record - The SObject record
 * @param fieldPath - The field path (may contain dots for parent fields)
 * @returns The field value or null if not found
 */
function getNestedValue(record: SObject, fieldPath: string): any {
   if (!record || !fieldPath) return null;

   // Check if it's a parent field (contains a dot like 'Account.AccountSource')
   if (fieldPath.includes('.')) {
      const parts = fieldPath.split('.');
      let value: any = record;

      for (const part of parts) {
         if (value == null) return null;
         value = value[part];
      }

      return value ?? null;
   }

   // Simple field access
   return record[fieldPath];
}

/**
 * Transforms normalized SObject data into a format suitable for transposition.
 * Maps each column to an array of values across all records.
 * Handles parent fields with dot notation (e.g., 'Account.AccountSource').
 *
 * @param data - Array of SObject records
 * @param columns - Column state defining which fields to include
 * @returns Array of objects with field names and their values across records
 */
export function transformDataForTranspose(
   data: SObject[],
   columns: ColumnState[]
): TransformedData[] {
   return columns.map((col) => ({
      name: col.colId!,
      values: data.map((record) => getNestedValue(record, col.colId!))
   }));
}

/**
 * Creates transposed grid records where each row represents a field property
 * and columns represent individual records.
 *
 * Original: [{Id: '1', Name: 'A'}, {Id: '2', Name: 'B'}]
 * Transposed: [{property: 'Id', field0: '1', field1: '2'}, {property: 'Name', field0: 'A', field1: 'B'}]
 *
 * @param transposedColumn - The field name being used as column headers
 * @param transformedData - Pre-transformed data from transformDataForTranspose
 * @param selectedViewColumns - Column state from the view
 * @returns Array of transposed row objects
 */
export function createTransposedGridRecords(
   transposedColumn: string,
   transformedData: TransformedData[],
   selectedViewColumns: ColumnState[]
): TransposedRow[] {
   const gridRecs: TransposedRow[] = [];

   // Remove error and group columns
   const filteredLayoutColumns = selectedViewColumns.filter(
      (col) => col.colId !== 'errorMsg' && col.colId !== 'group-column'
   );

   // Build transposed rows
   for (let i = 0; i < filteredLayoutColumns.length; i++) {
      if (filteredLayoutColumns[i].hide === false) {
         const property = filteredLayoutColumns[i].colId!;

         // Find values for this property
         const propValuesObj = transformedData.find((item) => item.name === property);

         if (!propValuesObj) {
            throw new Error(
               `createTransposedGridRecords - property values not found for ${property}`
            );
         }

         const propValues = propValuesObj.values;

         const newRec: TransposedRow = {
            property,
            rowIndex: i.toString()
         };

         // Add field values (field0, field1, field2, ...)
         for (let j = 0; j < propValues.length; j++) {
            const fieldName = `field${j}`;
            newRec[fieldName] = propValues[j];
         }

         gridRecs.push(newRec);
      }
   }

   return gridRecs;
}

/**
 * Reverses the transpose operation, converting transposed grid data back to normalized SObject records.
 *
 * Transposed: [{property: 'Id', field0: '1', field1: '2'}, {property: 'Name', field0: 'A', field1: 'B'}]
 * Normalized: [{Id: '1', Name: 'A'}, {Id: '2', Name: 'B'}]
 *
 * @param transposedData - Array of transposed rows
 * @returns Array of normalized SObject records
 */
export function reverseTranspose(transposedData: TransposedRow[]): SObject[] {
   if (!transposedData || transposedData.length === 0) {
      return [];
   }

   // Determine the maximum field index across all rows
   let maxIndex = -1;

   for (const row of transposedData) {
      for (const key of Object.keys(row)) {
         if (key.startsWith('field')) {
            const idx = parseInt(key.replace('field', ''), 10);
            if (!Number.isNaN(idx)) {
               maxIndex = Math.max(maxIndex, idx);
            }
         }
      }
   }

   const numColumns = Math.max(0, maxIndex + 1);

   // Create empty records for each column
   const sObjects: SObject[] = Array.from({ length: numColumns }, () => ({}));

   // Populate records by iterating through transposed rows
   for (const transposedRow of transposedData) {
      const propertyName = transposedRow.property;

      for (let i = 0; i < numColumns; i++) {
         const fieldKey = `field${i}`;

         if (fieldKey in transposedRow) {
            sObjects[i][propertyName] = transposedRow[fieldKey];
         }
      }
   }

   return sObjects;
}

/**
 * Moves a column in the column state array to a new position.
 * Used to reorder columns after transposing.
 *
 * @param columnsArray - Array of column states
 * @param columnId - The colId to move
 * @param newPosition - Target position index
 * @returns Modified columns array
 */
export function moveColumnToPosition(
   columnsArray: ColumnState[],
   columnId: string,
   newPosition: number
): ColumnState[] {
   const currentIndex = columnsArray.findIndex((col) => col.colId === columnId);

   if (
      currentIndex === -1 ||
      newPosition < 0 ||
      newPosition >= columnsArray.length
   ) {
      return columnsArray;
   }

   const removedColumn = columnsArray.splice(currentIndex, 1)[0];
   columnsArray.splice(newPosition, 0, removedColumn);

   return columnsArray;
}

/**
 * Moves a column state to the front of the array.
 *
 * @param columnStates - Array of column states
 * @param columnId - The colId to move to front
 * @returns Modified column states array
 */
export function moveColumnToFront(
   columnStates: ColumnState[],
   columnId: string
): ColumnState[] {
   // Use case-insensitive comparison since DTO may return lowercase colIds
   const columnIdLower = columnId?.toLowerCase();
   const index = columnStates.findIndex((state) => state.colId?.toLowerCase() === columnIdLower);

   if (index === -1) {
      return columnStates;
   }

   const [columnToMove] = columnStates.splice(index, 1);
   columnStates.unshift(columnToMove);

   return columnStates;
}

/**
 * Creates an Id-to-fieldKey mapping for fast lookups during error handling.
 *
 * @param transposedRowData - Array of transposed rows
 * @returns Map of record IDs to their field keys (field0, field1, etc.)
 */
export function buildIdToFieldKeyMap(transposedRowData: Record<string, any>[]): Map<string, string> {
   const map = new Map<string, string>();

   const idRow = transposedRowData.find((r: any) => r?.property === 'Id');

   if (idRow) {
      for (const [key, value] of Object.entries(idRow)) {
         if (key.startsWith('field') && typeof value === 'string') {
            map.set(value, key);
         }
      }
   }

   return map;
}

/**
 * Finds the field key for a given value in a transposed row.
 * Fallback for when cached mapping is unavailable.
 *
 * @param row - Transposed row object
 * @param value - Value to search for
 * @returns Field key (e.g., 'field0') or undefined
 */
export function findFieldKeyByValue(
   row: Record<string, any>,
   value: any
): string | undefined {
   for (const [key, val] of Object.entries(row)) {
      if (val === value) {
         return key;
      }
   }
   return undefined;
}
