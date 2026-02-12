import React from "react";

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
   Stack,
   Typography,
} from "@mui/material";

// Theme
import { useTheme } from '@mui/material/styles';

// MUI icons
import PostAddOutlinedIcon from "@mui/icons-material/PostAddOutlined";

const CreateTimeSeriesRecordDialog = (props: any) => {
   const theme = useTheme();
   const onSave = props.onSave;

   // global state
   const { selectedAccentColor, showCreateTimeSeriesRecordDialog, setShowCreateTimeSeriesRecordDialog } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor,
      showCreateTimeSeriesRecordDialog: state.showCreateTimeSeriesRecordDialog,
      setShowCreateTimeSeriesRecordDialog: state.setShowCreateTimeSeriesRecordDialog
   })));


   // local state
   const [value, setValue] = React.useState<number | null>(null);


   // functions
   const handleSave = () => {
      onSave(value);
      setShowCreateTimeSeriesRecordDialog(false);
   };

   const handleClose = () => {
      setShowCreateTimeSeriesRecordDialog(false);
   }

   const handleChange = (e: any) => {
      const onlyNums = e.target.value.replace(/[^0-9]/g, '');
      setValue(onlyNums);
   };

   return (
      <Dialog
         open={showCreateTimeSeriesRecordDialog}
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
            Create Time Series Records
         </DialogTitle>
         <DialogContent
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}
         >
            <Stack direction='column' sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}>
               <Typography sx={{ color: selectedAccentColor }}>Enter # of records to create:</Typography>
               <TextField
                  value={value}
                  onChange={handleChange}
                  variant="outlined"
                  type="text" // Use 'text' here to bypass browser number input restrictions
                  sx={{
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary,
                  }}
               />
            </Stack>

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
            >
               Create
            </Button>
         </DialogActions>
      </Dialog>
   );
};

export { CreateTimeSeriesRecordDialog };
