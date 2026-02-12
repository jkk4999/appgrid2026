/**
 * Unified Calculated Column State Hook
 *
 * This hook provides access to calculated column state using a context parameter
 * instead of separate main/subgrid hooks.
 *
 * @example
 * // In main grid component
 * const { calculatedColumns, setCalculatedColumns } = useGridCalculatedColumnState('main');
 *
 * // In subgrid component
 * const { calculatedColumns, setCalculatedColumns } = useGridCalculatedColumnState('subgrid');
 */

import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore';
import type { GridContext, CalculatedColumnStateWithActions } from './types';

/**
 * Creates a selector function for calculated column state based on context.
 */
const createCalculatedColumnSelector = (context: GridContext) => (state: any): CalculatedColumnStateWithActions => {
  if (context === 'main') {
    return {
      calculatedColumns: state.objCalculatedColumns,
      setCalculatedColumns: state.setObjCalculatedColumns,
      selectedCalculatedColumn: state.selectedCalculatedColumn,
      setSelectedCalculatedColumn: state.setSelectedCalculatedColumn,
      showCalculatedColumnPanel: state.showCalculatedColumnPanel,
      setShowCalculatedColumnPanel: state.setShowCalculatedColumnPanel,
      showCalculatedColumnDialog: state.showCalculatedColumnDialog,
      setShowCalculatedColumnDialog: state.setShowCalculatedColumnDialog,
    };
  }
  // Subgrid context
  return {
    calculatedColumns: state.objCalculatedSubgridColumns,
    setCalculatedColumns: state.setObjCalculatedSubgridColumns,
    selectedCalculatedColumn: state.selectedSubgridCalculatedColumn,
    setSelectedCalculatedColumn: state.setSelectedSubgridCalculatedColumn,
    showCalculatedColumnPanel: state.showSubgridCalculatedColumnPanel,
    setShowCalculatedColumnPanel: state.setShowSubgridCalculatedColumnPanel,
    showCalculatedColumnDialog: state.showSubgridCalculatedColumnDialog,
    setShowCalculatedColumnDialog: state.setShowSubgridCalculatedColumnDialog,
  };
};

/**
 * Lightweight data-only selector (without UI state).
 */
interface CalculatedColumnData {
  calculatedColumns: any[];
  setCalculatedColumns: (columns: any[]) => void;
}

const createCalculatedColumnDataSelector = (context: GridContext) => (state: any): CalculatedColumnData => {
  if (context === 'main') {
    return {
      calculatedColumns: state.objCalculatedColumns,
      setCalculatedColumns: state.setObjCalculatedColumns,
    };
  }
  return {
    calculatedColumns: state.objCalculatedSubgridColumns,
    setCalculatedColumns: state.setObjCalculatedSubgridColumns,
  };
};

// Pre-created selectors for each context to ensure referential stability
const mainCalculatedColumnSelector = createCalculatedColumnSelector('main');
const subgridCalculatedColumnSelector = createCalculatedColumnSelector('subgrid');
const mainCalculatedColumnDataSelector = createCalculatedColumnDataSelector('main');
const subgridCalculatedColumnDataSelector = createCalculatedColumnDataSelector('subgrid');

/**
 * Unified hook for calculated column state.
 *
 * @param context - The grid context ('main' or 'subgrid')
 * @returns Calculated column state and setters with consistent property names
 */
export function useGridCalculatedColumnState(context: GridContext): CalculatedColumnStateWithActions {
  const selector = context === 'main' ? mainCalculatedColumnSelector : subgridCalculatedColumnSelector;
  return useStore(useShallow(selector));
}

/**
 * Lightweight hook for just getting/setting calculated columns without UI state.
 *
 * @param context - The grid context ('main' or 'subgrid')
 * @returns Calculated column data and setter only
 */
export function useGridCalculatedColumnData(context: GridContext): CalculatedColumnData {
  const selector = context === 'main' ? mainCalculatedColumnDataSelector : subgridCalculatedColumnDataSelector;
  return useStore(useShallow(selector));
}

export default useGridCalculatedColumnState;
