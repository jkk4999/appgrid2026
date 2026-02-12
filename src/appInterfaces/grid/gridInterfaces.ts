import { RuleModel } from '@syncfusion/ej2-querybuilder';
import {
  SObject,
  SObjectMetadata,
  SObjectView
} from '../../sObjectMetadataTypes';

import type {
  AdvancedFilterModel,
  ColDef,
  Column,
  ColumnState,
  FilterModel,
  GridApi,
  GridState,
  IRowNode
} from 'ag-grid-community';
import { APIClient } from '../../brideDesignPattern/apiInterface';

export type CellAlignment = 'left' | 'center' | 'right';

export type FontStyle = 'bold' | 'italic';

export type FontSize =
  | 'Default'
  | 'XSmall'
  | 'Small'
  | 'Medium'
  | 'Large'
  | 'XLarge';

export type TargetDataType =
  | 'BOOLEAN'
  | 'CURRENCY'
  | 'DATE'
  | 'DATETIME'
  | 'DECIMAL'
  | 'INTEGER'
  | 'PERCENTAGE'
  | 'STRING';

export interface AgColumnStyle {
  active?: boolean;
  backgroundColorChecked?: boolean;
  backgroundColor?: string;
  backgroundColorOpacity?: number;
  borderColor?: string;
  borderColorChecked?: boolean;
  borderColorOpacity?: number;
  borderRadius?: number;
  cellAlignment?: CellAlignment;
  cellAlignmentChecked?: boolean;
  checked?: boolean;
  color?: string;
  colorChecked?: boolean;
  colorOpacity?: number;
  description?: string;
  excludeGroupRows?: boolean;
  excludeRowSummaries?: boolean;
  fontSize?: FontSize;
  fontSizeChecked?: boolean;
  fontStyle?: FontStyle;
  fontStyleChecked?: boolean;
  name?: string;
  rule?: RuleModel;
  targetColumns?: string[];
  targetDataType?: TargetDataType;
}

export interface AgCalculatedColumn {
  active?: boolean;
  aggregatable?: boolean;
  dataType?: TargetDataType;
  description?: string;
  filterable?: boolean;
  groupable?: boolean;
  name?: string;
  pivotable?: boolean;
  resizable?: boolean;
  rule?: string;
  sortable?: boolean;
  suppressHeaderMenuButton?: boolean;
  formatType?:
    | 'CURRENCY'
    | 'PERCENTAGE'
    | 'DATE'
    | 'DATETIME'
    | 'NUMBER'
    | 'STRING'
    | 'BOOLEAN';
}

export interface AgRowStyle {
  active?: boolean;
  backgroundColorChecked?: boolean;
  backgroundColor?: string;
  backgroundColorOpacity?: number;
  borderColor?: string;
  borderColorChecked?: boolean;
  borderColorOpacity?: number;
  cellAlignment?: CellAlignment;
  cellAlignmentChecked?: boolean;
  color?: string;
  colorChecked?: boolean;
  colorOpacity?: number;
  description?: string;
  excludeGroupRows?: boolean;
  excludeRowSummaries?: boolean;
  fontSize?: FontSize;
  fontSizeChecked?: boolean;
  fontStyle?: FontStyle;
  fontStyleChecked?: boolean;
  name?: string;
  rule?: RuleModel;
}

export interface CurrentCellInfo {
  column: Column;
  colDef: ColDef;
  value: any;
  data: SObject;
  node: IRowNode;
  rowIndex: number;
  event: Event;
}

export interface CustomStylePanelProps {
  apiClient: APIClient;
  gridApi: GridApi;
  isSubgrid: boolean;
  sObjectApiName: string;
  saveAgGridState: () => Promise<any>;
  objMetadata: SObjectMetadata;
  objColumnStyles?: AgColumnStyle[];
  objRowStyles?: AgRowStyle[];
  rowData: SObject[];
  selectedColumnStyle?: AgColumnStyle | null;
  selectedRowStyle?: AgRowStyle | null;
  setObjColumnStyles?: (styles: AgColumnStyle[]) => void;
  setObjRowStyles?: (styles: AgRowStyle[]) => void;
  setSelectedColumnStyle?: (style: AgColumnStyle) => void;
  setSelectedRowStyle?: (style: AgRowStyle) => void;
}

