import { useCallback } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { SObjectDeleteResult } from '../sObjectMetadataTypes';
import {
  handleRecordDeleteConfirmation,
  handleTemplateDeleteConfirmation,
} from '../events/dialogs';

type EnqueueFn = (
  msg: string,
  opts?: { variant?: 'error' | 'success' | 'info' | 'warning'; autoHideDuration?: number | null; persist?: boolean; action?: any }
) => void;

export interface UseDeleteHandlersOptions {
  context: 'main' | 'subgrid';
  getGridApi: () => GridApi | null | undefined;

  // common deps
  deleteRecords: (recordIds: string[], sObjectName: string) => Promise<SObjectDeleteResult[]>;
  enqueue: EnqueueFn;
  setRowError: (rowId: string, errorMsg: string) => void;
  showErrorColumn: (visible: boolean) => void;
  showErrorRecords?: (visible: boolean) => void;
  clearErrors?: () => void;

  // record delete specifics
  recordSObjectApiName?: string; // defaults to template sobject to preserve current usage
  onRecordsReload?: () => void; // emitRunQuery or emitRefreshSubgridQuery wrapper

  // template delete specifics
  selectedViewId?: string | null;
  reloadViews?: () => Promise<Array<{ id?: string }>>;
  setViewOptions?: (views: Array<{ id?: string }>) => void;
  setSelectedView?: (view: any | null) => void;
  onTemplateReload?: () => void; // optional; subgrid emits refresh
  templateSObjectApiName?: string; // default 'AppGridAg__AG_View__c'
  // Separate delete function for templates (without pivot guard) - falls back to deleteRecords if not provided
  deleteTemplateRecords?: (recordIds: string[], sObjectName: string) => Promise<SObjectDeleteResult[]>;
}

export function useDeleteHandlers({
  getGridApi,
  deleteRecords,
  enqueue,
  setRowError,
  showErrorColumn,
  showErrorRecords,
  clearErrors,
  recordSObjectApiName = 'AppGridAg__AG_View__c',
  onRecordsReload,
  selectedViewId,
  reloadViews,
  setViewOptions,
  setSelectedView,
  onTemplateReload,
  templateSObjectApiName = 'AppGridAg__AG_View__c',
  deleteTemplateRecords,
}: UseDeleteHandlersOptions) {
  /**
   * @deprecated Use deleteRecordsAction instead with the unified confirmation dialog
   */
  const onRecordDeleteConfirmation = useCallback(
    async (confirmed: boolean) => {
      const api = getGridApi?.();
      if (!api) return;
      const selectedNodes = api.getSelectedNodes?.() || [];
      const recIds = selectedNodes.map((n: any) => n.data?.Id).filter(Boolean);

      await handleRecordDeleteConfirmation({
        confirmed,
        recordIds: recIds,
        sObjectApiName: recordSObjectApiName,
        deleteRecords,
        enqueue,
        setRowError,
        showErrorColumn,
        showErrorRecords,
        clearErrors,
        emitReload: onRecordsReload,
      });
    },
    [getGridApi, recordSObjectApiName, deleteRecords, enqueue, setRowError, showErrorColumn, showErrorRecords, clearErrors, onRecordsReload]
  );

  /**
   * @deprecated Use deleteTemplateAction instead with the unified confirmation dialog
   */
  const onTemplateDeleteConfirmation = useCallback(
    async (confirmed: boolean) => {
      // Use deleteTemplateRecords (no pivot guard) if provided, else fall back to deleteRecords
      const deleteFn = deleteTemplateRecords ?? deleteRecords;
      await handleTemplateDeleteConfirmation({
        confirmed,
        selectedViewId: selectedViewId ?? null,
        sObjectApiName: templateSObjectApiName,
        deleteRecords: deleteFn,
        enqueue,
        setRowError,
        showErrorColumn,
        reloadViews: reloadViews!,
        setViewOptions: setViewOptions!,
        setSelectedView: setSelectedView!,
        emitReload: onTemplateReload,
      });
    },
    [selectedViewId, templateSObjectApiName, deleteRecords, deleteTemplateRecords, enqueue, setRowError, showErrorColumn, reloadViews, setViewOptions, setSelectedView, onTemplateReload]
  );

  /**
   * Direct delete records action (call after confirmation)
   */
  const deleteRecordsAction = useCallback(
    async () => {
      const api = getGridApi?.();
      if (!api) return;
      const selectedNodes = api.getSelectedNodes?.() || [];
      const recIds = selectedNodes.map((n: any) => n.data?.Id).filter(Boolean);

      await handleRecordDeleteConfirmation({
        confirmed: true,
        recordIds: recIds,
        sObjectApiName: recordSObjectApiName,
        deleteRecords,
        enqueue,
        setRowError,
        showErrorColumn,
        showErrorRecords,
        clearErrors,
        emitReload: onRecordsReload,
      });
    },
    [getGridApi, recordSObjectApiName, deleteRecords, enqueue, setRowError, showErrorColumn, showErrorRecords, clearErrors, onRecordsReload]
  );

  /**
   * Direct delete template action (call after confirmation)
   */
  const deleteTemplateAction = useCallback(
    async () => {
      // Use deleteTemplateRecords (no pivot guard) if provided, else fall back to deleteRecords
      const deleteFn = deleteTemplateRecords ?? deleteRecords;
      await handleTemplateDeleteConfirmation({
        confirmed: true,
        selectedViewId: selectedViewId ?? null,
        sObjectApiName: templateSObjectApiName,
        deleteRecords: deleteFn,
        enqueue,
        setRowError,
        showErrorColumn,
        reloadViews: reloadViews!,
        setViewOptions: setViewOptions!,
        setSelectedView: setSelectedView!,
        emitReload: onTemplateReload,
      });
    },
    [selectedViewId, templateSObjectApiName, deleteRecords, deleteTemplateRecords, enqueue, setRowError, showErrorColumn, reloadViews, setViewOptions, setSelectedView, onTemplateReload]
  );

  return {
    onRecordDeleteConfirmation,
    onTemplateDeleteConfirmation,
    deleteRecordsAction,
    deleteTemplateAction,
  } as const;
}

