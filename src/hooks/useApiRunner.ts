import { useMemo } from 'react';
import { makeApiRunner } from '../utilities/apiErrors';
import { useSnackbarAction } from './useSnackbarAction';

/**
 * Returns a memoized apiRun function wired with notistack snackbar and action.
 * Usage: const apiRun = useApiRunner();
 */
export function useApiRunner() {
  const { enqueueSnackbar, action } = useSnackbarAction();
  const apiRun = useMemo(() => makeApiRunner({ enqueueSnackbar, action }), [enqueueSnackbar, action]);
  return apiRun;
}

