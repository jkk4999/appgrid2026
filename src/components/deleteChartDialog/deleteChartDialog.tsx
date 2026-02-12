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

// interfaces
interface ConfirmationDialogProps {
   onClose: (confirmed: boolean) => void; // Callback to return the user's choice
   title?: string;
   message?: string;
}

const DeleteChartDialog: React.FC<ConfirmationDialogProps> = ({
   onClose,
   title = "Confirm Action",
   message = "Are you sure you want to proceed?",
}) => {

   // global state
   const { showDeleteChartDialog, setShowDeleteChartDialog } = useStore(useShallow((state) => ({
      showDeleteChartDialog: state.showDeleteChartDialog,
      setShowDeleteChartDialog: state.setShowDeleteChartDialog
   })));


   const handleConfirm = () => {
      setShowDeleteChartDialog(false);
      onClose(true); // Return true for confirmation
   };

   const handleCancel = () => {
      setShowDeleteChartDialog(false);
      onClose(false); // Return false for cancellation
   };

   return (
      <Dialog open={showDeleteChartDialog} onClose={() => onClose(false)} aria-labelledby="confirm-dialog">
         <DialogTitle id="confirm-dialog">{title}</DialogTitle>
         <DialogContent>{message}</DialogContent>
         <DialogActions>
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

export { DeleteChartDialog }
