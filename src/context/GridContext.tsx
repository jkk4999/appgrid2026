import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { StylesBundle } from '../services/stylesService';
import { getStyles, setStyles } from '../services/stylesService';
import { getCalculatedColumns, setCalculatedColumns } from '../services/calculatedColumnsService';

/**
 * GridContext provides grid identity (main vs subgrid) and commonly-needed functions.
 * This eliminates the need to thread `isSubgrid` through multiple layers.
 */
export interface GridContextValue {
  /** Whether this is a subgrid context */
  isSubgrid: boolean;
  /** Unique identifier for this grid instance */
  gridId: string;
  /** Get the AG-Grid API instance */
  getGridApi: () => GridApi | null;

  // Pre-bound asset functions (automatically use correct isSubgrid)
  /** Get current styles (column and row) */
  getStyles: () => StylesBundle<any, any>;
  /** Set styles (column and row) */
  setStyles: (bundle: StylesBundle<any, any>) => void;
  /** Get calculated columns */
  getCalculatedColumns: () => any[];
  /** Set calculated columns */
  setCalculatedColumns: (cols: any[]) => void;
}

const GridContext = createContext<GridContextValue | null>(null);

export interface GridProviderProps {
  children: ReactNode;
  isSubgrid: boolean;
  gridId: string;
  getGridApi: () => GridApi | null;
}

/**
 * Provider component that wraps grid components and provides context.
 * Use this at the top of AppGrid and SubgridCore to establish grid identity.
 */
export function GridProvider({
  children,
  isSubgrid,
  gridId,
  getGridApi
}: GridProviderProps) {
  // Pre-bind asset functions with isSubgrid
  const boundGetStyles = useCallback(
    () => getStyles({ isSubgrid }),
    [isSubgrid]
  );

  const boundSetStyles = useCallback(
    (bundle: StylesBundle<any, any>) => setStyles(bundle, { isSubgrid }),
    [isSubgrid]
  );

  const boundGetCalculatedColumns = useCallback(
    () => getCalculatedColumns({ isSubgrid }),
    [isSubgrid]
  );

  const boundSetCalculatedColumns = useCallback(
    (cols: any[]) => setCalculatedColumns(cols, { isSubgrid }),
    [isSubgrid]
  );

  const value = useMemo<GridContextValue>(() => ({
    isSubgrid,
    gridId,
    getGridApi,
    getStyles: boundGetStyles,
    setStyles: boundSetStyles,
    getCalculatedColumns: boundGetCalculatedColumns,
    setCalculatedColumns: boundSetCalculatedColumns,
  }), [
    isSubgrid,
    gridId,
    getGridApi,
    boundGetStyles,
    boundSetStyles,
    boundGetCalculatedColumns,
    boundSetCalculatedColumns
  ]);

  return (
    <GridContext.Provider value={value}>
      {children}
    </GridContext.Provider>
  );
}

/**
 * Hook to access GridContext. Must be used within a GridProvider.
 * Throws if used outside of GridProvider.
 */
export function useGridContext(): GridContextValue {
  const ctx = useContext(GridContext);
  if (!ctx) {
    throw new Error('useGridContext must be used within a GridProvider');
  }
  return ctx;
}

/**
 * Optional hook that returns null if not within GridProvider.
 * Use when context is optional (e.g., shared components).
 */
export function useGridContextOptional(): GridContextValue | null {
  return useContext(GridContext);
}

export default GridContext;
