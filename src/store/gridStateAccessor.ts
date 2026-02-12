import useStore from '../zustandStore';
import type { StylesBundle } from '../services/stylesService';

/**
 * Grid State Accessor - Unified accessor pattern for main/subgrid state.
 *
 * This module provides a single source of truth for accessing state that differs
 * between main grid and subgrid. Instead of scattered ternary expressions, all
 * main/subgrid state mapping happens here.
 */

export interface GridStateAccessor {
  // Styles
  getColumnStyles: () => any[];
  setColumnStyles: (styles: any[]) => void;
  getRowStyles: () => any[];
  setRowStyles: (styles: any[]) => void;
  getStyles: () => StylesBundle<any, any>;
  setStyles: (bundle: StylesBundle<any, any>) => void;

  // Calculated Columns
  getCalculatedColumns: () => any[];
  setCalculatedColumns: (cols: any[]) => void;

  // Grid State
  getGridState: () => any;
  setGridState: (state: any) => void;
  getColumnState: () => any[];
  setColumnState: (state: any[]) => void;

  // Views
  getSelectedView: () => any;
  setSelectedView: (view: any) => void;
  getViews: () => any[];
  setViews: (views: any[]) => void;

  // Filter Options
  getFilterOptions: () => any[];
  setFilterOptions: (options: any[]) => void;

  // Row Data
  getRowData: () => any[];
  setRowData: (data: any[]) => void;

  // Changed Rows
  getChangedRows: () => any[];
  setChangedRows: (rows: any[]) => void;

  // Metadata
  getObjMetadata: () => any;
  setObjMetadata: (metadata: any) => void;
}

/**
 * State property mappings for main grid vs subgrid.
 * Each entry maps to [mainGridProperty, subgridProperty].
 */
const statePropertyMappings = {
  columnStyles: ['objColumnStyles', 'objSubgridColumnStyles'],
  rowStyles: ['objRowStyles', 'objSubgridRowStyles'],
  calculatedColumns: ['objCalculatedColumns', 'objCalculatedSubgridColumns'],
  gridState: ['objGridState', 'objSubgridGridState'],
  columnState: ['objColumnState', 'objSubgridColumnState'],
  selectedView: ['selectedView', 'subgridSelectedView'],
  views: ['views', 'subgridViews'],
  filterOptions: ['filterOptions', 'subgridFilterOptions'],
  rowData: ['rowData', 'subgridRowData'],
  changedRows: ['changedRows', 'subgridChangedRows'],
  objMetadata: ['selectedObjMetadata', 'subgridObjMetadata'],
} as const;

/**
 * Get setter name from property name.
 * e.g., 'objColumnStyles' -> 'setObjColumnStyles'
 */
function getSetterName(propertyName: string): string {
  return 'set' + propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
}

/**
 * Create a GridStateAccessor bound to a specific grid type.
 *
 * @param isSubgrid - Whether this accessor is for the subgrid
 * @returns GridStateAccessor with all methods bound to correct state properties
 *
 * @example
 * const accessor = createGridStateAccessor(false); // main grid
 * const styles = accessor.getColumnStyles();
 * accessor.setColumnStyles(newStyles);
 */
