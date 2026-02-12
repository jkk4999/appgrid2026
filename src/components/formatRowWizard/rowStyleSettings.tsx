import React from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';

import useStore from '../../zustandStore'

// MUI
import {
   Autocomplete,
   Checkbox,
   FormControlLabel,
   FormGroup,
   Stack,
   TextField,
} from '@mui/material'

import { useTheme } from '@mui/material/styles';

import { AgRowStyle } from '../../appInterfaces/grid/gridInterfaces';

import { CellAlignment } from '../../appInterfaces/grid/gridInterfaces';

const cellAlignmentOptions = ['Left', 'Center', 'Right']

interface RowStyleSettingsTabProps {
   rowStyleCopy: AgRowStyle,
   updateRowStyleProperty: <K extends keyof AgRowStyle>(
      key: K,
      value: AgRowStyle[K]
   ) => void;
}

const RowStyleSettings = ({ rowStyleCopy, updateRowStyleProperty }: RowStyleSettingsTabProps) => {

   const theme = useTheme();

   // global state
   const {
      selectedAccentColor
   } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor
   })));

   // local state
   const handleCellAlignmentChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateRowStyleProperty('cellAlignmentChecked', event.target.checked)

   };

   const handleExcludeGroupRowsChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateRowStyleProperty('excludeGroupRows', event.target.checked)
   };

   const handleExcludeSummaryRowsChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateRowStyleProperty('excludeRowSummaries', event.target.checked)
   };

   return (
      <Stack
         direction='column'
         sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
         }}
      >
         {/* cell alignment */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={rowStyleCopy.cellAlignmentChecked || false}
                        onChange={handleCellAlignmentChecked}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90,
                        }}
                     />}
                  label="Cell Alignment"
                  labelPlacement="end"
               />
            </FormGroup>
            <Autocomplete
               disablePortal
               options={cellAlignmentOptions}
               value={rowStyleCopy.cellAlignment}
               onChange={(event: React.SyntheticEvent, value) => {
                  updateRowStyleProperty('cellAlignment', value as CellAlignment)
               }}
               slotProps={{
                  popper: {
                     sx: {
                        zIndex: 3000, // Set your desired zIndex value here
                     }
                  }
               }}
               sx={{
                  '& .MuiAutocomplete-popupIndicator': {
                     color: theme.palette.text.primary, // Set the dropdown arrow color
                  },
                  '& .MuiAutocomplete-clearIndicator': {
                     color: theme.palette.text.primary, // Clear button color
                  },
                  '& .MuiInput-underline:before': {
                     borderBottomColor: theme.palette.text.primary, // Default underline color
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                     borderBottomColor: theme.palette.text.primary, // Hover underline color
                  },
                  '& .MuiInput-underline:after': {
                     borderBottomColor: theme.palette.text.primary, // Focused underline color
                  },
                  width: 150
               }}
               renderInput={(params) => <TextField {...params} variant="standard" sx={{
                  '& .MuiInputBase-input': {
                     color: theme.palette.text.primary, // Set input text color
                  },
                  '& .MuiFormLabel-root': {
                     color: theme.palette.text.primary, // Set label color
                  },
               }} />}
            />
         </Stack>

         {/* exclude group rows */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={rowStyleCopy.excludeGroupRows || false}
                        onChange={handleExcludeGroupRowsChecked}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90,
                        }}
                     />}
                  label="Exclude Data Rows"
                  labelPlacement="end"
               />
            </FormGroup>
         </Stack>

         {/* exclude summary rows */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={rowStyleCopy.excludeRowSummaries || false
                        }
                        onChange={handleExcludeSummaryRowsChecked}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90,
                        }}
                     />}
                  label="Exclude Summary Rows"
                  labelPlacement="end"
               />
            </FormGroup>
         </Stack>
      </Stack>
   )
}

export { RowStyleSettings }