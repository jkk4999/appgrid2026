import { useCallback, useEffect } from 'react';

import type { GridApi } from 'ag-grid-community';

import type {
  SelectedViewLike,
  ApplySetters,
  ApplyOptions
} from '../viewState/types';

import { applyViewState } from '../viewState/applyViewState';
import { useStableViewRef } from '../viewState/useStableViewRef';

export function useApplyViewState({
  getGridApi,
  selectedView,
  setters,
  opts,
  isReady,
  suspend,
  resume
}: {
  getGridApi: () => GridApi | null | undefined;
  selectedView: SelectedViewLike | null | undefined;
  setters: ApplySetters;
  opts?: ApplyOptions;
  isReady?: boolean;
  suspend?: (reason?: string) => void;
  resume?: (reason?: string) => void;
}) {
  const { key: selectedKey, changed, acknowledge } = useStableViewRef(selectedView);

  const process = useCallback(async () => {
    const api = getGridApi?.();

    if (!api || !selectedView || !isReady) {
      return;
    }

    // Skip if not changed by key
    if (!changed) {
      return;
    }

    // Mark change as consumed now that we know we CAN process.
    // This must happen before the async work so concurrent re-renders
    // don't re-trigger, but only after we've confirmed the grid API is ready.
    acknowledge();

    try {
      suspend?.('applyViewState');
      // Pass skipSetProcessed so applyViewState doesn't set selectedViewProcessed
      // We'll set it here after resume with a delay to avoid triggering saves
      await applyViewState({ gridApi: api, selectedView, setters, opts: { ...opts, skipSetProcessed: true } });

      // Auto-size columns after applying view state
      // Note: In pivot mode, AG Grid's autoSizeColumns does not consider column group headers,
      // so pivot column headers may appear truncated. Users can manually resize columns if needed.
      requestAnimationFrame(() => {
        setTimeout(() => {
          if ((api as any).isDestroyed?.()) return;
          const allColumnIds = api.getAllDisplayedColumns()?.map(col => col.getColId()) || [];
          if (allColumnIds.length > 0) {
            api.autoSizeColumns(allColumnIds, false);
          }
        }, 50);
      });
    } finally {
      // First set selectedViewProcessed BEFORE resume, so any effects that depend on it
      // will run while we're still suspended
      setters.setSelectedViewProcessed?.(true);

      // Delay the resume to allow React effects triggered by setSelectedViewProcessed
      // to complete while still suspended. This prevents saves from being triggered
      // during initial view state application.
      setTimeout(() => {
        resume?.('applyViewState');
      }, 500);
    }
  }, [
    acknowledge,
    changed,
    getGridApi,
    isReady,
    opts,
    selectedView,
    setters,
    suspend,
    resume
  ]);

  useEffect(() => {
    process();
  }, [process, selectedKey]);
}
