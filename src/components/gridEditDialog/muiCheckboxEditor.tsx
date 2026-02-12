/*
   this editor is designed for use with ReactHookForm and Zod
*/

import React from 'react';

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// MUI
import { alpha, Checkbox, FormControlLabel, FormGroup, FormHelperText, useTheme } from '@mui/material';

// RHF props from gridEditDialog
import { EditorProps } from './gridEditDialog';

export default function MuiCheckboxEditor({ field, fieldProps, isReadOnly }: EditorProps<boolean | null>) {
   const theme = useTheme();

   // Zustand global state
   const { selectedAccentColor } = useStore(
      useShallow((state) => ({
         selectedAccentColor: state.selectedAccentColor || 'black',
      }))
   );

   const disabledLabel = alpha(selectedAccentColor, 0.8);

   return (
      <FormGroup>
         <FormControlLabel
            control={
               <Checkbox
                  disabled={isReadOnly}
                  checked={fieldProps.value ?? false} // Default null to false for display
                  onChange={(event, checked: boolean) => {
                     console.log(`MUI checkbox value is ${checked}`);
                     fieldProps.onChange(checked);
                     fieldProps.onBlur();
                  }}
                  sx={{
                     color: theme.palette.text.primary, // Unchecked color
                     '&.Mui-checked': {
                        color: selectedAccentColor, // Checked color
                     },
                     '&.Mui-disabled': {
                        color: disabledLabel, // Disabled color
                     },
                  }}
               />
            }
            label={field.label || field.name}
            sx={{
               '& .MuiFormControlLabel-label': {
                  color: selectedAccentColor,
               },
               '& .MuiFormControlLabel-label.Mui-disabled': {
                  color: disabledLabel,
               },
            }}
         />
         {fieldProps.error && (
            <FormHelperText sx={{ color: 'error.main', marginLeft: '36px' }}>{fieldProps.error}</FormHelperText>
         )}
      </FormGroup>
   );
}