/*
   this editor is designed for use with ReactHookForm and Zod
*/

import React, { useEffect, useRef, useState } from 'react';

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// MUI
import { alpha, Autocomplete, TextField, useTheme } from '@mui/material';


// types
import { SObjectPicklistValue } from '../../sObjectMetadataTypes';

import { decode } from 'he';

// RHF props from gridEditDialog
import { EditorProps } from './gridEditDialog';

export function MuiSelectEditor({ field, fieldProps, isReadOnly, onBlur }: EditorProps<string | null>) {
  const theme = useTheme();

  // Zustand global state
  const { selectedAccentColor } = useStore(useShallow((state) => ({
    selectedAccentColor: state.selectedAccentColor,
  })));

  // Local state
  const [autocompleteValue, setAutocompleteValue] = useState<SObjectPicklistValue | null>(null);
  const [options, setOptions] = useState<SObjectPicklistValue[]>([]);

  const disabledLabel = alpha(selectedAccentColor, 0.8);

  const domRef = useRef<HTMLDivElement>(null);

  // Handle value change
  const handleChange = (_event: React.SyntheticEvent, value: SObjectPicklistValue | null) => {
    try {
      const selectedValue = value ? value.value : null;
      // Prevent clearing non‑nillable picklists; keep current value
      if (!field.isNillable && selectedValue === null) {
        return;
      }
      setAutocompleteValue(value);
      fieldProps.onChange(selectedValue);
    } catch (e) {
      console.error('[MuiSelectEditor] handleChange error', e);
    }
  };

  // Load and decode options, set initial value
  useEffect(() => {
    try {
      const decodedOptions: SObjectPicklistValue[] = (field.picklistValues || [])
        .map((opt: any) => ({
          value: decode(String(opt?.value ?? '')),
          label: decode(String((opt?.label ?? opt?.label) ?? '')),
        }));

      setOptions(decodedOptions);

      // Normalize incoming value: treat empty string and 'null'/'NULL' as null
      const incoming = fieldProps.value;
      const normalized = (incoming === '' || incoming === 'null' || incoming === 'NULL') ? null : incoming;
      if (normalized) {
        const selectedOption = decodedOptions.find((opt) => opt.value === normalized);
        setAutocompleteValue(selectedOption ?? null);
      } else {
        setAutocompleteValue(null);
      }
    } catch (e) {
      console.error('[MuiSelectEditor] useEffect init error', e);
      setOptions([]);
      setAutocompleteValue(null);
    }
  }, [field.name, field.picklistValues, fieldProps.value]);

  return (
    <Autocomplete
      ref={domRef}
      disabled={isReadOnly}
      disableClearable={!field.isNillable}
      fullWidth
      getOptionLabel={(option: SObjectPicklistValue) => {
        try { return option && option.label ? String(option.label) : ''; } catch { return ''; }
      }}
      isOptionEqualToValue={(option: SObjectPicklistValue, value: SObjectPicklistValue | null) => !!value && option.value === value.value}
      onChange={handleChange}
      options={options}
      value={autocompleteValue ?? null}
      onBlur={onBlur}
      renderInput={(params) => (
        <TextField
          {...params}
          label={field.label || field.name}
          InputLabelProps={{ shrink: true }}
          sx={{
            color: theme.palette.text.primary,
            '& .MuiAutocomplete-popupIndicator': {
              color: '#333333', // Set to a darker shade for better visibility
            },
            '& .MuiInputBase-input': {
              color: theme.palette.text.primary,
            },
            '& .MuiFormLabel-root': {
              color: selectedAccentColor,
            },
            '& .MuiInputBase-input.Mui-disabled': {
              color: '#888888',
              WebkitTextFillColor: '#888888',
            },
            '& .MuiFormLabel-root.Mui-disabled': {
              color: disabledLabel,
            },
          }}
          error={!!fieldProps.error}
          helperText={fieldProps.error}
        />
      )}
    />
  );
}
