import { useEffect, useMemo, useRef } from 'react';

import type { SideBarDef } from 'ag-grid-community';
import {
  getDefaultStatusBarPanels,
  type StatusBarVariant
} from '../grid/config/statusBar';

export interface UseGridContainerParams {
  isSubgrid: boolean;
  setPivotMode: (checked: boolean) => void;
  handleGridStateChange: () => void;
  includeFilters?: boolean;
  filtersParams?: Record<string, any>;
  position?: 'left' | 'right';
  columnsPanelId?: string;
  filtersPanelId?: string;
  columnManagerToolPanel?: string;
  columnsPanelWidth?: number;
  includeStatusBar?: boolean;
  statusBarPanels?: { statusPanel: string }[];
  statusBarVariant?: StatusBarVariant;
  columnManagerParams?: Record<string, any>;
}

export function useGridContainer({
  setPivotMode,
  handleGridStateChange,
  includeFilters = true,
  filtersParams = { suppressSyncLayoutWithGrid: true },
  position = 'right',
  columnsPanelId = 'columns',
  filtersPanelId = 'filters',
  columnManagerToolPanel = 'columnManager',
  columnsPanelWidth,
  includeStatusBar = true,
  statusBarPanels,
  statusBarVariant = 'default',
  columnManagerParams,
  isSubgrid
}: UseGridContainerParams): {
  sideBar: SideBarDef;
  statusBar: { statusPanels: { statusPanel: string }[] } | undefined;
} {
  const setPivotModeRef = useRef<typeof setPivotMode>(() => {});

  const handleGridStateChangeRef = useRef<typeof handleGridStateChange>(
    () => {}
  );

  const sideBar: SideBarDef = useMemo(() => {
    const toolPanels: any[] = [
      {
        id: columnsPanelId,
        labelDefault: 'Columns',
        labelKey: 'columns',
        iconKey: 'columns',
        toolPanel: columnManagerToolPanel,
        toolPanelParams: {
          isSubgrid: isSubgrid,
          setPivotMode: (checked: boolean) =>
            setPivotModeRef.current?.(checked),
          handleGridStateChange: () => handleGridStateChangeRef.current?.(),
          ...(columnManagerParams || {}),
          // If a provider function is given, evaluate here so downstream components
          // see a stable snapshot rather than a stale function in some environments.
          ...(columnManagerParams?.getColumnDefs
            ? { getColumnDefs: columnManagerParams.getColumnDefs }
            : {}),
          ...(columnManagerParams?.columnsVersion
            ? { columnsVersion: columnManagerParams.columnsVersion }
            : {})
        },
        ...(columnsPanelWidth ? { width: columnsPanelWidth } : {})
      }
    ];

    if (includeFilters) {
      toolPanels.push({
        id: filtersPanelId,
        labelDefault: 'Filters',
        labelKey: 'filters',
        iconKey: 'filter',
        toolPanel: 'agFiltersToolPanel',
        toolPanelParams: filtersParams
      });
    }

    return {
      toolPanels,
      hiddenByDefault: false,
      position
    } as SideBarDef;
  }, [
    columnsPanelId,
    columnManagerToolPanel,
    columnsPanelWidth,
    filtersPanelId,
    filtersParams,
    includeFilters,
    position,
    columnManagerParams,
    isSubgrid
  ]);

  const statusBar = includeStatusBar
    ? {
        statusPanels:
          statusBarPanels && statusBarPanels.length
            ? statusBarPanels
            : getDefaultStatusBarPanels(statusBarVariant)
      }
    : undefined;

  useEffect(() => {
    setPivotModeRef.current = setPivotMode;
  }, [setPivotMode]);

  useEffect(() => {
    handleGridStateChangeRef.current = handleGridStateChange;
  }, [handleGridStateChange]);

  return { sideBar, statusBar };
}
