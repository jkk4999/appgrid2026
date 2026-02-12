import React from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore'

// MUI
import {
   Checkbox,
   FormControlLabel,
   FormGroup,
   Stack,
   TextField,
   Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles';

import { AgColumnStyle } from '../../appInterfaces/grid/gridInterfaces';


interface ColumnStyleNameProps {
   columnStyleCopy: AgColumnStyle
   updateColumnStyleProperty: <K extends keyof AgColumnStyle>(
      key: K,
      value: AgColumnStyle[K]
   ) => void;
}

const ColumnStyleNameTab = ({ columnStyleCopy, updateColumnStyleProperty }: ColumnStyleNameProps) => {

   const theme = useTheme();

   // global state
   const {
      selectedAccentColor
   } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor
   })));

   // local state
   const handleColumnStyleActiveChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateColumnStyleProperty('active', event.target.checked);
   };

   return (
      <Stack
         direction='column'
         sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
         }}
      >
         {/* style name / active*/}
         <Stack direction='row' alignItems="center" spacing={2}>
            <Typography >
               Style name:
            </Typography>
            <TextField
               variant='standard'
               value={columnStyleCopy.name}
               onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  updateColumnStyleProperty('name', event.target.value);
               }}
               sx={{
                  color: theme.palette.text.primary,
                  '& .MuiInputBase-input': {
                     color: theme.palette.text.primary, // Set input text color
                  },
                  '& .MuiFormLabel-root': {
                     color: selectedAccentColor, // Set label color
                  },
                  '& .MuiInput-underline:before': {
                     borderBottomColor: theme.palette.text.primary, // Color of the underline before focus
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                     borderBottomColor: theme.palette.text.primary, // Color of the underline on hover
                  },
                  '& .MuiInput-underline:after': {
                     borderBottomColor: selectedAccentColor, // Color of the underline after focus
                  },
               }}
            />
            {/* column style active */}
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={columnStyleCopy.active}
                        onChange={handleColumnStyleActiveChanged}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90,
                        }}
                     />}
                  label="Active"
                  labelPlacement="end"
               />
            </FormGroup>
         </Stack>

         {/* style description */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <Typography >
               Description:
            </Typography>
            <TextField
               multiline
               maxRows={4}
               value={columnStyleCopy.description}
               sx={{
                  width: 400,
                  color: theme.palette.text.primary,
                  '& .MuiInputBase-input': {
                     color: theme.palette.text.primary, // Set input text color
                  },
                  '& .MuiFormLabel-root': {
                     color: selectedAccentColor, // Set label color
                  },
               }}
               onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  updateColumnStyleProperty('description', event.target.value);
               }}
            />
         </Stack>
      </Stack>
   )
}

export { ColumnStyleNameTab }