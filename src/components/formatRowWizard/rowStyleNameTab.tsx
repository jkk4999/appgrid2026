import React from 'react';

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

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

import { AgRowStyle } from '../../appInterfaces/grid/gridInterfaces';


interface RowStyleNameProps {
   rowStyleCopy: AgRowStyle
   updateRowStyleProperty: <K extends keyof AgRowStyle>(
      key: K,
      value: AgRowStyle[K]
   ) => void;
}

const RowStyleNameTab = ({ rowStyleCopy, updateRowStyleProperty }: RowStyleNameProps) => {
   const theme = useTheme();

   // global state
   const { selectedAccentColor } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor,
   })));

   // local state
   const handleRowStyleActiveChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateRowStyleProperty('active', event.target.checked);
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
               value={rowStyleCopy.name}
               onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  updateRowStyleProperty('name', event.target.value);
               }}
               sx={{
                  color: theme.palette.text.primary,
                  '& .MuiInputBase-input': {
                     color: theme.palette.text.primary
                  },
                  '& .MuiFormLabel-root': {
                     color: theme.palette.text.primary
                  },
                  '& .MuiInput-underline:before': {
                     borderBottomColor: theme.palette.text.primary
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                     borderBottomColor: theme.palette.text.primary
                  },
                  '& .MuiInput-underline:after': {
                     borderBottomColor: theme.palette.text.primary
                  },
               }}
            />
            {/* column style active */}
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={rowStyleCopy.active}
                        onChange={handleRowStyleActiveChanged}
                        sx={{
                           color: theme.palette.text.primary,
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
               value={rowStyleCopy.description}
               sx={{
                  width: 400,
                  color: theme.palette.text.primary,
                  '& .MuiInputBase-input': {
                     color: theme.palette.text.primary
                  },
                  '& .MuiFormLabel-root': {
                     color: theme.palette.text.primary
                  },
               }}
               onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  updateRowStyleProperty('description', event.target.value);
               }}
            />
         </Stack>
      </Stack>
   )
}

export { RowStyleNameTab }