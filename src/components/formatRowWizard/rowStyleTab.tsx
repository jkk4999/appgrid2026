import React from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';
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

import { AgRowStyle, FontSize, FontStyle } from '../../appInterfaces/grid/gridInterfaces'

const fontSizeOptions = ['Default', 'XSmall', 'Small', 'Medium', 'Large', 'XLarge']

interface RowStyleTabProps {
   rowStyleCopy: AgRowStyle,
   updateRowStyleProperty: <K extends keyof AgRowStyle>(
      key: K,
      value: AgRowStyle[K]
   ) => void;
}

const RowStyleTab = ({ rowStyleCopy, updateRowStyleProperty }: RowStyleTabProps) => {
   const theme = useTheme();

   // global state
   const {
      selectedAccentColor
   } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor
   })));

   // local state

   const handleFontSizeChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateRowStyleProperty('fontSizeChecked', event.target.checked)
   };

   const handleFontStyleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateRowStyleProperty('fontStyleChecked', event.target.checked)
   };

   const handleBackgroundColorChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateRowStyleProperty('backgroundColorChecked', event.target.checked)
   };

   const handleBackgroundColorChange = (args: ColorPickerEventArgs) => {
      updateRowStyleProperty('backgroundColor', args.currentValue.hex)
   };

   const handleBorderColorChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateRowStyleProperty('borderColorChecked', event.target.checked)
   };

   const handleBorderColorChange = (args: ColorPickerEventArgs) => {
      updateRowStyleProperty('borderColor', args.currentValue.hex)
   };

   const handleFontStyleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
      updateRowStyleProperty('fontStyle', value as FontStyle)
   };

   const handleForegroundColorChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateRowStyleProperty('colorChecked', event.target.checked)
   };

   const handleForegroundColorChange = (args: ColorPickerEventArgs) => {
      updateRowStyleProperty('color', args.currentValue.hex)
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
                        checked={rowStyleCopy.backgroundColorChecked}
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
            <ColorPickerComponent value={rowStyleCopy.backgroundColor ?? '#808080'} change={handleBackgroundColorChange} />
            <OpacitySlider styleProperty={'backgroundColorOpacity'} styleColor={'backgroundColor'} rowStyleCopy={rowStyleCopy} updateRowStyleProperty={updateRowStyleProperty} />
         </Stack>

         {/* foreground color */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={rowStyleCopy.colorChecked}
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
            <ColorPickerComponent value={rowStyleCopy?.color ?? '#808080'} change={handleForegroundColorChange} />
            <OpacitySlider styleProperty={'colorOpacity'} styleColor={'color'} rowStyleCopy={rowStyleCopy} updateRowStyleProperty={updateRowStyleProperty} />
         </Stack>

         {/* border color */}
         <Stack direction='row' alignItems="center" spacing={2}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={rowStyleCopy.borderColorChecked}
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
            <ColorPickerComponent value={rowStyleCopy?.borderColor ?? '#808080'} change={handleBorderColorChange} />
            <OpacitySlider styleProperty={'borderColorOpacity'} styleColor={'borderColor'} rowStyleCopy={rowStyleCopy} updateRowStyleProperty={updateRowStyleProperty} />
         </Stack>

         {/* font size */}
         <Stack direction='row' alignItems="center" spacing={2} sx={{}}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={rowStyleCopy.fontSizeChecked}
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
               value={rowStyleCopy?.fontSize}
               onChange={(event: React.SyntheticEvent, value) => {
                  updateRowStyleProperty('fontSize', value as FontSize)
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

         {/* font style */}
         <Stack direction='row' alignItems="center" spacing={2} sx={{ mt: 2 }}>
            <FormGroup>
               <FormControlLabel
                  control={
                     <Checkbox
                        checked={rowStyleCopy.fontStyleChecked}
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
                  value={rowStyleCopy?.fontStyle}
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

export { RowStyleTab }