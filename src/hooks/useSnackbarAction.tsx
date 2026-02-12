import { useCallback } from 'react';
import { useSnackbar } from 'notistack';
import type { SnackbarKey } from 'notistack';
import { Button } from '@mui/material';

/**
 * Provides a standard notistack action that renders a simple
 * "Dismiss" button wired to close the specific snackbar.
 * Returns { enqueueSnackbar, closeSnackbar, action } for convenience.
 */
export function useSnackbarAction() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const action = useCallback(
    (snackbarId: SnackbarKey | undefined) => (
      <Button
        size="small"
        variant="outlined"
        onClick={() => closeSnackbar(snackbarId)}
        sx={{
          color: '#fff',
          borderColor: 'rgba(255,255,255,0.7)',
          textTransform: 'none',
          '&:hover': {
            borderColor: '#fff',
            backgroundColor: 'rgba(255,255,255,0.1)'
          }
        }}
      >
        Dismiss
      </Button>
    ),
    [closeSnackbar]
  );

  return { enqueueSnackbar, closeSnackbar, action } as const;
}
