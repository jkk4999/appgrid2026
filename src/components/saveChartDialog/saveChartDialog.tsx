import React, { useState } from "react";

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

const SaveChartDialog = (props: any) => {
   const theme = useTheme();

   const onSave = props.onSave;

   // global state
   const { setShowSaveChartDialog, showSaveChartDialog } = useStore(useShallow((state) => ({
      setShowSaveChartDialog: state.setShowSaveChartDialog,
      showSaveChartDialog: state.showSaveChartDialog
   })));

   // local state
   const [chartName, setChartName] = useState("");


   // functions
   const handleSave = () => {
      if (chartName.trim()) {
         console.log(`SaveChartDialog handleSave() - template name is ${chartName}`);
         onSave(chartName);
         setShowSaveChartDialog(false);
         setChartName(""); // Reset input field
      }
   };

   const handleClose = () => {
      setShowSaveChartDialog(false);
   }

   const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setChartName(event.target.value);
   };

   return (
      <Dialog
         open={showSaveChartDialog}
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
            Save Chart
         </DialogTitle>
         <DialogContent
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}
         >
            <TextField
               label="Enter Chart Name"
               value={chartName}
               onChange={handleChange}
               variant="outlined"
               fullWidth
               autoFocus
               sx={{
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
               disabled={!chartName.trim()}
            >
               Save
            </Button>
         </DialogActions>
      </Dialog>
   );
};

export { SaveChartDialog }
