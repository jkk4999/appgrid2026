/*
   this editor is designed for use with ReactHookForm and Zod
*/

import React, { useMemo, useState, useEffect } from 'react';
import { alpha, TextField, useTheme } from '@mui/material';

import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// RHF props from gridEditDialog
import { EditorProps } from './gridEditDialog';

export default function MuiCurrencyEditor({ field, fieldProps, isReadOnly, onBlur }: EditorProps<number | null>) {
   const theme = useTheme();

   const { selectedAccentColor, userCurrency } = useStore(
      useShallow((state) => ({
         selectedAccentColor: state.selectedAccentColor || 'black',
         userCurrency: 'USD',
      }))
   );

   const locale = useMemo(() => navigator.language || 'en-US', []);

   const disabledLabel = alpha(selectedAccentColor, 0.8);

   const currencyFormatter = useMemo(
      () =>
         new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: userCurrency,
         }),
      [locale, userCurrency]
   );

   const [inputValue, setInputValue] = useState<string>(() => fieldProps.value?.toString() || '');
   const [formattedValue, setFormattedValue] = useState<string>(() => {
      const initialValue = fieldProps.value;
      return initialValue !== null && initialValue !== undefined && !isNaN(initialValue)
         ? currencyFormatter.format(initialValue)
         : '';
   });

   // Parse a formatted string back into a number, with validation
   const parseFormattedValue = (formatted: string): number | null => {
      if (formatted === '') return null;
      // Remove all non-numeric characters except for one decimal point and a possible minus sign
      const cleaned = formatted.replace(/[^0-9.-]/g, '').replace(/(\..*)\./g, '$1'); // Keep only one decimal point
      const parsed = Number(cleaned);
      return isNaN(parsed) ? null : parsed;
   };

   // Handle change event, update local state
   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const regex = /^[-\d]*\.?\d*$/; // Allow numbers, one decimal point, and optional minus sign
      if (rawValue === '' || regex.test(rawValue)) {
         setInputValue(rawValue); // Store raw input for validation
         setFormattedValue(rawValue); // Temporarily display raw input while typing
      }
   };

   // Handle blur event for formatting
   const handleBlur = () => {
      const newValue = parseFormattedValue(inputValue);
      fieldProps.onChange(newValue);
      if (newValue !== null && !isNaN(newValue)) {
         setFormattedValue(currencyFormatter.format(newValue));
      } else {
         setFormattedValue('');
      }
      onBlur(); // Call the provided onBlur
   };

   // Effect to sync with external value changes (e.g., form reset)
   useEffect(() => {
      if (fieldProps.value !== null && fieldProps.value !== undefined && !isNaN(fieldProps.value)) {
         setFormattedValue(currencyFormatter.format(fieldProps.value));
         setInputValue(fieldProps.value.toString());
      } else {
         setFormattedValue('');
         setInputValue('');
      }
   }, [fieldProps.value, currencyFormatter]);

   return (
      <TextField
         type="text"
         disabled={isReadOnly}
         value={formattedValue}
         onChange={handleChange}
         onBlur={handleBlur}
         label={field.label || field.name}
         InputLabelProps={{ shrink: true }}
         sx={{
            '& .MuiInputBase-input': {
               color: theme.palette.text.primary,
            },
            '& .MuiFormLabel-root': {
               color: selectedAccentColor,
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
         fullWidth
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
