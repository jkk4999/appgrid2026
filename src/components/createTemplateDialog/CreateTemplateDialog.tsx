import React, { useState } from "react";

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// Context
import { useGridContextOptional } from '../../context/GridContext';

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

interface CreateTemplateDialogProps {
   gridApi?: any;
   onSave: (name: string) => void;
}

const CreateTemplateDialog: React.FC<CreateTemplateDialogProps> = ({ onSave }) => {
   const theme = useTheme();

   // Get grid context (optional - may be null if not within GridProvider)
   const gridContext = useGridContextOptional();
   const isSubgrid = gridContext?.isSubgrid ?? false;

   // global state - select appropriate dialog state based on context
   const {
      showDialog,
      setShowDialog,
   } = useStore(useShallow((state) => ({
      showDialog: isSubgrid ? state.showSubgridCreateTemplateDialog : state.showCreateTemplateDialog,
      setShowDialog: isSubgrid ? state.setShowSubgridCreateTemplateDialog : state.setShowCreateTemplateDialog,
   })));

   // local state
   const [templateName, setTemplateName] = useState("");


   // functions
   const handleSave = () => {
      if (templateName.trim()) {
         console.log(`CreateTemplateDialog handleSave() - template name is ${templateName}`);
         onSave(templateName);
         setShowDialog(false);
         setTemplateName(""); // Reset input field
      }
   };

   const handleClose = () => {
      setShowDialog(false);
   }

   const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setTemplateName(event.target.value);
   };

   return (
      <Dialog
         open={showDialog}
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
            Create Template
         </DialogTitle>
         <DialogContent
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}
         >
            <TextField
               label="Enter Template Name"
               value={templateName}
               onChange={handleChange}
               variant="outlined"
               fullWidth
               autoFocus
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
               disabled={!templateName.trim()}
            >
               Save
            </Button>
         </DialogActions>
      </Dialog>
   );
};

export default CreateTemplateDialog;
