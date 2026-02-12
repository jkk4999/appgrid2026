import React from 'react';

// Zustand
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

import { AgColumnStyle } from '../../appInterfaces/grid/gridInterfaces';

import { CellAlignment } from '../../appInterfaces/grid/gridInterfaces';

import { useShallow } from 'zustand/react/shallow';

const cellAlignmentOptions = ['Left', 'Center', 'Right']

interface ColumnStyleSettingsTabProps {
   columnStyleCopy: AgColumnStyle,
   updateColumnStyleProperty: <K extends keyof AgColumnStyle>(
      key: K,
      value: AgColumnStyle[K]
   ) => void;
}

const ColumnStyleSettings = ({ columnStyleCopy, updateColumnStyleProperty }: ColumnStyleSettingsTabProps) => {

   const theme = useTheme();

   // GLOBAL STATE
   const {
      selectedAccentColor,
   } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor
   })))

   // local state
   const handleCellAlignmentChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateColumnStyleProperty('cellAlignmentChecked', event.target.checked)
   };

   const handleExcludeGroupRowsChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateColumnStyleProperty('excludeGroupRows', event.target.checked)
   };

   const handleExcludeSummaryRowsChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateColumnStyleProperty('excludeRowSummaries', event.target.checked)
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
                        checked={columnStyleCopy.cellAlignmentChecked || false}
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
               value={columnStyleCopy.cellAlignment}
               onChange={(event: React.SyntheticEvent, value) => {
                  updateColumnStyleProperty('cellAlignment', value as CellAlignment)
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
                     borderBottomColor: selectedAccentColor, // Hover underline color
                  },
                  '& .MuiInput-underline:after': {
                     borderBottomColor: selectedAccentColor, // Focused underline color
                  },
                  width: 150
               }}
               renderInput={(params) => <TextField {...params} variant="standard" sx={{
                  '& .MuiInputBase-input': {
                     color: theme.palette.text.primary, // Set input text color
                  },
                  '& .MuiFormLabel-root': {
                     color: selectedAccentColor, // Set label color
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
                        checked={columnStyleCopy.excludeGroupRows || false}
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
                        checked={columnStyleCopy.excludeRowSummaries || false
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

export { ColumnStyleSettings }