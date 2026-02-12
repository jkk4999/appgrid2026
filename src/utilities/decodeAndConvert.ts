import { decode } from 'he';
import type { SObjectFieldMetadata } from '../sObjectMetadataTypes';

export type FieldTypeMap = Map<string, string>;

/**
 * Optimized record processing - only converts date fields and adds errorMsg.
 *
 * Performance optimizations:
 * 1. Pre-compute date/datetime field names once (not per-record)
 * 2. Mutate records in place (no shallow copy)
 * 3. Only iterate date fields, not all fields
 * 4. Numbers and booleans are already correct types from Apex JSON serialization
 */
export function decodeAndConvertRecords<T extends Record<string, any> = any>(
  records: any[] | null | undefined,
  fieldTypeMap: FieldTypeMap
): T[] {
  if (!Array.isArray(records) || records.length === 0) return [] as T[];

  // Pre-compute which fields are DATE vs DATETIME (do this once, not per-record)
  const dateFields: string[] = [];
  const datetimeFields: string[] = [];

  for (const [fieldName, fieldType] of fieldTypeMap) {
    const t = fieldType.toUpperCase();
    if (t === 'DATE') {
      dateFields.push(fieldName);
    } else if (t === 'DATETIME') {
      datetimeFields.push(fieldName);
    }
  }

  // Process records - mutate in place for performance
  for (const record of records) {
    if (!record || typeof record !== 'object') continue;

    // Convert DATE fields (date-only, no time component)
    for (const fieldName of dateFields) {
      const v = record[fieldName];
      if (typeof v === 'string' && v.length > 0) {
        const d = new Date(v);
        if (!isNaN(d.getTime())) {
          // Create date-only (no time) in local timezone
          record[fieldName] = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        }
      }
    }

    // Convert DATETIME fields (full timestamp)
    for (const fieldName of datetimeFields) {
      const v = record[fieldName];
      if (typeof v === 'string' && v.length > 0) {
        const d = new Date(v);
        if (!isNaN(d.getTime())) {
          record[fieldName] = d;
        }
      }
    }

    // Add errorMsg field for grid error display
    record['errorMsg'] = '';
  }

  return records as T[];
}

export function buildFieldTypeMap(fields?: SObjectFieldMetadata[] | null): FieldTypeMap {
  const map: FieldTypeMap = new Map();
  if (Array.isArray(fields)) {
    for (const f of fields) {
      if (f?.name) map.set(f.name, (f as any).type || '');
    }
  }
  return map;
}
