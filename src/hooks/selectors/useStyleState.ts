/**
 * Style State Hooks
 *
 * Provides hooks for accessing column and row style state with automatic
 * main/subgrid context handling.
 */

import { createContextHooks } from './createSelector';
import type { AgColumnStyle, AgRowStyle } from '../../appInterfaces/grid/gridInterfaces';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Return type for useStyleState hook */
export interface StyleStateReturn {
  columnStyles: AgColumnStyle[];
  setColumnStyles: (styles: AgColumnStyle[]) => void;
  selectedColumnStyle: AgColumnStyle | null;
  setSelectedColumnStyle: (style: AgColumnStyle | null) => void;
  rowStyles: AgRowStyle[];
  setRowStyles: (styles: AgRowStyle[]) => void;
  selectedRowStyle: AgRowStyle | null;
  setSelectedRowStyle: (style: AgRowStyle | null) => void;
  showColumnStylePanel: boolean;
  setShowColumnStylePanel: (show: boolean) => void;
  showFormatColumnDialog: boolean;
  setShowFormatColumnDialog: (show: boolean) => void;
  showFormatRowDialog: boolean;
  setShowFormatRowDialog: (show: boolean) => void;
}

/** Return type for useStyleData hook */
export interface StyleDataReturn {
  columnStyles: AgColumnStyle[];
  setColumnStyles: (styles: AgColumnStyle[]) => void;
  rowStyles: AgRowStyle[];
  setRowStyles: (styles: AgRowStyle[]) => void;
}

// ============================================================
// CONTEXT-AWARE HOOKS (main vs subgrid)
// ============================================================

const styleHooks = createContextHooks<StyleStateReturn>({
  columnStyles: { main: 'objColumnStyles', subgrid: 'objSubgridColumnStyles' },
  selectedColumnStyle: { main: 'selectedColumnStyle', subgrid: 'selectedSubgridColumnStyle' },
  rowStyles: { main: 'objRowStyles', subgrid: 'objSubgridRowStyles' },
  selectedRowStyle: { main: 'selectedRowStyle', subgrid: 'selectedSubgridRowStyle' },
  showColumnStylePanel: { main: 'showColumnStylePanel', subgrid: 'showSubgridColumnStylePanel' },
  showFormatColumnDialog: { main: 'showFormatColumnDialog', subgrid: 'showSubgridFormatColumnDialog' },
  showFormatRowDialog: { main: 'showFormatRowDialog', subgrid: 'showSubgridFormatRowDialog' },
});

const styleDataHooks = createContextHooks<StyleDataReturn>({
  columnStyles: { main: 'objColumnStyles', subgrid: 'objSubgridColumnStyles' },
  rowStyles: { main: 'objRowStyles', subgrid: 'objSubgridRowStyles' },
});

/** Hook for full style state - pass 'main' or 'subgrid' context */
export const useStyleState = styleHooks.useHook;

/** Hook for main grid style state */
export const useMainStyleState = styleHooks.useMainHook;

/** Hook for subgrid style state */
export const useSubgridStyleState = styleHooks.useSubgridHook;

/** Hook for style data only (no UI state) - pass 'main' or 'subgrid' context */
export const useStyleData = styleDataHooks.useHook;

/** Hook for main grid style data */
export const useMainStyleData = styleDataHooks.useMainHook;

/** Hook for subgrid style data */
export const useSubgridStyleData = styleDataHooks.useSubgridHook;

export default useStyleState;
