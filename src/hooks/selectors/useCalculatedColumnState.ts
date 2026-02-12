/**
 * Calculated Column State Hooks
 *
 * Provides hooks for accessing calculated column state with automatic
 * main/subgrid context handling.
 */

import { createContextHooks } from './createSelector';
import type { AgCalculatedColumn } from '../../appInterfaces/grid/gridInterfaces';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Return type for useCalculatedColumnState hook */
export interface CalculatedColumnStateReturn {
  calculatedColumns: AgCalculatedColumn[];
  setCalculatedColumns: (columns: AgCalculatedColumn[]) => void;
  selectedCalculatedColumn: AgCalculatedColumn | null;
  setSelectedCalculatedColumn: (column: AgCalculatedColumn | null) => void;
  showCalculatedColumnPanel: boolean;
  setShowCalculatedColumnPanel: (show: boolean) => void;
  showCalculatedColumnDialog: boolean;
  setShowCalculatedColumnDialog: (show: boolean) => void;
}

/** Return type for useCalculatedColumnData hook */
export interface CalculatedColumnDataReturn {
  calculatedColumns: AgCalculatedColumn[];
  setCalculatedColumns: (columns: AgCalculatedColumn[]) => void;
}

// ============================================================
// CONTEXT-AWARE HOOKS (main vs subgrid)
// ============================================================

const calculatedColumnHooks = createContextHooks<CalculatedColumnStateReturn>({
  calculatedColumns: { main: 'objCalculatedColumns', subgrid: 'objCalculatedSubgridColumns' },
  selectedCalculatedColumn: { main: 'selectedCalculatedColumn', subgrid: 'selectedSubgridCalculatedColumn' },
  showCalculatedColumnPanel: { main: 'showCalculatedColumnPanel', subgrid: 'showSubgridCalculatedColumnPanel' },
  showCalculatedColumnDialog: { main: 'showCalculatedColumnDialog', subgrid: 'showSubgridCalculatedColumnDialog' },
});

const calculatedColumnDataHooks = createContextHooks<CalculatedColumnDataReturn>({
  calculatedColumns: { main: 'objCalculatedColumns', subgrid: 'objCalculatedSubgridColumns' },
});

/** Hook for calculated column state - pass 'main' or 'subgrid' context */
export const useCalculatedColumnState = calculatedColumnHooks.useHook;

/** Hook for main grid calculated column state */
export const useMainCalculatedColumnState = calculatedColumnHooks.useMainHook;

/** Hook for subgrid calculated column state */
export const useSubgridCalculatedColumnState = calculatedColumnHooks.useSubgridHook;

/** Hook for calculated column data only (no UI state) - pass 'main' or 'subgrid' context */
export const useCalculatedColumnData = calculatedColumnDataHooks.useHook;

/** Hook for main grid calculated column data */
export const useMainCalculatedColumnData = calculatedColumnDataHooks.useMainHook;

/** Hook for subgrid calculated column data */
export const useSubgridCalculatedColumnData = calculatedColumnDataHooks.useSubgridHook;

export default useCalculatedColumnState;
