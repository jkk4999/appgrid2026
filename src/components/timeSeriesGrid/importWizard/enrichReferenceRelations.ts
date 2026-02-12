import type { RefObject } from 'react';
import type { SObjectFieldMetadata, SObjectMetadata } from '../../../sObjectMetadataTypes';
import type { APIClient, QueryServiceParams } from '../../../brideDesignPattern/apiInterface';
import { guessSObjectFromIdPrefix, getPreferredNameFieldForObject } from './nameFieldMappings';
import { prettyPrint } from '../../../utilities/prettyPrint';

// Simple Salesforce Id check
const isSalesforceId = (v: any): v is string => typeof v === 'string' && /^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$/.test(v);

export async function enrichReferenceRelations(params: {
  apiClient: APIClient;
  metaFields: SObjectFieldMetadata[];
  rows: any[];
  objMetadataMap?: RefObject<Map<string, SObjectMetadata>>;
}): Promise<any[]> {
  const { apiClient, metaFields, rows, objMetadataMap } = params;

  prettyPrint('[enrichReferenceRelations] Starting reference enrichment', {
    rowCount: rows?.length ?? 0,
    fieldCount: metaFields?.length ?? 0
  }, 'blue');

  if (!Array.isArray(rows) || rows.length === 0) {
    prettyPrint('[enrichReferenceRelations] No rows to enrich', null, 'gray');
    return rows || [];
  }

  const nextRows = rows.map((r) => ({ ...r }));

  // Build a list of reference fields
  const refFields = (metaFields || []).filter((f) => f.type === 'REFERENCE');
  if (!refFields.length) {
    prettyPrint('[enrichReferenceRelations] No reference fields found', null, 'gray');
    return nextRows;
  }

  prettyPrint('[enrichReferenceRelations] Processing reference fields', {
    refFieldCount: refFields.length,
    fieldNames: refFields.map(f => f.name)
  }, 'blue');

  // For each reference field, fetch Name by Id (batched) and attach relation object under relationshipName
  for (const f of refFields) {
    const relName = f.relationshipName || undefined;
    if (!relName) continue;

    // Collect unique Ids present in rows for this field
    const ids = new Set<string>();
    for (const r of nextRows) {
      const v = r?.[f.name];
      if (isSalesforceId(v)) ids.add(v);
    }
    if (ids.size === 0) continue;

    const idList = Array.from(ids);

    // Helper to get metadata and Name field for an sObject
    const getMeta = async (sObjectName: string): Promise<{ nameField: string } | null> => {
      try {
        let meta: SObjectMetadata | undefined = objMetadataMap?.current?.get(sObjectName);
        if (!meta) {
          meta = await apiClient.getMetadata({ sObjectName });
          objMetadataMap?.current?.set(sObjectName, meta);
        }
        const defaultNameField = meta?.fields?.find((x) => (x as any).isNameField)?.name || 'Name';
        const nameField = getPreferredNameFieldForObject(sObjectName, defaultNameField);
        return { nameField };
      } catch (e: any) {
        prettyPrint(`[enrichReferenceRelations] Failed to get metadata for ${sObjectName}`, {
          error: e?.message || String(e),
          fieldName: f.name
        }, 'red');
        return null;
      }
    };

    // Batched fetch by sObject and Id list
    const fetchByIds = async (sObjectName: string, idChunk: string[], nameField: string): Promise<Record<string, { Id: string; Name: string }>> => {
      const out: Record<string, { Id: string; Name: string }> = {};
      try {
        const queryRule = { condition: 'and', rules: [{ field: 'Id', operator: 'in', type: 'string', value: idChunk }] };
        const paramsObj: QueryServiceParams = { sObjectName, queryRule: JSON.stringify(queryRule), subQueryRule: null, subQueryRelation: null } as any;
        const res = await apiClient.executeDynamicSOQL(paramsObj);

        if (res?.status === 'error') {
          prettyPrint(`[enrichReferenceRelations] Query failed for ${sObjectName}`, {
            idCount: idChunk.length,
            error: res.errorMessage
          }, 'orange');
          return out;
        }

        if (!Array.isArray(res?.records)) {
          prettyPrint(`[enrichReferenceRelations] No records returned for ${sObjectName}`, {
            idCount: idChunk.length
          }, 'gray');
          return out;
        }

        for (const rec of res.records) {
          const label = rec?.[nameField] || rec?.Name || rec?.Id;
          const key = String(rec?.Id);
          if (key) out[key] = { Id: String(rec.Id), Name: String(label) };
        }

        prettyPrint(`[enrichReferenceRelations] Fetched ${Object.keys(out).length} records for ${sObjectName}`, {
          requested: idChunk.length,
          retrieved: Object.keys(out).length
        }, 'blue');
      } catch (e: any) {
        prettyPrint(`[enrichReferenceRelations] Failed to fetch records for ${sObjectName}`, {
          error: e?.message || String(e),
          idCount: idChunk.length
        }, 'red');
      }
      return out;
    };

    // If non-polymorphic, fetch by known sObject
    if (Array.isArray(f.referenceTo) && f.referenceTo.length === 1) {
      const sobj = f.referenceTo[0];
      const meta = await getMeta(sobj);
      const nameField = meta?.nameField || 'Name';
      const cache = new Map<string, { Id: string; Name: string } | null>();
      // Chunk to respect SOQL limits (<= 1000 values). Use 200 to be safe.
      const chunkSize = 200;
      for (let i = 0; i < idList.length; i += chunkSize) {
        const slice = idList.slice(i, i + chunkSize);
        const resultMap = await fetchByIds(sobj, slice, nameField);
        for (const id of slice) cache.set(id, resultMap[id] || null);
      }
      // Attach to rows
      for (const r of nextRows) {
        const id = r?.[f.name];
        if (isSalesforceId(id)) {
          const rel = cache.get(id);
          if (rel) (r as any)[relName] = rel;
        }
      }
    } else {
      // Polymorphic: resolve object type per Id first, then fetch
      const typePerId = new Map<string, string | null>();
      const unknown: string[] = [];
      for (const id of idList) {
        const guess = guessSObjectFromIdPrefix(id);
        if (guess) typePerId.set(id, guess); else unknown.push(id);
      }
      // Resolve unknown via API (no batch available)
      if (unknown.length > 0) {
        prettyPrint(`[enrichReferenceRelations] Resolving ${unknown.length} unknown polymorphic IDs`, {
          fieldName: f.name,
          unknownIds: unknown
        }, 'blue');
      }

      for (const id of unknown) {
        try {
          const resp = await apiClient.getSObjectName({ recordId: id });
          const sobj = resp?.status === 'success' ? resp.sObjectName : null;
          typePerId.set(id, sobj);

          if (!sobj) {
            prettyPrint(`[enrichReferenceRelations] Could not resolve sObject for ID ${id}`, null, 'orange');
          }
        } catch (e: any) {
          prettyPrint(`[enrichReferenceRelations] Failed to get sObject name for ID ${id}`, {
            error: e?.message || String(e)
          }, 'red');
          typePerId.set(id, null);
        }
      }
      // Group ids by sObject
      const byType = new Map<string, string[]>();
      for (const id of idList) {
        const sobj = typePerId.get(id);
        if (!sobj) continue;
        if (!byType.has(sobj)) byType.set(sobj, []);
        byType.get(sobj)!.push(id);
      }
      // Batched fetch per sObject
      const cache = new Map<string, { Id: string; Name: string } | null>();
      for (const [sobj, idsForType] of Array.from(byType.entries())) {
        const meta = await getMeta(sobj);
        const nameField = meta?.nameField || 'Name';
        const chunkSize = 200;
        for (let i = 0; i < idsForType.length; i += chunkSize) {
          const slice = idsForType.slice(i, i + chunkSize);
          const resultMap = await fetchByIds(sobj, slice, nameField);
          for (const id of slice) cache.set(id, resultMap[id] || null);
        }
      }
      for (const r of nextRows) {
        const id = r?.[f.name];
        if (isSalesforceId(id)) {
          const rel = cache.get(id);
          if (rel) (r as any)[relName] = rel;
        }
      }
    }
  }

  prettyPrint('[enrichReferenceRelations] Reference enrichment complete', {
    processedFields: refFields.length,
    totalRows: nextRows.length
  }, 'green');

  return nextRows;
}
