import React from "react";

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

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

const DeleteTemplateDialog: React.FC<ConfirmationDialogProps> = ({
   onClose,
   title = "Confirm Action",
   message = "Are you sure you want to proceed?",
}) => {
   const theme = useTheme();

   // global state
   const { showDeleteTemplateDialog, setShowDeleteTemplateDialog } = useStore(useShallow((state) => ({
      showDeleteTemplateDialog: state.showDeleteTemplateDialog,
      setShowDeleteTemplateDialog: state.setShowDeleteTemplateDialog
   })));


   const handleConfirm = () => {
      setShowDeleteTemplateDialog(false);
      onClose(true); // Return true for confirmation
   };

   const handleCancel = () => {
      setShowDeleteTemplateDialog(false);
      onClose(false); // Return false for cancellation
   };

   return (
      <Dialog
         open={showDeleteTemplateDialog}
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

export default DeleteTemplateDialog;
