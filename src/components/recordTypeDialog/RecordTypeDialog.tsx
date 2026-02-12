import React from 'react';

// NEW: Domain-specific selector hooks
import { useRecordTypeState } from '../../hooks/selectors/useUIState';

// MUI
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

const RecordTypeDialog = () => {
   const theme = useTheme();

   // Use domain-specific hook for record type state
   const {
      selectedRecordType,
      setSelectedRecordType,
      setShowRecordTypeDialog,
      showRecordTypeDialog,
      recordTypes,
   } = useRecordTypeState();

   return (
      <Dialog
         open={showRecordTypeDialog}
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
            Select Record Type
         </DialogTitle>
         <DialogContent
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}
         >
            <FormControl fullWidth sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}>
               <InputLabel id="record-type-select-label">Record Type</InputLabel>
               <Select
                  labelId="record-type-select-label"
                  value={selectedRecordType}
                  onChange={(e) => setSelectedRecordType(e.target.value)}
                  label="Record Type"
               >
                  {recordTypes.map((rt: any) => (
                     <MenuItem key={rt.id} value={rt.id}>
                        {rt.name}
                     </MenuItem>
                  ))}
               </Select>
            </FormControl>
         </DialogContent>
         <DialogActions
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}
         >
            <Button onClick={setShowRecordTypeDialog(false)}>Cancel</Button>
            <Button onClick={setShowRecordTypeDialog(false)} color="primary">
               Select
            </Button>
         </DialogActions>
      </Dialog>
   );
};

export default RecordTypeDialog;
