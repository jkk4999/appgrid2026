/**
 * Error State Hooks
 *
 * Provides hooks for accessing grid error state with automatic
 * main/subgrid context handling.
 *
 * Note: Error state uses custom action names (setError, removeError, clearErrors)
 * instead of auto-generated setters, so we use manual selectors here.
 */

import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore';
import type { GridContext } from './types';

// ============================================================
// ERROR STATE INTERFACE
// ============================================================

interface ErrorStateWithActions {
  errors: Map<string, string>;
  setError: (rowId: string, error: string) => void;
  removeError: (rowId: string) => void;
  clearErrors: () => void;
}

interface ErrorStateWithHelpers extends ErrorStateWithActions {
  hasErrors: () => boolean;
  getError: (rowId: string) => string | undefined;
  hasError: (rowId: string) => boolean;
  getErrorCount: () => number;
}

// ============================================================
// SELECTORS
// ============================================================

const mainErrorSelector = (state: any): ErrorStateWithActions => ({
  errors: state.gridErrors,
  setError: state.setGridError,
  removeError: state.removeGridError,
  clearErrors: state.clearGridErrors,
});

const subgridErrorSelector = (state: any): ErrorStateWithActions => ({
  errors: state.subgridErrors,
  setError: state.setSubgridError,
  removeError: state.removeSubgridError,
  clearErrors: state.clearSubgridErrors,
});

// ============================================================
// CONTEXT-AWARE HOOKS
// ============================================================

/** Hook for error state - pass 'main' or 'subgrid' context */
export function useErrorState(context: GridContext): ErrorStateWithActions {
  const selector = context === 'main' ? mainErrorSelector : subgridErrorSelector;
  return useStore(useShallow(selector));
}

/** Hook for main grid error state */
export function useMainErrorState(): ErrorStateWithActions {
  return useStore(useShallow(mainErrorSelector));
}

/** Hook for subgrid error state */
export function useSubgridErrorState(): ErrorStateWithActions {
  return useStore(useShallow(subgridErrorSelector));
}

// ============================================================
// HOOKS WITH HELPER FUNCTIONS
// ============================================================

/** Hook for error state with helper functions - pass 'main' or 'subgrid' context */
export function useErrorStateWithHelpers(context: GridContext): ErrorStateWithHelpers {
  const { errors, setError, removeError, clearErrors } = useErrorState(context);

  const hasErrors = useCallback(() => errors.size > 0, [errors]);
  const getError = useCallback((rowId: string) => errors.get(rowId), [errors]);
  const hasError = useCallback((rowId: string) => errors.has(rowId), [errors]);
  const getErrorCount = useCallback(() => errors.size, [errors]);

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

/** Hook for main grid error state with helpers */
export function useMainErrorStateWithHelpers(): ErrorStateWithHelpers {
  return useErrorStateWithHelpers('main');
}

/** Hook for subgrid error state with helpers */
export function useSubgridErrorStateWithHelpers(): ErrorStateWithHelpers {
  return useErrorStateWithHelpers('subgrid');
}

export default useErrorState;
