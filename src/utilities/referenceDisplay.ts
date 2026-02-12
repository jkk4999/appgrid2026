import type { SObject } from '../sObjectMetadataTypes';

/**
 * Resolves a reference field display value given the transposed grid context.
 * Falls back to returning the original value if display cannot be resolved.
 */
export function displayReference(
  value: any,
  opts: {
    relationName: string;
    columnId: string; // e.g., 'field0'
    transposedRowData: Record<string, any>[];
    rowDataCopy: SObject[];
    objectsWithoutNameFieldMap: Map<string, string>;
    nameFieldMap: Map<string, string>;
  }
): any {
  const {
    relationName,
    columnId,
    transposedRowData,
    rowDataCopy,
    objectsWithoutNameFieldMap,
    nameFieldMap,
  } = opts;

  try {
    if (value == null) return value;
    if (!relationName) return value;
    if (!columnId || typeof columnId !== 'string') return value;
    if (!Array.isArray(transposedRowData) || !Array.isArray(rowDataCopy)) return value;

    // Excluded relation names
    if (
      relationName === 'Parent' ||
      relationName === 'MasterRecord' ||
      relationName === 'DandbCompany' ||
      relationName === 'OperatingHours'
    ) {
      return value;
    }

    // Determine the parent object's display field (not always Name)
    let parentLookupFieldName = 'Name';
    const idPrefix = typeof value === 'string' && value.length >= 3 ? value.substring(0, 3) : '';
    const lookupObject = idPrefix ? objectsWithoutNameFieldMap.get(idPrefix) : undefined;
    if (lookupObject) {
      const mapped = nameFieldMap.get(lookupObject);
      if (!mapped) return value; // Unknown mapping; return raw value
      parentLookupFieldName = mapped;
    }

    // Find the Id row from transposed data
    const idRow = Array.isArray(transposedRowData)
      ? transposedRowData.find((r) => r?.property === 'Id')
      : undefined;
    if (!idRow) return value;

    const rowId = idRow[columnId];
    if (!rowId) return value;

    const normalizedRow = Array.isArray(rowDataCopy)
      ? (rowDataCopy.find((r: any) => r?.Id === rowId) as SObject | undefined)
      : undefined;
    const candidate = (normalizedRow as any)?.[relationName]?.[parentLookupFieldName];
    return typeof candidate !== 'undefined' ? candidate : value;
  } catch {
    return value;
  }
}
