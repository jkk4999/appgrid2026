/**
 * Grid Context Types for Unified Hook Pattern
 *
 * This file defines the types used by the unified grid state hooks.
 * Uses WithFunctionalSetters from store/typeUtils to reduce duplication.
 */

import type { WithFunctionalSetters } from '../../store/typeUtils';
import type { SObjectView } from '../../sObjectMetadataTypes';
import type {
  AgCalculatedColumn,
  AgColumnStyle,
  AgRowStyle,
  FilterOption,
  GridViewType,
} from '../../appInterfaces/grid/gridInterfaces';

// Re-export GridContext from store types
export type { GridContext } from '../../store/typeUtils';

// ============================================================
// STATE INTERFACES (state-only, setters auto-generated)
// ============================================================

/** View state for a grid context */
interface ViewState {
  selectedView: SObjectView | null;
  viewOptions: SObjectView[] | null;
  selectedViewProcessed: boolean;
  selectedViewRecordId: string;
}

/** Filter state for a grid context */
interface FilterState {
  filterOptions: FilterOption[];
  selectedFilter: FilterOption | null;
  isFilterActive: boolean;
  showAdvancedFilter: boolean;
}

/** Pivot state for a grid context */
interface PivotState {
  pivotMode: boolean;
}

/** Grid type state for a grid context */
interface GridTypeState {
  selectedGridType: GridViewType;
  gridViewTypes: GridViewType[];
  showGridViewTypes: boolean;
}

/** Dialog state for a grid context */
interface DialogState {
  showDeleteRecordDialog: boolean;
  showEditDialog: boolean;
  showCreateFilterDialog: boolean;
  showDeleteFilterDialog: boolean;
  showCreateTemplateDialog: boolean;
  showDeleteTemplateDialog: boolean;
}

/** Style state for a grid context */
interface StyleState {
  columnStyles: AgColumnStyle[];
  rowStyles: AgRowStyle[];
  selectedColumnStyle: AgColumnStyle | null;
  selectedRowStyle: AgRowStyle | null;
  showColumnStylePanel: boolean;
  showFormatColumnDialog: boolean;
  showFormatRowDialog: boolean;
}

/** Calculated column state for a grid context */
interface CalculatedColumnState {
  calculatedColumns: AgCalculatedColumn[];
  selectedCalculatedColumn: AgCalculatedColumn | null;
  showCalculatedColumnPanel: boolean;
  showCalculatedColumnDialog: boolean;
}

/** Error state for a grid context */
interface ErrorState {
  errors: Map<string, string>;
}

/** Error state actions (custom signatures) */
interface ErrorStateActions {
  setError: (rowId: string, error: string) => void;
  removeError: (rowId: string) => void;
  clearErrors: () => void;
}

// ============================================================
// COMBINED TYPES (auto-generated setters)
// ============================================================

export type ViewStateWithActions = WithFunctionalSetters<ViewState>;
export type FilterStateWithActions = WithFunctionalSetters<FilterState>;
export type PivotStateWithActions = WithFunctionalSetters<PivotState>;
export type GridTypeStateWithActions = WithFunctionalSetters<GridTypeState>;
export type DialogStateWithActions = WithFunctionalSetters<DialogState>;
export type StyleStateWithActions = WithFunctionalSetters<StyleState>;
export type CalculatedColumnStateWithActions = WithFunctionalSetters<CalculatedColumnState>;
export type ErrorStateWithActions = ErrorState & ErrorStateActions;

// ============================================================
// LEGACY EXPORTS (for backwards compatibility)
// ============================================================

export type {
  ViewState,
  FilterState,
  PivotState,
  GridTypeState,
  DialogState,
  StyleState,
  CalculatedColumnState,
  ErrorState,
  ErrorStateActions,
};

// Legacy action type aliases
export type ViewStateActions = {
  setSelectedView: (view: SObjectView | null) => void;
  setViewOptions: (options: SObjectView[] | null) => void;
  setSelectedViewProcessed: (processed: boolean) => void;
  setSelectedViewRecordId: (id: string) => void;
};

export type FilterStateActions = {
  setFilterOptions: (options: FilterOption[]) => void;
  setSelectedFilter: (filter: FilterOption | null) => void;
  setIsFilterActive: (active: boolean) => void;
  setShowAdvancedFilter: (show: boolean) => void;
};

export type PivotStateActions = {
  setPivotMode: (mode: boolean) => void;
};

export type GridTypeStateActions = {
  setSelectedGridType: (type: GridViewType) => void;
  setGridViewTypes: (types: GridViewType[]) => void;
  setShowGridViewTypes: (show: boolean) => void;
};

export type DialogStateActions = {
  setShowDeleteRecordDialog: (show: boolean) => void;
  setShowEditDialog: (show: boolean) => void;
  setShowCreateFilterDialog: (show: boolean) => void;
  setShowDeleteFilterDialog: (show: boolean) => void;
  setShowCreateTemplateDialog: (show: boolean) => void;
  setShowDeleteTemplateDialog: (show: boolean) => void;
};

export type StyleStateActions = {
  setColumnStyles: (styles: AgColumnStyle[]) => void;
  setRowStyles: (styles: AgRowStyle[]) => void;
  setSelectedColumnStyle: (style: AgColumnStyle | null) => void;
  setSelectedRowStyle: (style: AgRowStyle | null) => void;
  setShowColumnStylePanel: (show: boolean) => void;
  setShowFormatColumnDialog: (show: boolean) => void;
  setShowFormatRowDialog: (show: boolean) => void;
};

export type CalculatedColumnStateActions = {
  setCalculatedColumns: (columns: AgCalculatedColumn[]) => void;
  setSelectedCalculatedColumn: (column: AgCalculatedColumn | null) => void;
  setShowCalculatedColumnPanel: (show: boolean) => void;
  setShowCalculatedColumnDialog: (show: boolean) => void;
};
