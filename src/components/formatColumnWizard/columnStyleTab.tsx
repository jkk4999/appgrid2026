import React from 'react';

// Zustand
import useStore from '../../zustandStore'

// components
import { OpacitySlider } from './opacitySlider';

import { ColorPickerComponent, ColorPickerEventArgs } from '@syncfusion/ej2-react-inputs';

// MUI
import {
   Autocomplete,
   Checkbox,
   FormControl,
   FormControlLabel,
   FormGroup,
   FormLabel,
   Radio,
   RadioGroup,
   Stack,
   TextField,
   Typography,
} from '@mui/material'

import { useTheme } from '@mui/material/styles';

import { AgColumnStyle, FontSize, FontStyle } from '../../appInterfaces/grid/gridInterfaces'

import { useShallow } from 'zustand/react/shallow';

const fontSizeOptions = ['Default', 'XSmall', 'Small', 'Medium', 'Large', 'XLarge']

interface ColumnStyleTabProps {
   columnStyleCopy: AgColumnStyle,
   updateColumnStyleProperty: <K extends keyof AgColumnStyle>(
      key: K,
      value: AgColumnStyle[K]
   ) => void;
}

const ColumnStyleTab = ({ columnStyleCopy, updateColumnStyleProperty }: ColumnStyleTabProps) => {

   const theme = useTheme();

   // global state
   const {
      selectedAccentColor,
   } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor,
   })))


   // LOCAL STATE

   const handleFontSizeChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateColumnStyleProperty('fontSizeChecked', event.target.checked)
   };

   const handleFontStyleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateColumnStyleProperty('fontStyleChecked', event.target.checked)
   };

   const handleBackgroundColorChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateColumnStyleProperty('backgroundColorChecked', event.target.checked)
   };

   const handleBackgroundColorChange = (args: ColorPickerEventArgs) => {
      updateColumnStyleProperty('backgroundColor', args.currentValue.hex)
   };

   const handleBorderColorChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateColumnStyleProperty('borderColorChecked', event.target.checked)
   };

   const handleBorderColorChange = (args: ColorPickerEventArgs) => {
      updateColumnStyleProperty('borderColor', args.currentValue.hex)
   };

   const handleFontStyleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
      updateColumnStyleProperty('fontStyle', value as FontStyle)
   };

   const handleForegroundColorChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateColumnStyleProperty('colorChecked', event.target.checked)
   };

   const handleForegroundColorChange = (args: ColorPickerEventArgs) => {
      updateColumnStyleProperty('color', args.currentValue.hex)
   };

   return (
      <Stack
         direction='column'
         sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
         }}
      >
         <Typography >
            Set colors by ticking a checkbox and selecting from the dropdown; leave unchecked to use cell&apos;s existing colours
         </Typography>

         {/* background color */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={columnStyleCopy.backgroundColorChecked}
                        onChange={handleBackgroundColorChecked}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90,
                        }}
                     />}
                  label="Background" sx={{ textAlign: 'left', width: '100%' }} />
            </FormGroup>
            <ColorPickerComponent value={columnStyleCopy.backgroundColor ?? '#808080'} change={handleBackgroundColorChange} />
            <OpacitySlider styleProperty={'backgroundColorOpacity'} styleColor={'backgroundColor'} columnStyleCopy={columnStyleCopy} updateColumnStyleProperty={updateColumnStyleProperty} />
         </Stack>

         {/* foreground color */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={columnStyleCopy.colorChecked}
                        onChange={handleForegroundColorChecked}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90
                        }}
                     />}
                  label="Foreground" sx={{ textAlign: 'left', width: '100%' }} />
            </FormGroup>
            <ColorPickerComponent value={columnStyleCopy?.color ?? '#808080'} change={handleForegroundColorChange} />
            <OpacitySlider styleProperty={'colorOpacity'} styleColor={'color'} columnStyleCopy={columnStyleCopy} updateColumnStyleProperty={updateColumnStyleProperty} />
         </Stack>

         {/* border color */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={columnStyleCopy.borderColorChecked}
                        onChange={handleBorderColorChecked}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90,
                           mr: 4
                        }}
                     />}
                  label="Border" sx={{ textAlign: 'left', width: '100%' }} />
            </FormGroup>
            <ColorPickerComponent value={columnStyleCopy?.borderColor ?? '#808080'} change={handleBorderColorChange} />
            <OpacitySlider styleProperty={'borderColorOpacity'} styleColor={'borderColor'} columnStyleCopy={columnStyleCopy} updateColumnStyleProperty={updateColumnStyleProperty} />
         </Stack>

         {/* font size */}
         <Stack direction='row' alignItems="center" spacing={2} sx={{}}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={columnStyleCopy.fontSizeChecked}
                        onChange={handleFontSizeChecked}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90
                        }}
                     />}
                  label="Font Size" sx={{ textAlign: 'left', width: '100%' }} />
            </FormGroup>

            <Autocomplete
               disablePortal
               options={fontSizeOptions}
               value={columnStyleCopy?.fontSize}
               onChange={(event: React.SyntheticEvent, value) => {
                  updateColumnStyleProperty('fontSize', value as FontSize)
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

         {/* font style */}
         <Stack direction='row' alignItems="center" spacing={2} sx={{ mt: 2 }}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={columnStyleCopy.fontStyleChecked}
                        onChange={handleFontStyleChecked}
                        sx={{
                           color: theme.palette.text.primary, // Unchecked color
                           '&.Mui-checked': {
                              color: selectedAccentColor, // Checked color
                           },
                           width: 90
                        }}
                     />}
                  label="Font Style" sx={{ textAlign: 'left', width: '100%' }} />
            </FormGroup>

            <FormControl>
               <FormLabel id="demo-row-radio-buttons-group-label"></FormLabel>
               <RadioGroup
                  row
                  value={columnStyleCopy?.fontStyle}
                  onChange={handleFontStyleChange}
               >
                  <FormControlLabel
                     control={<Radio sx={{
                        color: theme.palette.text.primary,
                        '&.Mui-checked': {
                           color: selectedAccentColor
                        }
                     }} />}
                     label="Bold"
                     value="bold" />
                  <FormControlLabel
                     control={<Radio sx={{
                        color: theme.palette.text.primary,
                        '&.Mui-checked': {
                           color: selectedAccentColor
                        }
                     }} />}
                     label="Italic"
                     value="italic" />
               </RadioGroup>
            </FormControl>
         </Stack>
      </Stack>
   )
}

export { ColumnStyleTab }