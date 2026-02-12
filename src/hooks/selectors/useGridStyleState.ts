/**
 * Unified Style State Hook
 *
 * This hook provides access to column and row styling state using a context parameter
 * instead of separate main/subgrid hooks.
 *
 * @example
 * // In main grid component
 * const { columnStyles, setColumnStyles } = useGridStyleState('main');
 *
 * // In subgrid component
 * const { columnStyles, setColumnStyles } = useGridStyleState('subgrid');
 */

import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore';
import type { GridContext, StyleStateWithActions } from './types';

/**
 * Creates a selector function for style state based on context.
 */
const createStyleSelector = (context: GridContext) => (state: any): StyleStateWithActions => {
  if (context === 'main') {
    return {
      // Column styles
      columnStyles: state.objColumnStyles,
      setColumnStyles: state.setObjColumnStyles,
      selectedColumnStyle: state.selectedColumnStyle,
      setSelectedColumnStyle: state.setSelectedColumnStyle,

      // Row styles
      rowStyles: state.objRowStyles,
      setRowStyles: state.setObjRowStyles,
      selectedRowStyle: state.selectedRowStyle,
      setSelectedRowStyle: state.setSelectedRowStyle,

      // Panel/dialog visibility
      showColumnStylePanel: state.showColumnStylePanel,
      setShowColumnStylePanel: state.setShowColumnStylePanel,
      showFormatColumnDialog: state.showFormatColumnDialog,
      setShowFormatColumnDialog: state.setShowFormatColumnDialog,
      showFormatRowDialog: state.showFormatRowDialog,
      setShowFormatRowDialog: state.setShowFormatRowDialog,
    };
  }
  // Subgrid context
  return {
    // Column styles
    columnStyles: state.objSubgridColumnStyles,
    setColumnStyles: state.setObjSubgridColumnStyles,
    selectedColumnStyle: state.selectedSubgridColumnStyle,
    setSelectedColumnStyle: state.setSelectedSubgridColumnStyle,

    // Row styles
    rowStyles: state.objSubgridRowStyles,
    setRowStyles: state.setObjSubgridRowStyles,
    selectedRowStyle: state.selectedSubgridRowStyle,
    setSelectedRowStyle: state.setSelectedSubgridRowStyle,

    // Panel/dialog visibility
    showColumnStylePanel: state.showSubgridColumnStylePanel,
    setShowColumnStylePanel: state.setShowSubgridColumnStylePanel,
    showFormatColumnDialog: state.showSubgridFormatColumnDialog,
    setShowFormatColumnDialog: state.setShowSubgridFormatColumnDialog,
    showFormatRowDialog: state.showSubgridFormatRowDialog,
    setShowFormatRowDialog: state.setShowSubgridFormatRowDialog,
  };
};

/**
 * Lightweight data-only selector (without UI state).
 */
interface StyleData {
  columnStyles: any[];
  setColumnStyles: (styles: any[]) => void;
  rowStyles: any[];
  setRowStyles: (styles: any[]) => void;
}

const createStyleDataSelector = (context: GridContext) => (state: any): StyleData => {
  if (context === 'main') {
    return {
      columnStyles: state.objColumnStyles,
      setColumnStyles: state.setObjColumnStyles,
      rowStyles: state.objRowStyles,
      setRowStyles: state.setObjRowStyles,
    };
  }
  return {
    columnStyles: state.objSubgridColumnStyles,
    setColumnStyles: state.setObjSubgridColumnStyles,
    rowStyles: state.objSubgridRowStyles,
    setRowStyles: state.setObjSubgridRowStyles,
  };
};

// Pre-created selectors for each context to ensure referential stability
const mainStyleSelector = createStyleSelector('main');
const subgridStyleSelector = createStyleSelector('subgrid');
const mainStyleDataSelector = createStyleDataSelector('main');
const subgridStyleDataSelector = createStyleDataSelector('subgrid');

/**
 * Unified hook for column and row style state.
 *
 * @param context - The grid context ('main' or 'subgrid')
 * @returns Style state and setters with consistent property names
 */
export function useGridStyleState(context: GridContext): StyleStateWithActions {
  const selector = context === 'main' ? mainStyleSelector : subgridStyleSelector;
  return useStore(useShallow(selector));
}

/**
 * Lightweight hook for just getting/setting styles without UI state.
 *
 * @param context - The grid context ('main' or 'subgrid')
 * @returns Style data and setters only
 */
export function useGridStyleData(context: GridContext): StyleData {
  const selector = context === 'main' ? mainStyleDataSelector : subgridStyleDataSelector;
  return useStore(useShallow(selector));
}

export default useGridStyleState;
