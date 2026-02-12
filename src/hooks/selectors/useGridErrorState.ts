import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore';
import type { GridContext, ErrorStateWithActions } from './types';

/** Context parameter - accepts GridContext string or boolean for backward compatibility */
type ContextParam = GridContext | boolean;

/** Normalize context to GridContext */
function normalizeContext(context: ContextParam): GridContext {
  if (typeof context === 'boolean') {
    return context ? 'subgrid' : 'main';
  }
  return context;
}

// ============================================================
// MAIN GRID SELECTORS (stable - no conditionals)
// ============================================================

const mainGridErrorSelector = (state: any): ErrorStateWithActions => ({
  errors: state.gridErrors,
  setError: state.setGridError,
  removeError: state.removeGridError,
  clearErrors: state.clearGridErrors,
});

// ============================================================
// SUBGRID SELECTORS (stable - no conditionals)
// ============================================================

const subgridErrorSelector = (state: any): ErrorStateWithActions => ({
  errors: state.subgridErrors,
  setError: state.setSubgridError,
  removeError: state.removeSubgridError,
  clearErrors: state.clearSubgridErrors,
});

// ============================================================
// HOOK EXPORTS
// ============================================================

/**
 * Selector hook for grid error state.
 * Use this instead of accessing error state directly from the main store.
 * @param context - 'main' or 'subgrid' (or boolean for legacy: false=main, true=subgrid)
 */
export function useGridErrorState(context: ContextParam = 'main') {
  const normalized = normalizeContext(context);
  const mainResult = useStore(useShallow(mainGridErrorSelector));
  const subgridResult = useStore(useShallow(subgridErrorSelector));
  return normalized === 'subgrid' ? subgridResult : mainResult;
}

/**
 * Dedicated hook for subgrid error state - preferred for subgrid components.
 */
export function useSubgridErrorState() {
  return useStore(useShallow(subgridErrorSelector));
}

/**
 * Dedicated hook for main grid error state - preferred for main grid components.
 */
export function useMainGridErrorState() {
  return useStore(useShallow(mainGridErrorSelector));
}

/**
 * Hook for managing grid errors with helper functions.
 * @param context - 'main' or 'subgrid' (or boolean for legacy: false=main, true=subgrid)
 */
export function useGridErrors(context: ContextParam = 'main') {
  const { errors, setError, removeError, clearErrors } = useGridErrorState(context);

  const hasErrors = useCallback(() => {
    return errors.size > 0;
  }, [errors]);

  const getError = useCallback((rowId: string): string | undefined => {
    return errors.get(rowId);
  }, [errors]);

  const hasError = useCallback((rowId: string): boolean => {
    return errors.has(rowId);
  }, [errors]);

  const getErrorCount = useCallback(() => {
    return errors.size;
  }, [errors]);

  return {
    errors,
    setError,
    removeError,
    clearErrors,
    hasErrors,
    getError,
    hasError,
    getErrorCount,
  };
}

/**
 * Hook for managing subgrid errors with helper functions - preferred for subgrid components.
 */
export function useSubgridErrors() {
  const { errors, setError, removeError, clearErrors } = useSubgridErrorState();

  const hasErrors = useCallback(() => {
    return errors.size > 0;
  }, [errors]);

  const getError = useCallback((rowId: string): string | undefined => {
    return errors.get(rowId);
  }, [errors]);

  const hasError = useCallback((rowId: string): boolean => {
    return errors.has(rowId);
  }, [errors]);

  const getErrorCount = useCallback(() => {
    return errors.size;
  }, [errors]);

  return {
    errors,
    setError,
    removeError,
    clearErrors,
    hasErrors,
    getError,
    hasError,
    getErrorCount,
  };
}

// ============================================================
// UNIFIED CONTEXT-BASED HOOKS (new pattern)
// ============================================================

/**
 * Unified hook for grid error state using context parameter.
 *
 * @param context - The grid context ('main' or 'subgrid')
 * @returns Error state and actions with consistent property names
 */
export function useGridContextErrorState(context: GridContext): ErrorStateWithActions {
  const selector = context === 'main' ? mainGridErrorSelector : subgridErrorSelector;
  return useStore(useShallow(selector));
}

/**
 * Unified hook for managing grid errors with helper functions using context parameter.
 *
 * @param context - The grid context ('main' or 'subgrid')
 * @returns Error state, actions, and helper functions
 */
export function useGridContextErrors(context: GridContext) {
  const { errors, setError, removeError, clearErrors } = useGridContextErrorState(context);

  const hasErrors = useCallback(() => {
    return errors.size > 0;
  }, [errors]);

  const getError = useCallback((rowId: string): string | undefined => {
    return errors.get(rowId);
  }, [errors]);

  const hasError = useCallback((rowId: string): boolean => {
    return errors.has(rowId);
  }, [errors]);

  const getErrorCount = useCallback(() => {
    return errors.size;
  }, [errors]);

  return {
    errors,
    setError,
    removeError,
    clearErrors,
    hasErrors,
    getError,
    hasError,
    getErrorCount,
  };
}

export default useGridErrorState;
