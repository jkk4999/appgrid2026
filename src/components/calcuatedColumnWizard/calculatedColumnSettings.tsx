import React, { } from 'react';

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
   Typography,
} from '@mui/material'

import { useTheme } from '@mui/material';

import { AgCalculatedColumn, TargetDataType } from '../../appInterfaces/grid/gridInterfaces';

interface CalculatedColumnSettingsProps {
   calculatedColumnCopy: AgCalculatedColumn,
   updateCalculatedColumnProperty: <K extends keyof AgCalculatedColumn>(
      key: K,
      value: AgCalculatedColumn[K]
   ) => void;
}

const CalculatedColumnSettings = ({ calculatedColumnCopy, updateCalculatedColumnProperty }: CalculatedColumnSettingsProps) => {
   const theme = useTheme();

   // global state
   const {
      selectedAccentColor
   } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor
   })));

   // local state
   const dataTypeOptions: TargetDataType[] = ['BOOLEAN', 'CURRENCY', 'DATE', 'DATETIME', 'DECIMAL', 'INTEGER', 'PERCENTAGE', 'STRING']

   return (
      <Stack
         direction='column'
         sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
         }}
      >
         <Stack direction='row' spacing={2} alignItems={'center'}>
            <Typography >
               Data type:
            </Typography>
            { /* data type */}
            <Autocomplete
               disablePortal
               options={dataTypeOptions}
               value={calculatedColumnCopy.dataType}
               onChange={(event: React.SyntheticEvent, value) => {
                  updateCalculatedColumnProperty('dataType', value!)
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
                  width: 125
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

         <Typography sx={{ mt: 2 }}>
            Settings:
         </Typography>

         {/* aggregatable */}
         <Stack direction='row' alignItems="center" spacing={2} sx={{ mt: 2 }}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={calculatedColumnCopy.aggregatable || false}
                        onChange={(event, checked) => updateCalculatedColumnProperty('aggregatable', checked)}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90,
                        }}
                     />}
                  label="Aggregatable"
                  labelPlacement="end"
               />
            </FormGroup>
         </Stack>

         {/* filterable */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={calculatedColumnCopy.filterable || false}
                        onChange={(event, checked) => updateCalculatedColumnProperty('filterable', checked)}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90,
                        }}
                     />}
                  label="Filterable"
                  labelPlacement="end"
               />
            </FormGroup>
         </Stack>

         {/* groupable */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={calculatedColumnCopy.groupable || false}
                        onChange={(event, checked) => updateCalculatedColumnProperty('groupable', checked)}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90,
                        }}
                     />}
                  label="Groupable"
                  labelPlacement="end"
               />
            </FormGroup>
         </Stack>

         {/* pivotable */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={calculatedColumnCopy.pivotable || false}
                        onChange={(event, checked) => updateCalculatedColumnProperty('pivotable', checked)}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90,
                        }}
                     />}
                  label="Pivotable"
                  labelPlacement="end"
               />
            </FormGroup>
         </Stack>

         {/* resizable */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={calculatedColumnCopy.resizable || false}
                        onChange={(event, checked) => updateCalculatedColumnProperty('resizable', checked)}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90,
                        }}
                     />}
                  label="Resizable"
                  labelPlacement="end"
               />
            </FormGroup>
         </Stack>

         {/* sortable */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={calculatedColumnCopy.sortable || false}
                        onChange={(event, checked) => updateCalculatedColumnProperty('sortable', checked)}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90,
                        }}
                     />}
                  label="Sortable"
                  labelPlacement="end"
               />
            </FormGroup>
         </Stack>

         {/* suppressHeaderMenuButton */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={calculatedColumnCopy.suppressHeaderMenuButton || false}
                        onChange={(event, checked) => updateCalculatedColumnProperty('suppressHeaderMenuButton', checked)}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90,
                        }}
                     />}
                  label="Suppress Menu"
                  labelPlacement="end"
               />
            </FormGroup>
         </Stack>
      </Stack>
   )
}

export { CalculatedColumnSettings }