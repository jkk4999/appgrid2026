import type { ColumnState, GridState } from 'ag-grid-community';

export interface ViewStateDto {
  gridState: GridState | null;
  columnState: ColumnState[] | null;
  filterOptions: any[] | null;
  columnStyles: any | null;
  rowStyles: any | null;
  calculatedColumns: any | null;
  pivotMode: boolean;
  advancedFilterEnabled: boolean;
}

export interface ApplySetters {
  setCurrentState: (state: { gridState: any; columnState: any }) => void;
  setFilterOptions: (opts: any[]) => void;
  setShowAdvancedFilter: (v: boolean) => void;
  setPivotMode: (v: boolean) => void;
  setObjColumnStyles: (v: any) => void;
  setObjRowStyles: (v: any) => void;
  setObjCalculatedColumns: (v: any) => void;
  setSelectedChart?: (v: any) => void;
  setSelectedViewProcessed?: (v: boolean) => void;
  setSelectedViewRecordId?: (id: string) => void;
  setLastViewId?: (id: string) => void;
  setPendingFilters?: (filters: { filterModel: any; advancedFilterModel: any }) => void;
  setSelectedFilter?: (v: any) => void;
}

export interface ApplyOptions {
  isSubgrid?: boolean;
  publish?: (topic: string) => void;
  onError?: (msg: string) => void;
  skipSetProcessed?: boolean;
}

export interface SelectedViewLike {
  // main grid shape
  id?: string;
  name?: string;
  gridState?: string;
  columnState?: string;
  filterOptions?: string;
  columnStyles?: string;
  rowStyles?: string;
  calculatedColumns?: string;
  pivotMode?: boolean;
  showAdvancedFilter?: boolean;

  // subgrid shape (AppGridAg__ fields)
  Id?: string;
  Name?: string;
  AppGridAg__Grid_State__c?: string;
  AppGridAg__Column_State__c?: string;
  AppGridAg__FilterOptions__c?: string;
  AppGridAg__Column_Styles__c?: string;
  AppGridAg__Row_Styles__c?: string;
  AppGridAg__Calculated_Columns__c?: string;
  AppGridAg__Pivot_Mode__c?: boolean;
  AppGridAg__ShowAdvancedFilter__c?: boolean;
}
