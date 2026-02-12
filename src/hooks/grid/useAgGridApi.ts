import React, { useCallback, useRef, useState } from 'react';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';

export function useAgGridApi(): {
  gridApi: GridApi | null;
  gridApiRef: React.MutableRefObject<GridApi | null>;
  onGridReady: (params: GridReadyEvent) => void;
} {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    const api = params.api as any;

    // Monkey-patch removeEventListener to avoid warn #26 in teardown paths
    const originalRemove = api.removeEventListener?.bind(api);
    if (originalRemove) {
      api.removeEventListener = (eventName: any, listener: any) => {
        if (api.isDestroyed?.()) return; // skip if already destroyed
        return originalRemove(eventName, listener);
      };
    }

    setGridApi(api);
    gridApiRef.current = api;
  }, []);

  return { gridApi, gridApiRef, onGridReady };
}