export interface CustomCalculatedColumnPanelProps {
  apiClient: APIClient;
  gridApi: GridApi;
  isSubgrid: boolean;
  saveAgGridState: () => Promise<void>;
}

export enum SelectedFilterType {
  FilterModel = 'FilterModel',
  AdvancedFilterModel = 'AdvancedFilterModel'
}

export interface BaseFilterOption {
  name: string;
}

export interface BasicFilterOption extends BaseFilterOption {
  type: SelectedFilterType.FilterModel;
  filterModel: FilterModel;
}

export interface AdvancedFilterOption extends BaseFilterOption {
  type: SelectedFilterType.AdvancedFilterModel;
  filterModel: AdvancedFilterModel;
}

export type FilterOption = BasicFilterOption | AdvancedFilterOption;

export interface TimeSeriesFilterOption {
  name: string;
  filterRule: RuleModel;
}

export interface CurrentState {
  columnState?: ColumnState[]; // Your custom type
  gridState?: GridState;
}

export interface GridPermissionItem {
  name: string;
  label: string;
  checked: boolean;
}

export interface GridPermission {
  enableAccentColorPicker: boolean;
  enableCalculatedColumnWizard: boolean;
  enableDeploymentWizardAction: boolean;
  enableFlowWizardAction: boolean;
  enableGridTypeSelector: boolean;
  enableObjectPreferencesAction: boolean;
  enablePermissionsAction: boolean;
  enablePivoting: boolean;
  enableSlack: boolean;
  enableStylesWizard: boolean;
  enableQueryBuilderAction: boolean;
  enableTeamSharing: boolean;
  enableThemeSelector: boolean;
  enableTimeSeriesGrid: boolean;
  enableTreeGrid: boolean;
}

export interface FlowOption {
  Id?: string;
  Name?: string;
  OwnerId?: string;
  AppGridAg__SobjectApiName__: string;
  AppGridAg__Flow_Properties__c: string;
  AppGridAg__Flow_Parameters__c: string;
  AppGridAg__IsActive__c: boolean;
}

export interface GridEditDialogState {
  show: boolean;
  gridId: string | null; // Unique ID for the grid instance (main or subgrid)
  isSubgrid: boolean; // Tracks whether the dialog is for a subgrid
  selectedView: SObjectView | null;
}

export interface GridViewType {
  name: string;
  label: string;
}

export type ObjectPreference = {
  name: string;
  label: string;
  checked: boolean;
};

export type PicklistItem = {
  name: string;
  label: string;
};

export type RelationPreference = {
  name: string;
  label: string;
  checked: boolean;
  // API name of the related child object (e.g., 'Task')
  childSObject?: string;
  // Relationship name used in SOQL subqueries (e.g., 'Tasks')
  relationshipName?: string;
  // Persisted selected subgrid view for this relation (e.g., 'gridView' | 'treeGrid' | 'timeSeriesView')
  selectedGridType?: string;
};

export interface TreeGridPreference {
  name: string;
  label: string;
  checked: boolean;
}

export interface TreeGridPreferences {
  parentLookupField: string;
  groupField: string;
  // preferences: TreeGridPreference[]
}

export interface Query {
  Id?: string;
  Name: string;
  AppGridAg__SobjectApiName__c: string;
  AppGridAg__QueryRule__c: string;
  AppGridAg__IsActive__c?: boolean;
  AppGridAg__IsPublic__c?: boolean;
  AppGridAg__IsDefault__c?: boolean;
  AppGridAg__RelationQueryRule__c?: string;
  AppGridAg__RelationSObjectApiName__c?: string;
  OwnerId?: string;
  CreatedById?: Date;
  LastModifiedById?: Date;
}

export interface SelectedObject {
  name: string | null;
  label: string | null;
}

export interface SelectedObjMetadata {
  sObjectApiName: string;
  metadataSource: string;
  objMetadata: SObjectMetadata;
}

export interface SuggestItem {
  Id: string;
  Name: string;
}

export interface TestExpression {
  name: string;
  expression: string;
}
