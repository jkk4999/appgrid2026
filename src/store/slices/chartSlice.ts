/**
 * Chart Slice
 *
 * Manages chart state including chart info, options, and dialogs.
 * Uses createSliceWithSetters for automatic setter generation.
 */

import { createSliceWithSetters } from '../createSlice';
import type { ChartInfo, SObjectChart } from '../types';

// ============================================================
// INITIAL STATE
// ============================================================

const chartState = {
  chartInfo: null as ChartInfo | null,
  chartOptions: [] as SObjectChart[],
  objCharts: [] as SObjectChart[],
  objSubgridCharts: [] as SObjectChart[],
  selectedChart: null as SObjectChart | null,
  selectedSubgridChart: null as SObjectChart | null,
  showCharts: false,
  showChartDialog: false,
  showChartSettings: false,
  showSaveChartDialog: false,
  showSaveChartSubgridDialog: false,
  showDeleteChartDialog: false,
  showDeleteChartSubgridDialog: false,
  useAllChartData: false,
  useAllSubgridChartData: false
};

// ============================================================
// SLICE CREATOR
// ============================================================

export const createChartSlice = createSliceWithSetters(chartState);
