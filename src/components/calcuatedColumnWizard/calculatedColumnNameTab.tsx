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

import { useTheme } from '@mui/material';

import { AgCalculatedColumn } from '../../appInterfaces/grid/gridInterfaces';

interface CalculatedColumnNameProps {
   calculatedColumnCopy: AgCalculatedColumn
   updateCalculatedColumnProperty: <K extends keyof AgCalculatedColumn>(
      key: K,
      value: AgCalculatedColumn[K]
   ) => void;
}

const CalculatedColumnNameTab = ({ calculatedColumnCopy, updateCalculatedColumnProperty }: CalculatedColumnNameProps) => {

   const theme = useTheme();

   // global state
   const {
      selectedAccentColor
   } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor
   })));

   // local state
   const handleRowStyleActiveChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateCalculatedColumnProperty('active', event.target.checked);
   };

   return (
      <Stack direction='column'>
         {/* column name */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <Typography >
               Column name:
            </Typography>
            <TextField
               variant='standard'
               value={calculatedColumnCopy.name}
               onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  updateCalculatedColumnProperty('name', event.target.value);
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
            {/* active */}
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={calculatedColumnCopy.active}
                        onChange={handleRowStyleActiveChanged}
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

         {/* column description */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <Typography >
               Description:
            </Typography>
            <TextField
               multiline
               maxRows={4}
               value={calculatedColumnCopy.description}
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
                  updateCalculatedColumnProperty('description', event.target.value);
               }}
            />
         </Stack>
      </Stack>
   )
}

export { CalculatedColumnNameTab }