/*
  Multi-picklist editor for GridEditDialog (React Hook Form + Zod)
*/

import React, { useEffect, useRef, useState } from 'react';

import useStore from '../../zustandStore';

import { useShallow } from 'zustand/react/shallow';

import { Autocomplete, TextField, useTheme } from '@mui/material';

import { decode } from 'he';

import type { SObjectPicklistValue } from '../../sObjectMetadataTypes';

import type { EditorProps } from './gridEditDialog';

export function MuiMultiSelectEditor({ field, fieldProps, isReadOnly, onBlur }: EditorProps<string | null>) {
  const theme = useTheme();

  const { selectedAccentColor } = useStore(
    useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor,
    }))
  );

  const [options, setOptions] = useState<SObjectPicklistValue[]>([]);

  const [selected, setSelected] = useState<SObjectPicklistValue[]>([]);

  const domRef = useRef<HTMLDivElement>(null);

  // Decode options and initialize selection from semicolon string
  useEffect(() => {
    try {
      const decoded: SObjectPicklistValue[] = (field.picklistValues || []).map((opt: any) => ({
        value: decode(String(opt?.value ?? '')),
        label: decode(String((opt?.label ?? opt?.label) ?? '')),
      }));

      setOptions(decoded);

      const raw = fieldProps.value;

      const normalized = raw == null || raw === '' || raw === 'null' || raw === 'NULL' ? '' : String(raw);

      const tokens = normalized
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const initial = decoded.filter((o) => tokens.includes(o.value) || tokens.includes(o.label));

      setSelected(initial);
    } catch {
      setOptions([]);
      setSelected([]);
    }
  }, [field.name, field.picklistValues, fieldProps.value]);

  return (
    <Autocomplete
      ref={domRef}
      multiple
      disabled={isReadOnly}
      fullWidth
      options={options}
      value={selected}
      isOptionEqualToValue={(o, v) => !!v && o.value === v.value}
      getOptionLabel={(o) => (o ? String(o.label) : '')}
      onChange={(_e, newVals) => {
        const next = Array.isArray(newVals) ? newVals : [];
        setSelected(next);
        const out = next.map((o) => o.value).join(';');
        // For nillable fields, an empty selection serializes to '' (dialog submit omits it later)
        // For non‑nillable, allow empty and let server validate if needed
        fieldProps.onChange(out);
      }}
      onBlur={onBlur}
      renderInput={(params) => (
        <TextField
          {...params}
          label={field.label || field.name}
          InputLabelProps={{ shrink: true }}
          sx={{
            color: theme.palette.text.primary,
            '& .MuiInputBase-input': { color: theme.palette.text.primary },
            '& .MuiFormLabel-root': { color: selectedAccentColor },
            '& .MuiInputBase-input.Mui-disabled': { color: '#888888', WebkitTextFillColor: '#888888' },
            '& .MuiFormLabel-root.Mui-disabled': { color: selectedAccentColor },
          }}
          error={!!fieldProps.error}
          helperText={fieldProps.error}
        />
      )}
    />
  );
}

