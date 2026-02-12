import type { SObjectDeleteResult } from '../sObjectMetadataTypes';

export interface DeleteRecordsDeps {
  enqueue: (
    msg: string,
    opts?: {
      variant?: 'error' | 'success' | 'info' | 'warning';
      autoHideDuration?: number | null;
      persist?: boolean;
      action?: any;
    }
  ) => void;
  setRowError: (rowId: string, errorMsg: string) => void;
  showErrorColumn: (visible: boolean) => void;
  showErrorRecords?: (visible: boolean) => void; // optional: some flows only toggle column
  clearErrors?: () => void;
  // Emitters for reload — choose one per caller
  emitReload?: () => void; // e.g., emitRunQuery or emitRefreshSubgridQuery
}

export interface HandleRecordDeleteParams extends DeleteRecordsDeps {
  confirmed: boolean;
  recordIds: string[]; // explicit list from selection
  sObjectApiName: string;
  deleteRecords: (
    recordIds: string[],
    sObjectName: string
  ) => Promise<SObjectDeleteResult[]>;
}

export async function handleRecordDeleteConfirmation({
  confirmed,
  recordIds,
  sObjectApiName,
  deleteRecords,
  enqueue,
  setRowError,
  showErrorColumn,
  showErrorRecords,
  clearErrors,
  emitReload
}: HandleRecordDeleteParams) {
  if (!confirmed) return;

  try {
    if (!recordIds || recordIds.length === 0) return;

    const raw = await deleteRecords(recordIds, sObjectApiName);

    // Normalize various API response shapes into a common array
    // Supported shapes:
    // - Array<{ id|recordId, isSuccess|status, errors|errorMessages }>
    // - { results: Array<...> }
    // - stringified JSON of the above
    let result: Array<any> = [];
    try {
      if (Array.isArray(raw)) {
        result = raw as any[];
      } else if (typeof raw === 'string') {
        const parsed = JSON.parse(raw);
        result = Array.isArray(parsed?.results) ? parsed.results : (Array.isArray(parsed) ? parsed : []);
      } else if (raw && typeof raw === 'object') {
        result = Array.isArray((raw as any).results) ? (raw as any).results : [];
      }
    } catch {
      // fallback: nothing parsed, treat as empty
      result = [];
    }

    let hasErrors = false;
    for (const res of result) {
      const ok = (res as any).isSuccess ?? (res as any).status; // tolerate mixed shapes
      if (!ok) {
        hasErrors = true;
        const recId = (res as any).recordId as string | undefined;
        const errors = (res as any).errors || (res as any).errorMessages || [];
        const errMsg = Array.isArray(errors) && errors.length
          ? `ERROR - ${errors[0]}`
          : ((res as any).errorMessage ? `ERROR - ${(res as any).errorMessage}` : 'ERROR');
        if (recId) setRowError(recId, errMsg);
      }
    }

    if (hasErrors) {
      enqueue('One or more records failed validation', {
        variant: 'error',
        autoHideDuration: null
      });
      // Reflect any successful deletions in the UI even if some failed
      emitReload?.();
      showErrorColumn(true);
      showErrorRecords?.(true);
      return;
    }

    // Success
    enqueue('Records deleted!', { variant: 'success', autoHideDuration: 3000 });
    showErrorColumn(false);
    showErrorRecords?.(false);
    clearErrors?.();
    emitReload?.();
  } catch (e: any) {
    // When the API call itself fails (e.g., 500 error), mark all the records being deleted with the error
    const errorMsg = e?.message ?? (e?.body?.message || e?.statusText || String(e));
    for (const recId of recordIds) {
      setRowError(recId, `ERROR - ${errorMsg}`);
    }
    showErrorColumn(true);
    showErrorRecords?.(true);
    enqueue(`Error deleting records - ${errorMsg}`, {
      variant: 'error',
      autoHideDuration: null
    });
  }
}

export interface HandleTemplateDeleteParams extends DeleteRecordsDeps {
  confirmed: boolean;
  selectedViewId: string | null;
  sObjectApiName: string; // typically 'AppGridAg__AG_View__c'
  deleteRecords: (
    recordIds: string[],
    sObjectName: string
  ) => Promise<SObjectDeleteResult[]>;
  // View list refresh + selection update provided by caller to keep this generic
  reloadViews: () => Promise<Array<{ id?: string }>>;
  setViewOptions: (views: Array<{ id?: string }>) => void;
  setSelectedView: (view: any | null) => void;
}

export async function handleTemplateDeleteConfirmation({
  confirmed,
  selectedViewId,
  sObjectApiName,
  deleteRecords,
  enqueue,
  setRowError,
  reloadViews,
  setViewOptions,
  setSelectedView,
  emitReload
}: HandleTemplateDeleteParams) {
  if (!confirmed) return;

  try {
    if (!selectedViewId) return;
    const res = await deleteRecords([selectedViewId], sObjectApiName);

    const failed = res.filter(
      (r) => !((r as any).isSuccess ?? (r as any).status)
    );
    if (failed.length) {
      for (const r of failed) {
        const errMsg = r.errorMessages?.[0]
          ? `ERROR - ${r.errorMessages[0]}`
          : (r.errors?.[0] ? `ERROR - ${r.errors[0]}` : 'ERROR');
        if (r.id) setRowError(r.id, errMsg);
      }
      throw new Error('Error deleting template');
    }

    enqueue('Template deleted!', {
      variant: 'success',
      autoHideDuration: 3000
    });

    // Refresh view list and selection
    const views = await reloadViews();
    setViewOptions(views);
    if (views.length > 0) {
      setSelectedView(views[0]);
    } else {
      setSelectedView(null);
    }

    // Allow callers (like Subgrid) to refresh their view
    emitReload?.();
  } catch (e: any) {
    enqueue(`Error deleting template - ${e?.message ?? e}`, {
      variant: 'error'
    });
  }
}
