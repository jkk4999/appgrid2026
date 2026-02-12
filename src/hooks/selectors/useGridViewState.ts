/**
 * Unified View State Hook
 *
 * This hook provides access to view-related state using a context parameter
 * instead of separate main/subgrid hooks. This allows for cleaner code
 * and easier reuse of components across different grid contexts.
 *
 * @example
 * // In main grid component
 * const { selectedView, setSelectedView } = useGridViewState('main');
 *
 * // In subgrid component
 * const { selectedView, setSelectedView } = useGridViewState('subgrid');
 *
 * // In shared component that receives context as prop
 * const { selectedView, setSelectedView } = useGridViewState(context);
 */

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore';
import type { GridContext, ViewStateWithActions, FilterStateWithActions, PivotStateWithActions } from './types';

// Stable no-op function to avoid re-renders for unavailable setters
const noop = () => {};

/**
 * Creates a selector function for view state based on context.
 * This is created once per context and reused.
 */
const createViewSelector = (context: GridContext) => (state: any): ViewStateWithActions => {
  if (context === 'main') {
    return {
      selectedView: state.selectedView,
      setSelectedView: state.setSelectedView,
      viewOptions: state.viewOptions,
      setViewOptions: state.setViewOptions,
      selectedViewProcessed: state.selectedViewProcessed,
      setSelectedViewProcessed: state.setSelectedViewProcessed,
      selectedViewRecordId: state.selectedViewRecordId,
      setSelectedViewRecordId: state.setSelectedViewRecordId,
    };
  }
  // Subgrid context
  return {
    selectedView: state.selectedSubgridView,
    setSelectedView: state.setSelectedSubgridView,
    viewOptions: state.subgridViewOptions,
    setViewOptions: state.setSubgridViewOptions,
    // Subgrid doesn't have processed/recordId tracking, provide defaults
    selectedViewProcessed: false,
    setSelectedViewProcessed: noop,
    selectedViewRecordId: '',
    setSelectedViewRecordId: noop,
  };
};

/**
 * Creates a selector function for filter state based on context.
 */
const createFilterSelector = (context: GridContext) => (state: any): FilterStateWithActions => {
  if (context === 'main') {
    return {
      filterOptions: state.filterOptions,
      setFilterOptions: state.setFilterOptions,
      selectedFilter: state.selectedFilter,
      setSelectedFilter: state.setSelectedFilter,
      isFilterActive: state.isFilterActive,
      setIsFilterActive: state.setIsFilterActive,
      showAdvancedFilter: state.showAdvancedFilter,
      setShowAdvancedFilter: state.setShowAdvancedFilter,
    };
  }
  // Subgrid context
  return {
    filterOptions: state.subgridFilterOptions,
    setFilterOptions: state.setSubgridFilterOptions,
    selectedFilter: state.selectedSubgridFilter,
    setSelectedFilter: state.setSelectedSubgridFilter,
    isFilterActive: state.isSubgridFilterActive,
    setIsFilterActive: state.setIsSubgridFilterActive,
    showAdvancedFilter: state.showSubgridAdvancedFilter,
    setShowAdvancedFilter: state.setShowSubgridAdvancedFilter,
  };
};

/**
 * Creates a selector function for pivot state based on context.
 */
const createPivotSelector = (context: GridContext) => (state: any): PivotStateWithActions => {
  if (context === 'main') {
    return {
      pivotMode: state.pivotMode,
      setPivotMode: state.setPivotMode,
    };
  }
  // Subgrid context
  return {
    pivotMode: state.subgridPivotMode,
    setPivotMode: state.setSubgridPivotMode,
  };
};

// Pre-created selectors for each context to ensure referential stability
const mainViewSelector = createViewSelector('main');
const subgridViewSelector = createViewSelector('subgrid');
const mainFilterSelector = createFilterSelector('main');
const subgridFilterSelector = createFilterSelector('subgrid');
const mainPivotSelector = createPivotSelector('main');
const subgridPivotSelector = createPivotSelector('subgrid');

/**
 * Unified hook for view-related state.
 *
 * @param context - The grid context ('main' or 'subgrid')
 * @returns View state and setters with consistent property names
 */
export function useGridViewState(context: GridContext): ViewStateWithActions {
  const selector = context === 'main' ? mainViewSelector : subgridViewSelector;
  return useStore(useShallow(selector));
}

/**
 * Unified hook for filter-related state.
 *
 * @param context - The grid context ('main' or 'subgrid')
 * @returns Filter state and setters with consistent property names
 */
export function useGridFilterState(context: GridContext): FilterStateWithActions {
  const selector = context === 'main' ? mainFilterSelector : subgridFilterSelector;
  return useStore(useShallow(selector));
}

/**
 * Unified hook for pivot mode state.
 *
 * @param context - The grid context ('main' or 'subgrid')
 * @returns Pivot state and setter
 */
export function useGridPivotState(context: GridContext): PivotStateWithActions {
  const selector = context === 'main' ? mainPivotSelector : subgridPivotSelector;
  return useStore(useShallow(selector));
}

/**
 * Combined hook that returns view, filter, and pivot state together.
 * Useful when a component needs all view-related state.
 *
 * @param context - The grid context ('main' or 'subgrid')
 * @returns Combined view, filter, and pivot state
 */
export function useGridViewFilterPivotState(context: GridContext) {
  const viewState = useGridViewState(context);
  const filterState = useGridFilterState(context);
  const pivotState = useGridPivotState(context);

  return useMemo(
    () => ({
      ...viewState,
      ...filterState,
      ...pivotState,
    }),
    [viewState, filterState, pivotState]
  );
}

export default useGridViewState;
