import { useEffect } from 'react';
import PubSub from 'pubsub-js';
import { TOPICS, ToolbarPayload } from '../events/topics';
import type { GridApi } from 'ag-grid-community';
import type {
  SObject,
  SObjectFieldMetadata,
  SObjectMetadata
} from '../sObjectMetadataTypes';

type Context = 'main' | 'subgrid';

export interface UseRecordSaverParams {
  // core
  getGridApi: () => GridApi | null | undefined;
  changedRows: Set<string>;
  context: Context;
  gridId?: string | number | null;

  // data + metadata
  metadata: SObjectMetadata | null | undefined;
  sObjectApiName: string | null | undefined;

  // api client that supports one of upsert methods
  apiClient: any;

  // error + ui helpers
  setRowError?: (rowId: string, message: string) => void;
  showErrorColumn?: (visible: boolean) => void;
  showErrorRecords?: (showOnlyErrors: boolean) => void;
  rowData?: any[];
  setRowData?: (rows: any[]) => void;
  clearChangedRows?: () => void;

  // notifications
  enqueueSnackbar?: (msg: string, opts?: any) => void;
  action?: any;

  // lifecycle hooks
  onStart?: () => void; // e.g., setIsQueryActive(true) / setLoading(true)
  onFinish?: () => void; // e.g., setIsQueryActive(false) / setLoading(false)
  onSuccess?: () => void; // e.g., refresh/publish events
}

function getChangedRowsData(
  gridApi: GridApi,
  changedRows: Set<string>
): SObject[] {
  return Array.from(changedRows)
    .map((rowId) => {
      const node = gridApi.getRowNode(rowId);
      if (node && (node.group === false || node.group === undefined)) {
        return node.data as SObject;
      }
      return null;
    })
    .filter((d): d is SObject => !!d);
}

function normalizeRecords(
  rows: SObject[],
  metadata: SObjectMetadata
): Partial<SObject>[] {
  const fields = metadata?.fields || [];
  return rows.map((row) => {
    const next: Partial<SObject> = { ...row };

    // remove dummy Id for new rows
    const recId = (next.Id as string) || '';
    if (recId.startsWith('000000')) delete next.Id;

    // iterate fields in the record
    for (const [key, value] of Object.entries(next)) {
      const fieldMetadata: SObjectFieldMetadata | undefined = fields.find(
        (f) => f.name === key
      );
      if (!fieldMetadata) {
        delete next[key as keyof SObject];
        continue;
      }

      // remove calculated fields
      if ((fieldMetadata as any).isCalculated) {
        delete next[key as keyof SObject];
        continue;
      }

      // remove fields that are not creatable or updatable (except Id)
      if (
        key !== 'Id' &&
        (!(fieldMetadata as any).isCreateable ||
          !(fieldMetadata as any).isUpdateable)
      ) {
        delete next[key as keyof SObject];
        continue;
      }

      // DATE / DATETIME normalization
      if ((fieldMetadata as any).type === 'DATE' && value != null) {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          value instanceof Date
        ) {
          const d = value instanceof Date ? value : new Date(value);
          if (isNaN(d.getTime())) {
            delete next[key as keyof SObject];
          } else {
            (next as any)[key] = d.toISOString().split('T')[0];
          }
        } else {
          delete next[key as keyof SObject];
        }
      } else if ((fieldMetadata as any).type === 'DATETIME' && value != null) {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          value instanceof Date
        ) {
          const d = value instanceof Date ? value : new Date(value);
          if (isNaN(d.getTime())) {
            delete next[key as keyof SObject];
          } else {
            (next as any)[key] = d.toISOString();
          }
        } else {
          delete next[key as keyof SObject];
        }
      }
    }

    return next;
  });
}

