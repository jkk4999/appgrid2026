import type { SObjectFieldMetadata } from '../../../sObjectMetadataTypes';

function toDateStringISO(dateLike: any) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function toDateTimeISO(dateLike: any) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function normalizeImportRecords(
  fields: SObjectFieldMetadata[] | undefined | null,
  rows: any[],
  opts?: { parseNumber?: (raw: any) => { value?: number | null; error?: string } }
): any[] {
  const list = Array.isArray(rows) ? rows : [];
  const flds = Array.isArray(fields) ? fields : [];
  const byApi = new Map<string, SObjectFieldMetadata>(flds.map((f) => [f.name, f]));

  return list.map((row) => {
    const next: Record<string, any> = {};
    for (const [key, value] of Object.entries(row || {})) {
      if (key === '__error') continue; // strip client-only fields
      const f = byApi.get(key);
      if (!f) continue;
      if (f.isCalculated) continue;
      // For import (insert), only include createable fields
      if (f.isCreateable === false) continue;

      // Normalize values per field type
      if (value == null || value === '') { next[key] = null; continue; }

      switch (f.type) {
        case 'DATE': {
          if (typeof value === 'string') {
            // Trim any ISO time part if present
            const s = value.includes('T') ? value.split('T')[0] : value;
            next[key] = s;
            break;
          }
          const v = toDateStringISO(value);
          if (v) next[key] = v; // yyyy-mm-dd
          break;
        }
        case 'CURRENCY':
        case 'DOUBLE':
        case 'DECIMAL':
        case 'INTEGER':
        case 'LONG':
        case 'PERCENT': {
          if (typeof value === 'number') { next[key] = value; break; }
          if (typeof value === 'string' && opts?.parseNumber) {
            const res = opts.parseNumber(value);
            if (res && 'value' in res) { next[key] = res.value as any; break; }
          }
          next[key] = value;
          break;
        }
        case 'DATETIME': {
          const v = typeof value === 'string' ? value : toDateTimeISO(value);
          if (v) next[key] = v; // full ISO
          break;
        }
        case 'MULTIPICKLIST': {
          const raw = Array.isArray(value) ? value.join(';') : String(value);
          const tokens = raw
            .split(';')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          next[key] = tokens.join(';');
          break;
        }
        default:
          next[key] = value;
      }
    }
    return next;
  });
}
