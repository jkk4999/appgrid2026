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

const DeleteFilterDialog: React.FC<ConfirmationDialogProps> = ({
   onClose,
   title = "Confirm Action",
   message = "Are you sure you want to proceed?",
}) => {
   const theme = useTheme();

   // Use unified context-based hooks for dialog state (both main grid and subgrid)
   const mainDialogState = useGridDialogState('main');
   const subgridDialogState = useGridDialogState('subgrid');

   const showDeleteFilterDialog = mainDialogState.showDeleteFilterDialog;
   const showSubgridDeleteFilterDialog = subgridDialogState.showDeleteFilterDialog;
   const setShowDeleteFilterDialog = mainDialogState.setShowDeleteFilterDialog;
   const setShowSubgridDeleteFilterDialog = subgridDialogState.setShowDeleteFilterDialog;


   const handleConfirm = () => {
      setShowDeleteFilterDialog(false);
      setShowSubgridDeleteFilterDialog(false);
      onClose(true); // Return true for confirmation
   };

   const handleCancel = () => {
      setShowDeleteFilterDialog(false);
      setShowSubgridDeleteFilterDialog(false);
      onClose(false); // Return false for cancellation
   };

   return (
      <Dialog
         open={showDeleteFilterDialog || showSubgridDeleteFilterDialog}
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

export default DeleteFilterDialog;
