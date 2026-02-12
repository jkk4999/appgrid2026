/**
 * View State Hooks
 *
 * Provides hooks for accessing view, filter, and pivot state with automatic
 * main/subgrid context handling.
 */

import { createContextHooks, createSimpleHook } from './createSelector';
import type { SObjectView } from '../../sObjectMetadataTypes';
import type { FilterOption } from '../../appInterfaces/grid/gridInterfaces';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Return type for useViewState hook */
export interface ViewStateReturn {
  selectedView: SObjectView | null;
  setSelectedView: (view: SObjectView | null) => void;
  viewOptions: SObjectView[] | null;
  setViewOptions: (options: SObjectView[] | null) => void;
  selectedViewProcessed: boolean;
  setSelectedViewProcessed: (processed: boolean) => void;
  selectedViewRecordId: string;
  setSelectedViewRecordId: (id: string) => void;
}

/** Return type for useFilterState hook */
export interface FilterStateReturn {
  filterOptions: FilterOption[];
  setFilterOptions: (options: FilterOption[]) => void;
  selectedFilter: FilterOption | null;
  setSelectedFilter: (filter: FilterOption | null) => void;
  isFilterActive: boolean;
  setIsFilterActive: (active: boolean) => void;
  showAdvancedFilter: boolean;
  setShowAdvancedFilter: (show: boolean) => void;
}

/** Return type for usePivotState hook */
export interface PivotStateReturn {
  pivotMode: boolean;
  setPivotMode: (mode: boolean) => void;
}

// ============================================================
// CONTEXT-AWARE HOOKS (main vs subgrid)
// ============================================================

const viewHooks = createContextHooks<ViewStateReturn>({
  selectedView: { main: 'selectedView', subgrid: 'selectedSubgridView' },
  viewOptions: { main: 'viewOptions', subgrid: 'subgridViewOptions' },
  selectedViewProcessed: { main: 'selectedViewProcessed', subgrid: 'selectedViewProcessed' },
  selectedViewRecordId: { main: 'selectedViewRecordId', subgrid: 'selectedViewRecordId' },
});

const filterHooks = createContextHooks<FilterStateReturn>({
  filterOptions: { main: 'filterOptions', subgrid: 'subgridFilterOptions' },
  selectedFilter: { main: 'selectedFilter', subgrid: 'selectedSubgridFilter' },
  isFilterActive: { main: 'isFilterActive', subgrid: 'isSubgridFilterActive' },
  showAdvancedFilter: { main: 'showAdvancedFilter', subgrid: 'showSubgridAdvancedFilter' },
});

const pivotHooks = createContextHooks<PivotStateReturn>({
  pivotMode: { main: 'pivotMode', subgrid: 'subgridPivotMode' },
});

/** Hook for view state - pass 'main' or 'subgrid' context */
export const useViewState = viewHooks.useHook;

/** Hook for main grid view state */
export const useMainViewState = viewHooks.useMainHook;

/** Hook for subgrid view state */
export const useSubgridViewState = viewHooks.useSubgridHook;

/** Hook for filter state - pass 'main' or 'subgrid' context */
export const useFilterState = filterHooks.useHook;

/** Hook for main grid filter state */
export const useMainFilterState = filterHooks.useMainHook;

/** Hook for subgrid filter state */
export const useSubgridFilterState = filterHooks.useSubgridHook;

/** Hook for pivot state - pass 'main' or 'subgrid' context */
export const usePivotState = pivotHooks.useHook;

/** Hook for main grid pivot state */
export const useMainPivotState = pivotHooks.useMainHook;

/** Hook for subgrid pivot state */
export const useSubgridPivotState = pivotHooks.useSubgridHook;

// ============================================================
// SHARED HOOKS (same for main and subgrid)
// ============================================================

/** Hook for view retrieval status (shared) */
export const useViewRetrievalState = createSimpleHook([
  'objViewsRetrieved',
]);

export default useViewState;
