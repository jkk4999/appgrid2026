import { useCallback } from 'react';
import type {
  ColumnPivotModeChangedEvent,
  FilterChangedEvent,
  StateUpdatedEvent,
} from 'ag-grid-community';

export interface UseGridEventsOptions {
  handleGridStateChange: () => void;
  setPivotMode?: (v: boolean) => void;
  // Optional extras to keep component-specific logic
  onFilterChangedExtras?: (event: FilterChangedEvent) => void;
  onStateUpdatedExtras?: (event: StateUpdatedEvent) => void;
  // Called after handleGridStateChange for each state-changing event (useful for subgrid tree prefs save)
  onGridStateChangeExtras?: () => void;
}

export function useGridEvents({
  handleGridStateChange,
  setPivotMode,
  onFilterChangedExtras,
  onStateUpdatedExtras,
  onGridStateChangeExtras,
}: UseGridEventsOptions) {
  const onColumnPinned = useCallback(() => {
    handleGridStateChange();
    onGridStateChangeExtras?.();
  }, [handleGridStateChange, onGridStateChangeExtras]);

  const onColumnResized = useCallback(() => {
    handleGridStateChange();
    onGridStateChangeExtras?.();
  }, [handleGridStateChange, onGridStateChangeExtras]);

  const onColumnRowGroupChanged = useCallback(() => {
    handleGridStateChange();
    onGridStateChangeExtras?.();
  }, [handleGridStateChange, onGridStateChangeExtras]);

  const onColumnVisible = useCallback(() => {
    handleGridStateChange();
    onGridStateChangeExtras?.();
  }, [handleGridStateChange, onGridStateChangeExtras]);

  const onColumnPivotModeChanged = useCallback((event: ColumnPivotModeChangedEvent) => {
    const pivot = event.api.isPivotMode();
    setPivotMode?.(pivot);
    handleGridStateChange();
    onGridStateChangeExtras?.();
  }, [handleGridStateChange, onGridStateChangeExtras, setPivotMode]);

  const onColumnPivotChanged = useCallback(() => {
    handleGridStateChange();
    onGridStateChangeExtras?.();
  }, [handleGridStateChange, onGridStateChangeExtras]);

  const onFilterChanged = useCallback((event: FilterChangedEvent) => {
    onFilterChangedExtras?.(event);
    handleGridStateChange();
    onGridStateChangeExtras?.();
  }, [handleGridStateChange, onFilterChangedExtras, onGridStateChangeExtras]);

  const onColumnValueChanged = useCallback(() => {
    handleGridStateChange();
    onGridStateChangeExtras?.();
  }, [handleGridStateChange, onGridStateChangeExtras]);

  const onSortChanged = useCallback(() => {
    handleGridStateChange();
    onGridStateChangeExtras?.();
  }, [handleGridStateChange, onGridStateChangeExtras]);

  const onStateUpdated = useCallback((event: StateUpdatedEvent) => {
    onStateUpdatedExtras?.(event);
    onGridStateChangeExtras?.();
  }, [onStateUpdatedExtras, onGridStateChangeExtras]);

  return {
    onColumnPinned,
    onColumnResized,
    onColumnRowGroupChanged,
    onColumnVisible,
    onColumnPivotModeChanged,
    onColumnPivotChanged,
    onFilterChanged,
    onSortChanged,
    onStateUpdated,
    onColumnValueChanged,
  };
}