export function useRecordSaver({
  getGridApi,
  changedRows,
  context,
  gridId,
  metadata,
  sObjectApiName,
  apiClient,
  setRowError,
  showErrorColumn,
  showErrorRecords,
  rowData,
  setRowData,
  clearChangedRows,
  enqueueSnackbar,
  action,
  onStart,
  onFinish,
  onSuccess
}: UseRecordSaverParams) {
  useEffect(() => {
    const topic = TOPICS.SAVE_RECORDS;

    async function saveRecords() {
      const api = getGridApi?.();
      if (!api || !metadata || !sObjectApiName) return;

      try {
        onStart?.();

        const changedData = getChangedRowsData(api, changedRows);
        if (changedData.length === 0) {
          enqueueSnackbar?.('No changes to save!', {
            autoHideDuration: 3000,
            variant: 'info'
          });
          return;
        }

        const recsToUpsert = normalizeRecords(changedData, metadata);
        if (recsToUpsert.length === 0) {
          enqueueSnackbar?.('No changes to save!', {
            autoHideDuration: 3000,
            variant: 'info'
          });
          return;
        }

        const payload = JSON.stringify(recsToUpsert);
        let resultItems: any[] = [];
        // Prefer LWC upsert if available for subgrid; otherwise fall back to Aura client
        if (typeof apiClient?.upsertRecordsService === 'function') {
          resultItems = await apiClient.upsertRecordsService({
            sObjectName: sObjectApiName,
            jsonRecs: payload
          });
        } else if (typeof apiClient?.upsertRecs === 'function') {
          const response = await apiClient.upsertRecs({
            sObjectName: sObjectApiName,
            jsonRecs: payload,
          });
          // Handle batch response structure
          if (response?.status !== 'success') {
            console.error(
              '🔍 [useRecordSaver] upsertRecs FAILED - status:',
              response?.status,
              'errorMessage:',
              response?.errorMessage
            );
            throw new Error(
              response?.errorMessage || 'Upsert operation failed'
            );
          }
          resultItems = response?.results || [];
        } else {
          throw new Error('No upsert method available on apiClient');
        }

        let hasErrors = false;
        const errorIds: string[] = [];

        for (let i = 0; i < resultItems.length; i++) {
          const r = resultItems[i] as any;
          const ok = r?.status === true || r?.isSuccess === true;
          if (!ok) {
            hasErrors = true;
            let originalId = r?.id as string;
            if (!originalId) {
              originalId = (changedData[i] as any)?.Id as string;
            }
            setRowError?.(
              originalId,
              `ERROR - ${r?.errorMessages?.[0] || r?.errors?.[0] || 'Unknown error'}`
            );
            errorIds.push(originalId);
          }
        }

        if (hasErrors) {
          if (rowData && setRowData) {
            try {
              // Keep parity with existing logic that used the synthetic rowId property
              const errorRecs = rowData.filter((r: any) =>
                errorIds.includes(r.rowId)
              );
              setRowData(errorRecs);
            } catch {
              // Fallback: filter by Id if rowId is not present
              const errorRecs = rowData.filter((r: any) =>
                errorIds.includes(r.Id)
              );
              setRowData(errorRecs);
            }
          }
          showErrorColumn?.(true);
          showErrorRecords?.(true);
          enqueueSnackbar?.('Error saving changes', {
            action,
            variant: 'error',
            autoHideDuration: null
          });
        } else {
          showErrorColumn?.(false);
          showErrorRecords?.(false);
          clearChangedRows?.();
          enqueueSnackbar?.('Changes saved!', {
            autoHideDuration: 3000,
            variant: 'success'
          });
          onSuccess?.();
        }
      } catch (e: any) {
        const msg = e?.message
          ? `Error saving changes - ${e.message}`
          : 'Error saving changes';
        enqueueSnackbar?.(msg, {
          action,
          variant: 'error',
          autoHideDuration: null
        });
      } finally {
        onFinish?.();
      }
    }

    const token = PubSub.subscribe(topic, (msg, payload: ToolbarPayload) => {
      // Only handle if payload matches our scope; if no payload provided, default to main only
      const payloadContext = payload?.context;

      const payloadGridId = payload?.gridId;

      const contextMatches = !payloadContext || payloadContext === context;

      const gridMatches =
        typeof payloadGridId === 'undefined' || payloadGridId === gridId;

      if (msg === topic && contextMatches && gridMatches) {
        saveRecords();
      }
    });

    return () => {
      PubSub.unsubscribe(token);
    };
  }, [
    action,
    apiClient,
    changedRows,
    clearChangedRows,
    context,
    gridId,
    enqueueSnackbar,
    getGridApi,
    metadata,
    onFinish,
    onStart,
    onSuccess,
    rowData,
    sObjectApiName,
    setRowData,
    setRowError,
    showErrorColumn,
    showErrorRecords
  ]);
}
