/**
 * Grid Type State Hooks
 *
 * Provides hooks for accessing grid type selection state with automatic
 * main/subgrid context handling.
 */

import { createContextHooks, createSimpleHook } from './createSelector';
import type { GridViewType } from '../../appInterfaces/grid/gridInterfaces';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Return type for useGridTypeState hook */
export interface GridTypeStateReturn {
  selectedGridType: GridViewType;
  setSelectedGridType: (type: GridViewType) => void;
  // Shared properties (same for main and subgrid)
  gridViewTypes: GridViewType[];
  setGridViewTypes: (types: GridViewType[]) => void;
  showGridViewTypes: boolean;
  setShowGridViewTypes: (show: boolean) => void;
}

// ============================================================
// CONTEXT-AWARE HOOKS (main vs subgrid)
// ============================================================

// Note: gridViewTypes and showGridViewTypes are shared (same store property for both contexts)
const gridTypeHooks = createContextHooks<GridTypeStateReturn>({
  selectedGridType: { main: 'selectedGridType', subgrid: 'selectedSubgridType' },
  gridViewTypes: { main: 'gridViewTypes', subgrid: 'gridViewTypes' },  // shared
  showGridViewTypes: { main: 'showGridViewTypes', subgrid: 'showGridViewTypes' },  // shared
});

/** Hook for grid type state - pass 'main' or 'subgrid' context */
export const useGridTypeState = gridTypeHooks.useHook;

/** Hook for main grid type state */
export const useMainGridTypeState = gridTypeHooks.useMainHook;

/** Hook for subgrid grid type state */
export const useSubgridGridTypeState = gridTypeHooks.useSubgridHook;

// ============================================================
// SHARED HOOKS (same for main and subgrid)
// ============================================================

/** Hook for grid view types configuration (shared) */
export const useGridViewTypesConfig = createSimpleHook([
  'gridViewTypes',
  'showGridViewTypes',
]);

// Legacy export name for backwards compatibility
export const useGridGridTypeState = useGridTypeState;

export default useGridTypeState;
