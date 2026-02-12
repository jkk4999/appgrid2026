/*
   this editor is designed for use with ReactHookForm and Zod
*/

import React from 'react';

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// MUI
import { DatePicker } from '@mui/x-date-pickers';
import { alpha, TextField, useTheme } from '@mui/material';

// dayjs
import dayjs, { Dayjs } from 'dayjs';

// RHF props from gridEditDialog
import { EditorProps } from './gridEditDialog';

export default function MuiDateEditor({ field, fieldProps, isReadOnly }: EditorProps<Date | null>) {
   const theme = useTheme();

   // Zustand global state
   const { selectedAccentColor } = useStore(
      useShallow((state) => ({
         selectedAccentColor: state.selectedAccentColor,
      }))
   );

   const disabledLabel = alpha(selectedAccentColor, 0.8);

   const dayjsValue: Dayjs | null = fieldProps.value instanceof Date ? dayjs(fieldProps.value) : null;

   return (
      <DatePicker
         disabled={isReadOnly}
         enableAccessibleFieldDOMStructure={false}
         value={dayjsValue}
         onChange={(newValue: Dayjs | null) => {
            try {
               const dateValue = newValue ? newValue.toDate() : null;
               fieldProps.onChange(dateValue);
            } catch (e) {
               console.error('[MuiDateEditor] onChange error', e);
            }
         }}
         onAccept={() => fieldProps.onBlur()}
         slots={{
            textField: TextField,
         }}
         slotProps={{
            textField: {
               label: field.label || field.name,
               fullWidth: true,
               InputLabelProps: { shrink: true },
               error: !!fieldProps.error,
               helperText: fieldProps.error,
               sx: {
                  '& .MuiInputBase-input': {
                     color: theme.palette.text.primary,
                  },
                  '& .MuiInputBase-input.Mui-disabled': {
                     color: '#888888',
                     WebkitTextFillColor: '#888888',
                  },
                  '& .MuiFormLabel-root': {
                     color: selectedAccentColor,
                  },
                  '& .MuiFormLabel-root.Mui-disabled': {
                     color: disabledLabel,
                  },
                  '& .MuiSvgIcon-root': {
                     color: theme.palette.text.primary,
                  },
                  '& .MuiSvgIcon-root.Mui-disabled': {
                     color: `${theme.palette.text.primary}80`,
                  },
               },
            },
         }}
         sx={{
            '& .MuiIconButton-root': { color: theme.palette.text.primary },
            '& .MuiIconButton-root.Mui-disabled': { color: `${theme.palette.text.primary}80` },
            '& .MuiInput-underline:before': { borderBottomColor: theme.palette.text.primary },
            '& .MuiInput-underline:hover:before': { borderBottomColor: theme.palette.text.primary },
            '& .MuiInput-underline:after': { borderBottomColor: theme.palette.text.primary },
         }}
      />
   );
}
