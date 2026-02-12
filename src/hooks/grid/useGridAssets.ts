import { useMemo, useCallback } from 'react';
import { getStyles, setStyles, type StylesBundle } from '../../services/stylesService';
import { getCalculatedColumns, setCalculatedColumns } from '../../services/calculatedColumnsService';
import { createGridStateAccessor } from '../../store/gridStateAccessor';

export interface UseGridAssetsOptions {
  isSubgrid?: boolean;
}

export interface GridAssetsResult {
  /** Get current styles (column and row) */
  getStyles: () => StylesBundle<any, any>;
  /** Set styles (column and row) */
  setStyles: (bundle: StylesBundle<any, any>) => void;
  /** Get calculated columns */
  getCalculatedColumns: () => any[];
  /** Set calculated columns */
  setCalculatedColumns: (cols: any[]) => void;
  /** Get filter options */
  getFilterOptions: () => any[];
  /** Set filter options */
  setFilterOptions: (options: any[]) => void;
  /** Whether this is for the subgrid */
  isSubgrid: boolean;
}

/**
 * Facade hook that binds `isSubgrid` to style, calculated column,
 * and filter option getters/setters for simpler call sites.
 *
 * Uses the GridStateAccessor pattern for consistent state access.
 *
 * @example
 * ```tsx
 * const assets = useGridAssets({ isSubgrid: false });
 *
 * // Get current styles
 * const { columns, rows } = assets.getStyles();
 *
 * // Update calculated columns
 * assets.setCalculatedColumns([...newColumns]);
 * ```
 */
export function useGridAssets({ isSubgrid = false }: UseGridAssetsOptions): GridAssetsResult {
  // Create accessor for filter options (which uses the store directly)
  const accessor = useMemo(() => createGridStateAccessor(isSubgrid), [isSubgrid]);

  // Pre-bind all functions with isSubgrid
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

  const boundGetFilterOptions = useCallback(
    () => accessor.getFilterOptions(),
    [accessor]
  );

  const boundSetFilterOptions = useCallback(
    (options: any[]) => accessor.setFilterOptions(options),
    [accessor]
  );

  return useMemo(() => ({
    getStyles: boundGetStyles,
    setStyles: boundSetStyles,
    getCalculatedColumns: boundGetCalculatedColumns,
    setCalculatedColumns: boundSetCalculatedColumns,
    getFilterOptions: boundGetFilterOptions,
    setFilterOptions: boundSetFilterOptions,
    isSubgrid,
  }), [
    boundGetStyles,
    boundSetStyles,
    boundGetCalculatedColumns,
    boundSetCalculatedColumns,
    boundGetFilterOptions,
    boundSetFilterOptions,
    isSubgrid,
  ]);
}

export default useGridAssets;

