import { useMemo, useCallback } from 'react';
import type { GridApi } from 'ag-grid-community';

// Unified context-based hooks
import {
  useGridViewState,
  useGridFilterState,
  useGridPivotState,
  useGridDialogState,
  useGridGridTypeState,
  useGridStyleState,
  useGridCalculatedColumnState,
  useGridContextErrors,
  type GridContext,
} from './selectors';
import { useMetadataState } from './selectors/useMetadataState';
import { useChartState } from './selectors/useChartState';
import { useFlowState } from './selectors/useFlowState';

import { getStyles, setStyles, type StylesBundle } from '../services/stylesService';
import { getCalculatedColumns, setCalculatedColumns } from '../services/calculatedColumnsService';

/**
 * Options for useGridFacade hook.
 */
export interface UseGridFacadeOptions {
  /** Grid context - 'main' or 'subgrid' */
  context: GridContext;
  /** Function to get the grid API */
  getGridApi?: () => GridApi | null;
}

/**
 * Facade hook that composes all grid-related state and functionality.
 *
 * This provides a single entry point for grid components, reducing the need
 * to import and compose multiple hooks. Both AppGrid and SubgridCore can use
 * this hook with the appropriate `context` parameter.
 *
 * @example
 * ```tsx
 * const grid = useGridFacade({ context: 'main', getGridApi: () => gridApiRef.current });
 *
 * // Access all grid state through the facade
 * const { selectedView, columnStyles, calculatedColumns } = grid;
 *
 * // Use setters
 * grid.setSelectedView(newView);
 * grid.setColumnStyles(newStyles);
 * ```
 */
