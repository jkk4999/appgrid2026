import React from "react";

// Unified context-based hooks
import { useGridDialogState } from '../../hooks/selectors';

// MUI
import {
   Dialog,
   DialogTitle,
   DialogContent,
   DialogActions,
   Button,
} from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

// interfaces
interface ConfirmationDialogProps {
   onClose: (confirmed: boolean) => void; // Callback to return the user's choice
   title?: string;
   message?: string;
}

const DeleteRecordDialog: React.FC<ConfirmationDialogProps> = ({
   onClose,
   title = "Confirm Action",
   message = "Are you sure you want to proceed?",
}) => {
   const theme = useTheme();

   // Use unified context-based hooks for dialog state (both main grid and subgrid)
   const mainDialogState = useGridDialogState('main');
   const subgridDialogState = useGridDialogState('subgrid');

   const showDeleteRecordDialog = mainDialogState.showDeleteRecordDialog;
   const showSubgridDeleteRecordDialog = subgridDialogState.showDeleteRecordDialog;
   const setShowDeleteRecordDialog = mainDialogState.setShowDeleteRecordDialog;
   const setShowSubgridDeleteRecordDialog = subgridDialogState.setShowDeleteRecordDialog;


   const handleConfirm = () => {
      setShowDeleteRecordDialog(false);
      setShowSubgridDeleteRecordDialog(false);
      onClose(true); // Return true for confirmation
   };

   const handleCancel = () => {
      setShowDeleteRecordDialog(false);
      setShowSubgridDeleteRecordDialog(false);
      onClose(false); // Return false for cancellation
   };

   return (
      <Dialog
         open={showDeleteRecordDialog || showSubgridDeleteRecordDialog}
         onClose={() => onClose(false)}
         aria-labelledby="confirm-dialog"
         sx={{
            '& .MuiDialog-paper': {
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            },
            '& .MuiBackdrop-root': {
               backgroundColor: 'transparent',
            },
         }}>
         <DialogTitle
            id="confirm-dialog"
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
            {message}
         </DialogContent>
         <DialogActions
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}
         >
            <Button onClick={handleCancel} color="secondary">
               Cancel
            </Button>
            <Button onClick={handleConfirm} color="primary" autoFocus>
               Confirm
            </Button>
         </DialogActions>
      </Dialog>
   );
};

export default DeleteRecordDialog;
