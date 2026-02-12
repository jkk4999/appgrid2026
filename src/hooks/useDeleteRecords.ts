import { useCallback } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { BatchDeleteResponse, SObjectDeleteResult } from '../sObjectMetadataTypes';

type EnqueueFn = (
  msg: string,
  opts?: {
    variant?: 'error' | 'success' | 'info' | 'warning';
    autoHideDuration?: number | null;
    action?: any;
  }
) => void;

export interface GuardResult {
  allowed: boolean;
  message?: string;
}

export interface UseDeleteRecordsOptions {
  getGridApi: () => GridApi | null | undefined;
  guardDelete: () => GuardResult;
  apiDelete: (
    ids: string[],
    sObjectName?: string
  ) => Promise<BatchDeleteResponse>;
  enqueue: EnqueueFn;
  onStart?: () => void;
  onFinish?: () => void;
  guardNotPivot?: (op: string) => void; // optional external pivot guard
}

export function useDeleteRecords({
  getGridApi,
  guardDelete,
  apiDelete,
  enqueue,
  onStart,
  onFinish,
  guardNotPivot
}: UseDeleteRecordsOptions) {
  const deleteRecords = useCallback(
    async (
      recordIds: string[],
      sObjectName?: string
    ): Promise<SObjectDeleteResult[]> => {
      const api = getGridApi?.();

      const removeRowById = (id: string): void => {
        const rowNode = api?.getRowNode?.(id);
        if (rowNode) {
          api!.applyTransaction?.({ remove: [rowNode.data] });
        }
      };

      try {
        guardNotPivot?.('delete records');

        const g = guardDelete();
        if (!g.allowed)
          throw new Error(g.message || 'Delete permission not assigned');

        onStart?.();

        // Filter out non-deletable rows and remove unsaved dummy rows
        let rowIdsToDelete = [...recordIds];

        // Remove newly added rows (dummy ids start with 000000)
        rowIdsToDelete = rowIdsToDelete.filter((id) => {
          if (id?.startsWith?.('000000')) {
            removeRowById(id);
            return false;
          }
          return true;
        });

        if (rowIdsToDelete.length === 0) {
          throw new Error('No records to delete!');
        }

        const res = await apiDelete(rowIdsToDelete, sObjectName);

        if (!res || res.status !== 'success') {
          throw new Error(res?.errorMessage || 'Delete operation failed');
        }

        return res.results || [];
      } catch (e: any) {
        enqueue(e?.message || 'An unknown error occurred', {
          variant: 'error',
          autoHideDuration: null
        });
        throw e;
      } finally {
        onFinish?.();
      }
    },
    [
      getGridApi,
      guardDelete,
      apiDelete,
      enqueue,
      onStart,
      onFinish,
      guardNotPivot
    ]
  );

  return { deleteRecords } as const;
}

export default useDeleteRecords;
