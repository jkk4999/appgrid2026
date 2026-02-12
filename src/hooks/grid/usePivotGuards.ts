import { useCallback } from 'react';
import type { GridApi } from 'ag-grid-community';

/**
 * Provides helpers to detect pivot view and guard destructive actions.
 */
export function usePivotGuards(getGridApi: () => GridApi | null | undefined) {
  const isPivotView = useCallback(() => {
    try {
      const api = getGridApi?.();
      if (!api) return false;
      const pivotMode = (api as any).isPivotMode?.() || false;
      const pivotColumns = (api as any).getPivotColumns?.() || [];
      return !!pivotMode && Array.isArray(pivotColumns) && pivotColumns.length > 0;
    } catch {
      return false;
    }
  }, [getGridApi]);

  const guardNotPivot = useCallback((actionName?: string) => {
    if (isPivotView()) {
      const verb = actionName || 'perform this action';
      throw new Error(`Cannot ${verb} in pivot view!`);
    }
  }, [isPivotView]);

  return { isPivotView, guardNotPivot } as const;
}

