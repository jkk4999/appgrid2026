import type { AdvancedFilterModel, FilterModel } from 'ag-grid-community';

// Interface for params passed to init (based on Ag-Grid’s expectations)
export interface ChartContainerParams {
  chartElement: HTMLElement;
  // Add other properties if needed based on your Ag-Grid version
}

// Interface for the ref methods Ag-Grid expects
export interface ChartContainerRef {
  open: (callback: (container: HTMLDivElement) => void) => void;
  close: () => void;
  getContainer: () => HTMLDivElement | null;
}

// Props for the chart container component
export interface ChartDialogProps {
  onChartClosed?: () => void;
}

// Constructor type for ChartDialog
export type ChartDialogConstructor = {
  new (props: ChartDialogProps): {
    init: (params: ChartContainerParams) => void;
    destroy: () => void;
  };
};

export interface ChartFilters {
  filterModel: FilterModel;
  advancedFilterModel: AdvancedFilterModel;
}
