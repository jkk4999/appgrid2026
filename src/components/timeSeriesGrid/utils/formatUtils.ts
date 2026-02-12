import type { SObjectFieldMetadata } from '../../../sObjectMetadataTypes';
import { formatByFieldType as formatByFieldTypeUtil, type Formatters } from '../../../utilities/formatByFieldType';

// Re-export for convenience
export { formatByFieldTypeUtil as formatByFieldType };
export type { Formatters };

/**
 * Formats a transposed column header value based on the transpose field's type.
 *
 * @param value - Header value to format
 * @param transposeFieldMetadata - Metadata for the transposed column field
 * @param formatters - Formatting functions
 * @returns Formatted header string
 */
export function formatTransposedHeader(
   value: any,
   transposeFieldMetadata: SObjectFieldMetadata | undefined,
   formatters: Formatters
): string {
   if (value == null) {
      return '';
   }

   const fieldType = transposeFieldMetadata?.type;

   if (!fieldType) {
      return String(value);
   }

   const { dateFormatter, numberFormatter, currencyFormatter, percentageFormatter } = formatters;

   switch (fieldType) {
      case 'DATE':
      case 'DATETIME': {
         const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
         return isNaN(date?.getTime?.()) ? String(value) : dateFormatter.format(date);
      }

      case 'CURRENCY': {
         return value != null ? currencyFormatter.format(value) : '';
      }

      case 'DECIMAL':
      case 'DOUBLE':
      case 'INTEGER':
      case 'LONG': {
         return value != null && !isNaN(Number(value)) ? numberFormatter.format(value) : '';
      }

      case 'PERCENTAGE': {
         return value != null ? percentageFormatter.format(value) : '';
      }

      default: {
         return String(value);
      }
   }
}

/**
 * Formats a picklist value to display its label instead of API value.
 *
 * @param value - Picklist API value
 * @param picklistValues - Available picklist options
 * @returns Label if found, otherwise original value
 */
export function formatPicklistValue(
   value: any,
   picklistValues: Array<{ value: string; label: string }> | undefined
): string {
   if (value == null || value === '') {
      return String(value ?? '');
   }

   if (!picklistValues || picklistValues.length === 0) {
      return String(value);
   }

   const option = picklistValues.find((opt) => opt.value === value);
   return option?.label ?? String(value);
}

/**
 * Formats a multi-select picklist value to display labels joined by semicolons.
 *
 * @param value - Multi-select picklist API value (semicolon-separated)
 * @param picklistValues - Available picklist options
 * @returns Formatted labels joined by '; '
 */
export function formatMultiPicklistValue(
   value: any,
   picklistValues: Array<{ value: string; label: string }> | undefined
): string {
   if (value == null || value === '') {
      return String(value ?? '');
   }

   if (!picklistValues || picklistValues.length === 0) {
      return String(value);
   }

   try {
      const tokens = String(value)
         .split(';')
         .map((s) => s.trim())
         .filter((s) => s.length > 0);

      const labels = tokens.map((val) => {
         const option = picklistValues.find((opt) => opt.value === val);
         return option?.label ?? val;
      });

      return labels.join('; ');
   } catch {
      return String(value);
   }
}

/**
 * Safe null check that properly handles falsy values like 0, false, and empty strings.
 *
 * @param value - Value to check
 * @returns true if value is null or undefined, false otherwise
 */
export function isNullOrUndefined(value: any): value is null | undefined {
   return value == null;
}

/**
 * Validates if a value is a valid number (not NaN, null, or undefined).
 *
 * @param value - Value to validate
 * @returns true if value is a valid number
 */
export function isValidNumber(value: any): boolean {
   return value != null && !isNaN(Number(value));
}

/**
 * Validates if a value is a valid date.
 *
 * @param value - Value to validate
 * @returns true if value can be parsed as a valid date
 */
export function isValidDate(value: any): boolean {
   if (value == null) return false;
   const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
   return date instanceof Date && !isNaN(date.getTime());
}
