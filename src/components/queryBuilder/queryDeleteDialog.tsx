import React from 'react';
// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';
// Mui
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';

interface QueryDeleteDialogProps {
  onConfirm?: () => void | Promise<void>;
}

export default function QueryDeleteConfirmationDialog({ onConfirm }: QueryDeleteDialogProps) {
  const theme = useTheme();

  const { showQueryDeleteDialog, setShowQueryDeleteDialog } = useStore(
    useShallow((state) => ({
      showQueryDeleteDialog: state.showQueryDeleteDialog,
      setShowQueryDeleteDialog: state.setShowQueryDeleteDialog,
    }))
  );

  const handleCancel = () => {
    setShowQueryDeleteDialog(false);
  };

  const handleDelete = async () => {
    try {
      await onConfirm?.();
    } finally {
      // The caller decides further UI updates; we always close this small dialog
      setShowQueryDeleteDialog(false);
    }
  };

  return (
    <Dialog
      sx={{
        '& .MuiDialog-paper': {
          width: '25%',
          maxHeight: 400,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'transparent',
        },
      }}
      maxWidth="xs"
      open={showQueryDeleteDialog}
      style={{ zIndex: 15000 }}
    >
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        Delete Selected Query?
      </DialogTitle>
      <DialogActions
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Button autoFocus onClick={handleCancel}>Cancel</Button>
        <Button color="error" onClick={handleDelete}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}
