import { ChartModel, ChartRef } from 'ag-grid-community';

export type ThemeOptionType = {
  name: string;
  colors: string[];
};

// Define a type to store chart info
export type ChartInfo = {
  chartRef?: ChartRef;
  source?: string;
  gridType?: 'parentGrid' | 'subGrid';
};

export interface AgChartModel extends ChartModel {
  isPivotChart: boolean;
}
