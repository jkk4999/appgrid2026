import { JSX, useCallback, useMemo, useRef } from 'react';
import { debounce, type DebouncedFunc } from 'lodash-es';
import type { GridApi } from 'ag-grid-community';
import type { SnackbarKey } from 'notistack';

import { prettyPrint } from '../utilities/prettyPrint';
import { createGridStateAccessor } from '../store/gridStateAccessor';

/**
 * Extras needed for persisting grid state.
 */
export interface GridStateExtras {
  columnStyles: any;
  rowStyles: any;
  calculatedColumns: any;
  filterOptions: any;
}

/**
 * Simplified parameters for grid state persistence.
 * Uses the grid state accessor pattern to reduce parameter count.
 */
export interface UseSimplifiedGridPersistenceParams {
  /** Whether this is a subgrid */
  isSubgrid: boolean;
  /** Get the grid API */
  getGridApi: () => GridApi | null;
  /** Determine if save is allowed now */
  canSaveNow: () => boolean;
  /** Build the upsert payload */
  buildUpsertPayload: (gridState: any, colState: any, extras: GridStateExtras) => any;
  /** Execute the upsert */
  doUpsert: (payload: any) => Promise<{ success: boolean; id: string }>;
  /** Optional: callback after successful save */
  onAfterSuccess?: (id: string) => Promise<void> | void;
  /** Optional: callback in finally block */
  onFinally?: () => void;
  /** Optional: set query active indicator */
  setIsQueryActive?: (val: boolean) => void;
  /** Optional: show snackbar errors */
  enqueueSnackbar?: (
    msg: string,
    opts: { action: (key: SnackbarKey | undefined) => JSX.Element; variant: string }
  ) => void;
  /** Optional: action for snackbar */
  action?: (key: SnackbarKey | undefined) => JSX.Element;
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

/**
 * Simplified grid state persistence hook.
 *
 * This hook uses the GridStateAccessor pattern to automatically
 * fetch extras (styles, calculated columns, filter options) based on isSubgrid.
 *
 * @example
 * ```tsx
 * const { saveAgGridState, suspend, resume } = useSimplifiedGridPersistence({
 *   isSubgrid: false,
 *   getGridApi: () => gridApiRef.current,
 *   canSaveNow: () => !!selectedView,
 *   buildUpsertPayload: (gridState, colState, extras) => ({ ... }),
 *   doUpsert: async (payload) => apiClient.upsertView(payload),
 * });
 * ```
 */
export function useSimplifiedGridPersistence(params: UseSimplifiedGridPersistenceParams) {
  const {
    isSubgrid,
    getGridApi,
    canSaveNow,
    buildUpsertPayload,
    doUpsert,
    onAfterSuccess,
    onFinally,
    setIsQueryActive,
    enqueueSnackbar,
    action,
  } = params;

  // Create accessor bound to this grid type
  const accessor = useMemo(() => createGridStateAccessor(isSubgrid), [isSubgrid]);

  const isSavePendingRef = useRef(false);
  const suspensionCountRef = useRef(0);
  const suspensionReasonsRef = useRef<string[]>([]);

  // Get extras from the accessor
  const getExtras = useCallback((): GridStateExtras => {
    const styles = accessor.getStyles();
    return {
      columnStyles: styles.columns,
      rowStyles: styles.rows,
      calculatedColumns: accessor.getCalculatedColumns(),
      filterOptions: accessor.getFilterOptions(),
    };
  }, [accessor]);

  // Set current state in the store
  const setCurrentState = useCallback(
    (state: { gridState: any; columnState: any }) => {
      accessor.setGridState(state.gridState);
      accessor.setColumnState(state.columnState);
    },
    [accessor]
  );

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
          advancedFilterModel,
        },
      };

      prettyPrint('[GridStatePersist] saving filterModel', filterModel, 'blue');
      prettyPrint('[GridStatePersist] saving advancedFilterModel', advancedFilterModel, 'blue');

      setCurrentState({ gridState: normalizedGridState, columnState: colState });

      const extras = getExtras();
      const payload = buildUpsertPayload(normalizedGridState, colState, extras);
      const result = await doUpsert(payload);

      prettyPrint('[GridStatePersist] upsert result', result, 'green');

      if (!result.success) throw new Error('Upsert failed');

      await onAfterSuccess?.(result.id);

      return 'success';
    } catch (e: any) {
      enqueueSnackbar?.('Error saving grid state', {
        action: action!,
        variant: 'error',
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
    setIsQueryActive,
  ]);

  const debouncedSaveAgGridState = useMemo(
    () =>
      debounce(() => {
        saveAgGridState();
      }, 500),
    [saveAgGridState]
  );

  const handleGridStateChange = useCallback(() => {
    if (suspensionCountRef.current > 0) return;
    if (canSaveNow()) debouncedSaveAgGridState();
  }, [canSaveNow, debouncedSaveAgGridState]);

  const suspend = useCallback(
    (reason?: string) => {
      suspensionCountRef.current += 1;
      if (reason) suspensionReasonsRef.current.push(reason);
      (debouncedSaveAgGridState as unknown as DebouncedFunc<() => void>)?.cancel?.();
    },
    [debouncedSaveAgGridState]
  );

  const resume = useCallback((reason?: string) => {
    if (reason) {
      const idx = suspensionReasonsRef.current.indexOf(reason);
      if (idx >= 0) suspensionReasonsRef.current.splice(idx, 1);
    }
    suspensionCountRef.current = Math.max(0, suspensionCountRef.current - 1);
  }, []);

  const getCanSaveDiagnostics = useCallback((): CanSaveDiagnostics => {
    const api = getGridApi();
    const destroyed = !!(api as any)?.isDestroyed?.();
    const apiAvailable = !!api && !destroyed;
    const canNow = !!canSaveNow();
    const suspended = suspensionCountRef.current > 0;
    const canAttemptSave =
      apiAvailable && canNow && !suspended && !isSavePendingRef.current;
    return {
      canAttemptSave,
      suspended,
      suspensionCount: suspensionCountRef.current,
      suspensionReasons: [...suspensionReasonsRef.current],
      canSaveNow: canNow,
      apiAvailable,
      apiDestroyed: destroyed,
    };
  }, [canSaveNow, getGridApi]);

  return {
    saveAgGridState,
    debouncedSaveAgGridState,
    handleGridStateChange,
    suspend,
    resume,
    getCanSaveDiagnostics,
  };
}

export default useSimplifiedGridPersistence;