export function createGridStateAccessor(isSubgrid: boolean): GridStateAccessor {
  const getProperty = (key: keyof typeof statePropertyMappings): string => {
    const [mainProp, subgridProp] = statePropertyMappings[key];
    return isSubgrid ? subgridProp : mainProp;
  };

  const getState = () => useStore.getState() as any;

  return {
    // Column Styles
    getColumnStyles: () => {
      const prop = getProperty('columnStyles');
      return getState()[prop] ?? [];
    },
    setColumnStyles: (styles: any[]) => {
      const prop = getProperty('columnStyles');
      const setter = getSetterName(prop);
      getState()[setter]?.(styles);
    },

    // Row Styles
    getRowStyles: () => {
      const prop = getProperty('rowStyles');
      return getState()[prop] ?? [];
    },
    setRowStyles: (styles: any[]) => {
      const prop = getProperty('rowStyles');
      const setter = getSetterName(prop);
      getState()[setter]?.(styles);
    },

    // Combined Styles
    getStyles: () => ({
      columns: getState()[getProperty('columnStyles')] ?? [],
      rows: getState()[getProperty('rowStyles')] ?? [],
    }),
    setStyles: (bundle: StylesBundle<any, any>) => {
      const colProp = getProperty('columnStyles');
      const rowProp = getProperty('rowStyles');
      const colSetter = getSetterName(colProp);
      const rowSetter = getSetterName(rowProp);
      if (bundle.columns !== undefined) {
        getState()[colSetter]?.(bundle.columns ?? []);
      }
      if (bundle.rows !== undefined) {
        getState()[rowSetter]?.(bundle.rows ?? []);
      }
    },

    // Calculated Columns
    getCalculatedColumns: () => {
      const prop = getProperty('calculatedColumns');
      return getState()[prop] ?? [];
    },
    setCalculatedColumns: (cols: any[]) => {
      const prop = getProperty('calculatedColumns');
      const setter = getSetterName(prop);
      getState()[setter]?.(cols);
    },

    // Grid State
    getGridState: () => {
      const prop = getProperty('gridState');
      return getState()[prop] ?? null;
    },
    setGridState: (state: any) => {
      const prop = getProperty('gridState');
      const setter = getSetterName(prop);
      getState()[setter]?.(state);
    },

    // Column State
    getColumnState: () => {
      const prop = getProperty('columnState');
      return getState()[prop] ?? [];
    },
    setColumnState: (state: any[]) => {
      const prop = getProperty('columnState');
      const setter = getSetterName(prop);
      getState()[setter]?.(state);
    },

    // Selected View
    getSelectedView: () => {
      const prop = getProperty('selectedView');
      return getState()[prop] ?? null;
    },
    setSelectedView: (view: any) => {
      const prop = getProperty('selectedView');
      const setter = getSetterName(prop);
      getState()[setter]?.(view);
    },

    // Views
    getViews: () => {
      const prop = getProperty('views');
      return getState()[prop] ?? [];
    },
    setViews: (views: any[]) => {
      const prop = getProperty('views');
      const setter = getSetterName(prop);
      getState()[setter]?.(views);
    },

    // Filter Options
    getFilterOptions: () => {
      const prop = getProperty('filterOptions');
      return getState()[prop] ?? [];
    },
    setFilterOptions: (options: any[]) => {
      const prop = getProperty('filterOptions');
      const setter = getSetterName(prop);
      getState()[setter]?.(options);
    },

    // Row Data
    getRowData: () => {
      const prop = getProperty('rowData');
      return getState()[prop] ?? [];
    },
    setRowData: (data: any[]) => {
      const prop = getProperty('rowData');
      const setter = getSetterName(prop);
      getState()[setter]?.(data);
    },

    // Changed Rows
    getChangedRows: () => {
      const prop = getProperty('changedRows');
      return getState()[prop] ?? [];
    },
    setChangedRows: (rows: any[]) => {
      const prop = getProperty('changedRows');
      const setter = getSetterName(prop);
      getState()[setter]?.(rows);
    },

    // Object Metadata
    getObjMetadata: () => {
      const prop = getProperty('objMetadata');
      return getState()[prop] ?? null;
    },
    setObjMetadata: (metadata: any) => {
      const prop = getProperty('objMetadata');
      const setter = getSetterName(prop);
      getState()[setter]?.(metadata);
    },
  };
}

/**
 * Hook to get a memoized GridStateAccessor.
 *
 * @param isSubgrid - Whether this accessor is for the subgrid
 * @returns Memoized GridStateAccessor
 */
export function useGridStateAccessor(isSubgrid: boolean): GridStateAccessor {
  // Create accessor once per isSubgrid value
  // Note: This doesn't need useMemo because createGridStateAccessor returns
  // an object with stable function references that read from store on each call
  return createGridStateAccessor(isSubgrid);
}

export default createGridStateAccessor;
