import React, { useState, useRef, useEffect } from "react";

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// MUI
import {
   Dialog,
   DialogActions,
   DialogContent,
   DialogTitle,
   TextField,
   Button,
} from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

// MUI icons
import PostAddOutlinedIcon from "@mui/icons-material/PostAddOutlined";

type CreateFilterDialogProps = {
   onSave: (filterName: string) => void;
   title?: string;
};

const CreateFilterDialog: React.FC<CreateFilterDialogProps> = ({
   onSave,
   title = "Save Filter",
}) => {
   const theme = useTheme();

   // global state
   const {
      setShowCreateFilterDialog,
      setShowSubgridCreateFilterDialog,
      showCreateFilterDialog,
      showSubgridCreateFilterDialog
   } = useStore(useShallow((state) => ({
      setShowCreateFilterDialog: state.setShowCreateFilterDialog,
      setShowSubgridCreateFilterDialog: state.setShowSubgridCreateFilterDialog,
      showCreateFilterDialog: state.showCreateFilterDialog,
      showSubgridCreateFilterDialog: state.showSubgridCreateFilterDialog
   })));

   // local state
   const [filterName, setFilterName] = useState("");
   const inputRef = useRef<HTMLInputElement>(null);

   // Focus the input when dialog opens
   useEffect(() => {
      if (showCreateFilterDialog || showSubgridCreateFilterDialog) {
         // Use setTimeout to ensure the dialog is fully rendered before focusing
         const timer = setTimeout(() => {
            inputRef.current?.focus();
         }, 100);
         return () => clearTimeout(timer);
      }
   }, [showCreateFilterDialog, showSubgridCreateFilterDialog]);

   // functions
   const handleSave = () => {
      if (filterName.trim()) {
         console.log(`CreateFilterDialog handleSave() - filter name is ${filterName}`);
         onSave(filterName);
         setShowCreateFilterDialog(false);
         setShowSubgridCreateFilterDialog(false);
         setFilterName(""); // Reset input field
      }
   };

   const handleClose = () => {
      setShowCreateFilterDialog(false);
      setShowSubgridCreateFilterDialog(false);
   }

   const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setFilterName(event.target.value);
   };

   return (
      <Dialog
         open={showCreateFilterDialog || showSubgridCreateFilterDialog}
         onClose={handleClose}
         maxWidth="xs"
         fullWidth
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
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}
         >
            <PostAddOutlinedIcon fontSize="small" sx={{ marginRight: 1 }} />
            {title}
         </DialogTitle>
         <DialogContent
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}
         >
            <TextField
               label="Enter Filter Name"
               value={filterName}
               onChange={handleChange}
               variant="outlined"
               fullWidth
               autoFocus
               inputRef={inputRef}
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  margin: 2
               }}
            />
         </DialogContent>
         <DialogActions
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}
         >
            <Button onClick={handleClose} color="secondary">
               Cancel
            </Button>
            <Button
               onClick={handleSave}
               color="primary"
               variant="contained"
               disabled={!filterName.trim()}
            >
               Save
            </Button>
         </DialogActions>
      </Dialog>
   );
};

export default CreateFilterDialog;