export function useGridFacade({ context, getGridApi }: UseGridFacadeOptions) {
  // Convert context to isSubgrid for services that still need it
  const isSubgrid = context === 'subgrid';

  // Compose all the domain-specific hooks using unified context-based pattern
  const viewState = useGridViewState(context);
  const filterState = useGridFilterState(context);
  const pivotState = useGridPivotState(context);
  const styleState = useGridStyleState(context);
  const calcColumnState = useGridCalculatedColumnState(context);
  const metadataState = useMetadataState(isSubgrid);
  const chartState = useChartState(isSubgrid);
  const flowState = useFlowState(isSubgrid);
  const errorState = useGridContextErrors(context);
  const dialogState = useGridDialogState(context);
  const gridTypeState = useGridGridTypeState(context);

  // Create bound asset accessors
  const boundGetStyles = useCallback(
    () => getStyles({ isSubgrid }),
    [isSubgrid]
  );

  const boundSetStyles = useCallback(
    (bundle: StylesBundle<any, any>) => setStyles(bundle, { isSubgrid }),
    [isSubgrid]
  );

  const boundGetCalculatedColumns = useCallback(
    () => getCalculatedColumns({ isSubgrid }),
    [isSubgrid]
  );

  const boundSetCalculatedColumns = useCallback(
    (cols: any[]) => setCalculatedColumns(cols, { isSubgrid }),
    [isSubgrid]
  );

  // Combine everything into a single facade object
  return useMemo(() => ({
    // Identity
    context,
    isSubgrid,
    getGridApi: getGridApi ?? (() => null),

    // View state
    selectedView: viewState.selectedView,
    setSelectedView: viewState.setSelectedView,
    viewOptions: viewState.viewOptions,
    setViewOptions: viewState.setViewOptions,
    selectedViewProcessed: viewState.selectedViewProcessed,
    setSelectedViewProcessed: viewState.setSelectedViewProcessed,
    selectedViewRecordId: viewState.selectedViewRecordId,
    setSelectedViewRecordId: viewState.setSelectedViewRecordId,

    // Filter state
    filterOptions: filterState.filterOptions,
    setFilterOptions: filterState.setFilterOptions,
    selectedFilter: filterState.selectedFilter,
    setSelectedFilter: filterState.setSelectedFilter,
    isFilterActive: filterState.isFilterActive,
    setIsFilterActive: filterState.setIsFilterActive,
    showAdvancedFilter: filterState.showAdvancedFilter,
    setShowAdvancedFilter: filterState.setShowAdvancedFilter,

    // Pivot state
    pivotMode: pivotState.pivotMode,
    setPivotMode: pivotState.setPivotMode,

    // Style state
    columnStyles: styleState.columnStyles,
    setColumnStyles: styleState.setColumnStyles,
    selectedColumnStyle: styleState.selectedColumnStyle,
    setSelectedColumnStyle: styleState.setSelectedColumnStyle,
    rowStyles: styleState.rowStyles,
    setRowStyles: styleState.setRowStyles,
    selectedRowStyle: styleState.selectedRowStyle,
    setSelectedRowStyle: styleState.setSelectedRowStyle,
    showColumnStylePanel: styleState.showColumnStylePanel,
    setShowColumnStylePanel: styleState.setShowColumnStylePanel,
    showFormatColumnDialog: styleState.showFormatColumnDialog,
    setShowFormatColumnDialog: styleState.setShowFormatColumnDialog,
    showFormatRowDialog: styleState.showFormatRowDialog,
    setShowFormatRowDialog: styleState.setShowFormatRowDialog,

    // Calculated column state
    calculatedColumns: calcColumnState.calculatedColumns,
    setCalculatedColumns: calcColumnState.setCalculatedColumns,
    selectedCalculatedColumn: calcColumnState.selectedCalculatedColumn,
    setSelectedCalculatedColumn: calcColumnState.setSelectedCalculatedColumn,
    showCalculatedColumnPanel: calcColumnState.showCalculatedColumnPanel,
    setShowCalculatedColumnPanel: calcColumnState.setShowCalculatedColumnPanel,
    showCalculatedColumnDialog: calcColumnState.showCalculatedColumnDialog,
    setShowCalculatedColumnDialog: calcColumnState.setShowCalculatedColumnDialog,

    // Metadata state
    objMetadata: metadataState.objMetadata,
    setObjMetadata: metadataState.setObjMetadata,
    selectedObject: metadataState.selectedObject,
    setSelectedObject: metadataState.setSelectedObject,

    // Chart state
    charts: chartState.charts,
    setCharts: chartState.setCharts,
    selectedChart: chartState.selectedChart,
    setSelectedChart: chartState.setSelectedChart,
    showSaveChartDialog: chartState.showSaveChartDialog,
    setShowSaveChartDialog: chartState.setShowSaveChartDialog,
    showDeleteChartDialog: chartState.showDeleteChartDialog,
    setShowDeleteChartDialog: chartState.setShowDeleteChartDialog,

    // Flow state
    flows: flowState.flows,
    setFlows: flowState.setFlows,
    selectedFlow: flowState.selectedFlow,
    setSelectedFlow: flowState.setSelectedFlow,

    // Error state
    errors: errorState.errors,
    setError: errorState.setError,
    removeError: errorState.removeError,
    clearErrors: errorState.clearErrors,
    hasErrors: errorState.hasErrors,
    getError: errorState.getError,
    hasError: errorState.hasError,
    getErrorCount: errorState.getErrorCount,

    // Dialog state
    showDeleteRecordDialog: dialogState.showDeleteRecordDialog,
    setShowDeleteRecordDialog: dialogState.setShowDeleteRecordDialog,
    showEditDialog: dialogState.showEditDialog,
    setShowEditDialog: dialogState.setShowEditDialog,
    showCreateFilterDialog: dialogState.showCreateFilterDialog,
    setShowCreateFilterDialog: dialogState.setShowCreateFilterDialog,
    showDeleteFilterDialog: dialogState.showDeleteFilterDialog,
    setShowDeleteFilterDialog: dialogState.setShowDeleteFilterDialog,
    showCreateTemplateDialog: dialogState.showCreateTemplateDialog,
    setShowCreateTemplateDialog: dialogState.setShowCreateTemplateDialog,
    showDeleteTemplateDialog: dialogState.showDeleteTemplateDialog,
    setShowDeleteTemplateDialog: dialogState.setShowDeleteTemplateDialog,

    // Grid type state
    selectedGridType: gridTypeState.selectedGridType,
    setSelectedGridType: gridTypeState.setSelectedGridType,
    gridViewTypes: gridTypeState.gridViewTypes,
    setGridViewTypes: gridTypeState.setGridViewTypes,
    showGridViewTypes: gridTypeState.showGridViewTypes,
    setShowGridViewTypes: gridTypeState.setShowGridViewTypes,

    // Pre-bound asset functions (for direct store access without subscriptions)
    assets: {
      getStyles: boundGetStyles,
      setStyles: boundSetStyles,
      getCalculatedColumns: boundGetCalculatedColumns,
      setCalculatedColumns: boundSetCalculatedColumns,
    },
  }), [
    context,
    isSubgrid,
    getGridApi,
    viewState,
    filterState,
    pivotState,
    styleState,
    calcColumnState,
    metadataState,
    chartState,
    flowState,
    errorState,
    dialogState,
    gridTypeState,
    boundGetStyles,
    boundSetStyles,
    boundGetCalculatedColumns,
    boundSetCalculatedColumns,
  ]);
}

export type GridFacade = ReturnType<typeof useGridFacade>;

export default useGridFacade;
