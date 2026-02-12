/*
   this editor is designed for use with ReactHookForm and Zod
*/

import React from 'react';

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// MUI
import { alpha, TextField, useTheme } from '@mui/material';

import { EditorProps } from './gridEditDialog';

export const MuiTextEditor: React.FC<EditorProps<string | null>> = ({ field, fieldProps, isReadOnly, onBlur }) => {
   const theme = useTheme();

   // Zustand global state
   const { selectedAccentColor } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor,
   })));

   const disabledLabel = alpha(selectedAccentColor, 0.8);

   return (
      <TextField
         type="text"
         disabled={isReadOnly}
         value={fieldProps.value ?? ''}
         onChange={(event) => {
            console.log(`updating form value to ${event.target.value}`);
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
               color: theme.palette.text.primary, // Input text color
            },
            '& .MuiInputBase-input.Mui-disabled': {
               color: '#888888', // Disabled input text
               WebkitTextFillColor: '#888888',
            },
            '& .MuiFormLabel-root': {
               color: selectedAccentColor, // Enabled label color
               '&&': {
                  color: selectedAccentColor,
               },
            },
            '& .MuiFormLabel-root.Mui-disabled': {
               color: disabledLabel,
            },
         }}
         error={!!fieldProps.error}
         helperText={fieldProps.error}
      />
   );
};
