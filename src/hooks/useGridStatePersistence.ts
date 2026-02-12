import { JSX, useCallback, useMemo, useRef } from 'react';
import { debounce, type DebouncedFunc } from 'lodash-es';
import type { GridApi } from 'ag-grid-community';
import type { SnackbarKey } from 'notistack';
import { prettyPrint } from '../utilities/prettyPrint';

export interface GridStateExtras {
  columnStyles: any;
  rowStyles: any;
  calculatedColumns: any;
  filterOptions: any;
}

export interface UseGridStatePersistenceParams {
  // Provide grid api dynamically to support refs (main grid) or direct api (subgrid)
  getGridApi: () => GridApi | null;
  // Guards determining whether we can save now
  canSaveNow: () => boolean;
  // Write combined state locally if desired
  setCurrentState: (state: { gridState: any; columnState: any }) => void;
  // Build payload to upsert from state + extras
  buildUpsertPayload: (
    gridState: any,
    colState: any,
    extras: GridStateExtras
  ) => any;
  // Execute upsert and return success + id
  doUpsert: (payload: any) => Promise<{ success: boolean; id: string }>;
  // Optional callbacks
  onAfterSuccess?: (id: string, payload: any) => Promise<void> | void;
  onFinally?: () => void;
  // Optional busy indicator
  setIsQueryActive?: (val: boolean) => void;
  // Error UI
  enqueueSnackbar?: (
    msg: string,
    opts: {
      action: (key: SnackbarKey | undefined) => JSX.Element;
      variant: 'error' | 'success' | 'info' | 'warning';
    }
  ) => void;
  action?: (key: SnackbarKey | undefined) => JSX.Element;
  // How to fetch extras from the store
  getExtras: () => GridStateExtras;
}

export interface CanSaveDiagnostics {
  canAttemptSave: boolean;
  suspended: boolean;
  suspensionCount: number;
  suspensionReasons: string[];
  canSaveNow: boolean;
  apiAvailable: boolean;
  apiDestroyed: boolean;
}

export function useGridStatePersistence(params: UseGridStatePersistenceParams) {
  const {
    getGridApi,
    canSaveNow,
    setCurrentState,
    buildUpsertPayload,
    doUpsert,
    onAfterSuccess,
    onFinally,
    setIsQueryActive,
    enqueueSnackbar,
    action,
    getExtras
  } = params;

  const isSavePendingRef = useRef(false);
  const suspensionCountRef = useRef(0);
  const suspensionReasonsRef = useRef<string[]>([]);

  const saveAgGridState = useCallback(async (): Promise<string> => {
    if (
      isSavePendingRef.current ||
      suspensionCountRef.current > 0 ||
      !canSaveNow()
    ) {
      return 'pending';
    }

    const api = getGridApi();

    if (!api || (api as any).isDestroyed?.()) {
      return 'pending';
    }

    try {
      isSavePendingRef.current = true;

      setIsQueryActive?.(true);

      const gridState = (api as any).getState?.() ?? {};
      const colState = api.getColumnState?.();

      const filterModel = api.getFilterModel?.() ?? null;

      const advancedFilterModel = api.getAdvancedFilterModel?.() ?? null;

      const normalizedGridState = {
        ...(gridState || {}),
        filter: {
          ...((gridState || {}) as any).filter,
          filterModel,
          advancedFilterModel
        }
      };

      setCurrentState({
        gridState: normalizedGridState,
        columnState: colState
      });

      const extras = getExtras();

      const payload = buildUpsertPayload(normalizedGridState, colState, extras);

      const result = await doUpsert(payload);

      prettyPrint('[GridStatePersistHook] upsert result is', result, 'green');

      if (!result.success) throw new Error('Upsert failed');

      await onAfterSuccess?.(result.id, payload);

      return 'success';
    } catch (e: any) {
      enqueueSnackbar?.('Error saving grid state', {
        action: action!,
        variant: 'error'
      });

      return e?.message ?? 'error';
    } finally {
      isSavePendingRef.current = false;

      setIsQueryActive?.(false);

      onFinally?.();
    }
  }, [
    action,
    buildUpsertPayload,
    canSaveNow,
    doUpsert,
    enqueueSnackbar,
    getExtras,
    getGridApi,
    onAfterSuccess,
    onFinally,
    setCurrentState,
    setIsQueryActive
  ]);

  const debouncedSaveAgGridState = useMemo(
    () =>
      debounce(() => {
        prettyPrint('saving grid state', null, 'blue');
        saveAgGridState();
      }, 300),
    [saveAgGridState]
  );

  const handleGridStateChange = useCallback(() => {
    const api = getGridApi();

    // Check suspension state first - if suspended, exit early without any state changes
    if (suspensionCountRef.current > 0) {
      return;
    }

    const canSaveResult = canSaveNow();
    if (!api || !canSaveResult) {
      return;
    }

    // 🔴 IMMEDIATE: update selectedView
    const gridState = (api as any).getState?.() ?? {};

    const colState = api.getColumnState?.();

    setCurrentState({
      gridState,
      columnState: colState
    });

    if (canSaveNow() && suspensionCountRef.current === 0) {
      debouncedSaveAgGridState();
    }
  }, [canSaveNow, debouncedSaveAgGridState, getGridApi, setCurrentState]);

  // Suspend/resume API for bulk operations (e.g., view apply)
  const suspend = useCallback(
    (reason?: string) => {
      suspensionCountRef.current += 1;

      if (reason) suspensionReasonsRef.current.push(reason);

      // cancel any pending trailing invocation
      (
        debouncedSaveAgGridState as unknown as DebouncedFunc<() => void>
      )?.cancel?.();
    },
    [debouncedSaveAgGridState]
  );

  const resume = useCallback((reason?: string) => {
    // Remove specific reason if provided
    if (reason) {
      const idx = suspensionReasonsRef.current.indexOf(reason);

      if (idx >= 0) suspensionReasonsRef.current.splice(idx, 1);
    }
    suspensionCountRef.current = Math.max(0, suspensionCountRef.current - 1);
  }, []);

  const getCanSaveDiagnostics = useCallback(() => {
    const api = getGridApi();

    const destroyed = !!(api as any)?.isDestroyed?.();

    const apiAvailable = !!api && !destroyed;

    const canNow = !!canSaveNow();

    const suspended = suspensionCountRef.current > 0;

    const canAttemptSave =
      apiAvailable && canNow && !suspended && !isSavePendingRef.current;

    const diag: CanSaveDiagnostics = {
      canAttemptSave,
      suspended,
      suspensionCount: suspensionCountRef.current,
      suspensionReasons: [...suspensionReasonsRef.current],
      canSaveNow: canNow,
      apiAvailable,
      apiDestroyed: destroyed
    };
    return diag;
  }, [canSaveNow, getGridApi]);

  return {
    saveAgGridState,
    debouncedSaveAgGridState,
    handleGridStateChange,
    suspend,
    resume,
    getCanSaveDiagnostics
  };
}
