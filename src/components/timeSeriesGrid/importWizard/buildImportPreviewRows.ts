import type { SObjectFieldMetadata } from '../../../sObjectMetadataTypes';
import type { PreviewRow, NormalizationResult, DateParser, NumberParser } from './types/importTypes';
import { TRUTHY_VALUES, FALSY_VALUES } from './types/importTypes';
import { prettyPrint } from '../../../utilities/prettyPrint';

/**
 * Normalizes a boolean value from various input formats
 * CRITICAL: Returns null value on error to prevent invalid data from proceeding
 */
function normalizeBoolean(v: any): NormalizationResult {
   if (typeof v === 'boolean') return { value: v };

   const s = String(v ?? '').trim().toLowerCase();
   if (!s) return { value: null };

   if (TRUTHY_VALUES.includes(s as any)) return { value: true };
   if (FALSY_VALUES.includes(s as any)) return { value: false };

   // CRITICAL FIX: Return null value instead of raw input on error
   return { value: null, error: `Not a boolean: ${v}` };
}

/**
 * Normalizes a reference (Salesforce ID) value
 * CRITICAL: Returns null value on error to prevent invalid IDs from proceeding
 */
function normalizeReference(v: any): NormalizationResult {
   const s = String(v ?? '').trim();
   if (!s) return { value: null };

   // Validate Salesforce ID format (15 or 18 characters)
   if (/^[A-Za-z0-9]{15}([A-Za-z0-9]{3})?$/.test(s)) {
      return { value: s };
   }

   // CRITICAL FIX: Return null value instead of raw input on error
   return { value: null, error: `Not a Salesforce Id: ${s}` };
}

/**
 * Normalizes a multi-select picklist value
 */
function normalizeMultiPicklist(v: any): NormalizationResult {
   if (v == null) return { value: '' };

   if (Array.isArray(v)) {
      return { value: v.map(x => String(x)).join(';') };
   }

   try {
      const tokens = String(v)
         .split(/[;,]/)
         .map(s => s.trim())
         .filter(s => s.length > 0);

      return { value: tokens.join(';') };
   } catch (e: any) {
      prettyPrint('[buildImportPreviewRows] Multi-picklist normalization error:', e, 'orange');
      return { value: '', error: `Invalid multi-select value: ${e.message}` };
   }
}

/**
 * Builds preview rows from parsed data with type-aware normalization
 *
 * CRITICAL FIXES:
 * 1. Uses locale-aware parsers for consistency with final commit
 * 2. Returns NULL values on error instead of raw invalid data
 * 3. Adds comprehensive error logging
 * 4. Validates all fields before allowing preview
 */
export function buildImportPreviewRows(params: {
   parsedRows: any[];
   mapping: Record<string, string>; // property -> api
   metaFields: SObjectFieldMetadata[];
   transposedField: string;
   parseDate?: DateParser;
   parseNumber?: NumberParser;
}): { rows: PreviewRow[]; errorCount: number } {
   const { parsedRows, mapping, metaFields, transposedField, parseDate, parseNumber } = params;

   prettyPrint('[buildImportPreviewRows] Starting preview build', {
      rowCount: parsedRows.length,
      mappedFields: Object.keys(mapping).length,
      transposedField
   }, 'blue');

   const typeByApi = new Map(metaFields.map(f => [f.name, f.type]));
   const rows: PreviewRow[] = [];
   let errorCount = 0;

   const mappedPairs = Object.entries(mapping).filter(([, api]) => api);

   for (let i = 0; i < parsedRows.length; i++) {
      const rec = parsedRows[i];
      const out: PreviewRow = {};
      const errMsgs: string[] = [];

      try {
         // Transposed value copied as-is (already normalized during parse)
         out[transposedField] = rec[transposedField];

         for (const [prop, api] of mappedPairs) {
            const fieldType = (typeByApi.get(api) as string) || 'STRING';
            const val = rec[prop];
            let res: NormalizationResult = { value: val };

            switch (fieldType) {
               case 'BOOLEAN':
                  res = normalizeBoolean(val);
                  break;

               case 'CURRENCY':
               case 'DECIMAL':
               case 'DOUBLE':
               case 'INTEGER':
               case 'LONG':
                  // CRITICAL FIX: Use locale-aware parser if provided
                  if (parseNumber) {
                     res = parseNumber(val);
                  } else {
                     // Fallback to simple parsing (but log warning)
                     prettyPrint('[buildImportPreviewRows] WARNING: No number parser provided, using simple parse', null, 'orange');
                     const s0 = String(val ?? '').trim();
                     if (!s0) {
                        res = { value: null };
                     } else {
                        const num = parseFloat(s0.replace(/[$£€¥,]/g, ''));
                        res = isNaN(num)
                           ? { value: null, error: `Not a number: ${s0}` }
                           : { value: num };
                     }
                  }
                  break;

               case 'DATE':
               case 'DATETIME':
                  // CRITICAL FIX: Use locale-aware parser if provided
                  if (parseDate) {
                     res = parseDate(val);
                  } else {
                     // Fallback with warning
                     prettyPrint('[buildImportPreviewRows] WARNING: No date parser provided, using simple parse', null, 'orange');
                     if (val == null || val === '') {
                        res = { value: null };
                     } else if (val instanceof Date) {
                        res = isNaN(val.getTime())
                           ? { value: null, error: 'Invalid date' }
                           : { value: val };
                     } else {
                        const d = new Date(val);
                        res = isNaN(d.getTime())
                           ? { value: null, error: `Not a date: ${val}` }
                           : { value: d };
                     }
                  }
                  break;

               case 'REFERENCE':
                  res = normalizeReference(val);
                  break;

               case 'MULTIPICKLIST':
                  res = normalizeMultiPicklist(val);
                  break;

               default:
                  // String fields - trim whitespace
                  res = { value: val == null ? null : String(val).trim() };
            }

            // CRITICAL FIX: Record error and track count
            if (res.error) {
               errMsgs.push(`${api}: ${res.error}`);
               errorCount++;
            }

            // CRITICAL FIX: Always use normalized value (null on error, not raw input)
            out[api] = res.value;
         }

         if (errMsgs.length) {
            out.__error = errMsgs.join('; ');
         }

         rows.push(out);
      } catch (e: any) {
         prettyPrint('[buildImportPreviewRows] Error processing row', { rowIndex: i, error: e.message }, 'red');
         // Add error row to preview so user sees it
         rows.push({
            ...rec,
            __error: `Row processing failed: ${e.message}`
         });
         errorCount++;
      }
   }

   prettyPrint('[buildImportPreviewRows] Preview build complete', {
      totalRows: rows.length,
      errorCount
   }, errorCount > 0 ? 'orange' : 'green');

   return { rows, errorCount };
}
