import { buildFieldTypeMap, decodeAndConvertRecords } from './decodeAndConvert';
import type { SObjectFieldMetadata } from '../sObjectMetadataTypes';

/**
 * Normalize API records using sObject field metadata.
 * - Converts Salesforce wire values (dates, numerics, references) to UI-friendly types
 * - Safe on error; returns original records if conversion fails
 */
export function normalizeRecords(fields: SObjectFieldMetadata[] | undefined | null, records: any[]): any[] {
  try {
    const map = buildFieldTypeMap(fields || []);
    return decodeAndConvertRecords(records || [], map);
  } catch {
    return records || [];
  }
}

