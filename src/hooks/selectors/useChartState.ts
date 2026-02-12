/**
 * Chart State Hooks
 *
 * Provides hooks for accessing chart-related state with automatic
 * main/subgrid context handling.
 */

import { createContextHooks, createSimpleHook } from './createSelector';
import type { SObjectChart } from '../../sObjectMetadataTypes';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Return type for useChartState hook */
export interface ChartStateReturn {
  charts: SObjectChart[];
  setCharts: (charts: SObjectChart[]) => void;
  selectedChart: SObjectChart | null;
  setSelectedChart: (chart: SObjectChart | null) => void;
  showSaveChartDialog: boolean;
  setShowSaveChartDialog: (show: boolean) => void;
  showDeleteChartDialog: boolean;
  setShowDeleteChartDialog: (show: boolean) => void;
  useAllChartData: boolean;
  setUseAllChartData: (useAll: boolean) => void;
}

// ============================================================
// CONTEXT-AWARE HOOKS (main vs subgrid)
// ============================================================

const chartHooks = createContextHooks<ChartStateReturn>({
  charts: { main: 'objCharts', subgrid: 'objSubgridCharts' },
  selectedChart: { main: 'selectedChart', subgrid: 'selectedSubgridChart' },
  showSaveChartDialog: { main: 'showSaveChartDialog', subgrid: 'showSaveChartSubgridDialog' },
  showDeleteChartDialog: { main: 'showDeleteChartDialog', subgrid: 'showDeleteChartSubgridDialog' },
  useAllChartData: { main: 'useAllChartData', subgrid: 'useAllSubgridChartData' },
});

/** Hook for chart state - pass 'main' or 'subgrid' context */
export const useChartState = chartHooks.useHook;

/** Hook for main grid chart state */
export const useMainChartState = chartHooks.useMainHook;

/** Hook for subgrid chart state */
export const useSubgridChartState = chartHooks.useSubgridHook;

// ============================================================
// SHARED HOOKS (same for main and subgrid)
// ============================================================

/** Hook for chart display/visibility state (shared) */
export const useChartDisplay = createSimpleHook([
  'chartInfo',
  'chartOptions',
  'showCharts',
  'showChartDialog',
  'showChartSettings',
]);

export default useChartState;
