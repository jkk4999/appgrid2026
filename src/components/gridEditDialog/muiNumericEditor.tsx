/*
   this editor is designed for use with ReactHookForm and Zod
*/

import React, { useMemo, useState, useEffect } from 'react';
import { alpha, TextField, useTheme } from '@mui/material';

import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// RHF props from gridEditDialog
import { EditorProps } from './gridEditDialog';

export default function MuiNumberEditor({ field, fieldProps, isReadOnly, onBlur }: EditorProps<number | null>) {
   const theme = useTheme();

   // Zustand global state
   const { selectedAccentColor } = useStore(
      useShallow((state) => ({
         selectedAccentColor: state.selectedAccentColor,
      }))
   );

   // Determine the locale from the browser
   const locale = useMemo(() => navigator.language || 'en-US', []);

   // Create a number formatter for the locale
   const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

   const disabledLabel = alpha(selectedAccentColor, 0.8);

   // State to hold the raw input value for validation
   const [rawInputValue, setRawInputValue] = useState(() => fieldProps.value?.toString() || '');
   const [formattedValue, setFormattedValue] = useState(() => {
      const initialValue = fieldProps.value;
      return initialValue !== null && initialValue !== undefined && !isNaN(initialValue)
         ? numberFormatter.format(initialValue)
         : '';
   });

   // Parse a formatted string back into a number, with validation
   const parseFormattedValue = (formatted: string): number | null => {
      if (formatted === '') return null; // Handle empty input

      // Remove all non-numeric characters except for one decimal point and a possible minus sign
      const cleaned = formatted.replace(/[^0-9.-]/g, '').replace(/(\..*)\./g, '$1'); // Keep only one decimal point
      const parsed = Number(cleaned);

      return isNaN(parsed) ? null : parsed;
   };

   // Handler for input change to restrict input
   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const regex = /^[-\d]*\.?\d*$/; // Allow numbers, one decimal point, and optional minus sign
      if (value === '' || regex.test(value)) {
         setRawInputValue(value);
         setFormattedValue(value); // Temporarily set formatted to raw while typing
      }
   };

   // Handle blur event for formatting
   const handleBlur = () => {
      const newValue = parseFormattedValue(rawInputValue);
      fieldProps.onChange(newValue);
      if (newValue !== null && !isNaN(newValue)) {
         setFormattedValue(numberFormatter.format(newValue));
      } else {
         setFormattedValue('');
      }
      onBlur(); // Call the provided onBlur
   };

   // Effect to sync with external value changes (e.g., form reset)
   useEffect(() => {
      if (fieldProps.value !== null && fieldProps.value !== undefined && !isNaN(fieldProps.value)) {
         setFormattedValue(numberFormatter.format(fieldProps.value));
         setRawInputValue(fieldProps.value.toString());
      } else {
         setFormattedValue('');
         setRawInputValue('');
      }
   }, [fieldProps.value, numberFormatter]);

   return (
      <TextField
         type="text"
         disabled={isReadOnly}
         value={formattedValue}
         onChange={handleInputChange}
         onBlur={handleBlur}
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
         slotProps={{
            input: {
               inputMode: 'decimal',
            },
         }}
      />
   );
}
