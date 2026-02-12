import React from 'react';

// MUI
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

// Hook for confirmation dialog state
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';

/**
 * A unified confirmation dialog component that replaces all individual delete/confirmation dialogs.
 *
 * Instead of having separate dialogs like:
 * - DeleteRecordDialog
 * - DeleteFilterDialog
 * - DeleteTemplateDialog
 * - DeleteChartDialog
 * - DeleteQueryDialog
 * - etc.
 *
 * Use this single dialog with the useConfirmationDialog hook:
 *
 * @example
 * ```tsx
 * const { showConfirmation } = useConfirmationDialog();
 *
 * const handleDelete = async () => {
 *   const confirmed = await showConfirmation({
 *     title: 'Delete Record',
 *     message: 'Are you sure you want to delete this record?',
 *     confirmText: 'Delete',
 *     cancelText: 'Cancel',
 *     variant: 'danger',
 *   });
 *
 *   if (confirmed) {
 *     // Perform delete
 *   }
 * };
 * ```
 */
const ConfirmationDialog: React.FC = () => {
  const theme = useTheme();
  const { isOpen, config, handleConfirm, handleCancel } = useConfirmationDialog();

  const {
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
  } = config || {};

  // Determine button color based on variant
  const confirmButtonColor = variant === 'danger' ? 'error' : 'primary';

  return (
    <Dialog
      open={isOpen}
      onClose={handleCancel}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          minWidth: 300,
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <DialogTitle
        id="confirmation-dialog-title"
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <DialogContentText
          id="confirmation-dialog-description"
          sx={{ color: theme.palette.text.secondary }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          backgroundColor: theme.palette.background.paper,
          padding: '16px 24px',
        }}
      >
        <Button onClick={handleCancel} color="inherit">
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          color={confirmButtonColor}
          variant="contained"
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
