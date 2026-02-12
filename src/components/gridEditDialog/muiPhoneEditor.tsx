/*
   this editor is designed for use with ReactHookForm and Zod
*/

import React from 'react';

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// MUI
import { alpha, TextField, useTheme } from '@mui/material';

// RHF props from gridEditDialog
import { EditorProps } from './gridEditDialog';

export default function MuiPhoneEditor({ field, fieldProps, isReadOnly, onBlur }: EditorProps<string | null>) {
   const theme = useTheme();

   // Zustand global state
   const { selectedAccentColor } = useStore(
      useShallow((state) => ({
         selectedAccentColor: state.selectedAccentColor,
      }))
   );

   const disabledLabel = alpha(selectedAccentColor, 0.8);

   return (
      <TextField
         type="tel"
         disabled={isReadOnly}
         value={fieldProps.value ?? ''} // Default to empty string if null/undefined
         onChange={(event) => {
            const value = event.target.value || null; // Convert empty string to null
            fieldProps.onChange(value);
         }}
         onBlur={onBlur}
         label={field.label || field.name}
         fullWidth
         InputLabelProps={{ shrink: true }}
         sx={{
            color: theme.palette.text.primary,
            '& .MuiInputBase-input': {
               color: theme.palette.text.primary, // Set input text color
            },
            '& .MuiFormLabel-root': {
               color: selectedAccentColor, // Set label color
               '&&': {
                  color: selectedAccentColor,
               },
            },
            '& .MuiInputBase-input.Mui-disabled': {
               color: '#888888', // Set input text color when disabled
               WebkitTextFillColor: '#888888', // Ensure compatibility with Webkit browsers
            },
            '& .MuiFormLabel-root.Mui-disabled': {
               color: disabledLabel, // Slightly faded label color when disabled
            },
         }}
         error={!!fieldProps.error}
         helperText={fieldProps.error}
      />
   );
}
