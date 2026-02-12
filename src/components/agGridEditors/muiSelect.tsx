import React, { useRef, memo, useMemo } from 'react'

// Mui
import { Autocomplete, TextField } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

// types
import { SObject, SObjectFieldMetadata, SObjectPicklistValue } from '../../sObjectMetadataTypes';

import { ColDef, Column, RowNode } from 'ag-grid-community';

import { APIClient } from '../../brideDesignPattern/apiInterface';

interface MUISelectEditorProps {
  value: string | number | object; // Adjust according to what your value can be
  onValueChange: (value: any) => void; // Specify the type of value expected
  eventKey?: string; // Optional prop
  stopEditing: () => void;
  apiClient: APIClient;
  fieldMetadata: SObjectFieldMetadata
  colDef: ColDef,
  column: Column,
  data: SObject,
  node: RowNode,
  options: SObjectPicklistValue[]
}


const MuiSelectEditor = memo(function MUIAutocompleteEditor({ value, options, onValueChange, stopEditing }: MUISelectEditorProps) {
  const theme = useTheme();

  // LOCAL STATE

  // Initialize with the matching option or null
  const initialValue = useMemo(() => {
    // Normalize incoming value: treat '', 'null', 'NULL' as null
    const incoming = (value === '' || value === 'null' || value === 'NULL') ? null : value;
    if (!incoming) return null;
    return options.find((opt) => opt.value === incoming) || null;
  }, [value, options]);

  const [autocompleteVal, setAutocompleteVal] = React.useState<SObjectPicklistValue | null>(initialValue);

  const domRef = useRef<HTMLDivElement>(null);

  // Handle change
  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: SObjectPicklistValue | null,
    reason: string
  ) => {
    try {
      setAutocompleteVal(newValue);
      onValueChange(newValue ? newValue.value : null);
      if (reason === 'selectOption') {
        stopEditing();
      }
    } catch (e) {
      console.error('[MuiSelectEditor-agGrid] handleChange error', e);
    }
  };

  return (
    <Autocomplete
      sx={{
        '& .MuiAutocomplete-popupIndicator': {
          color: theme.palette.text.primary, // Set the dropdown arrow color
        },
      }}
      ref={domRef}
      fullWidth
      getOptionLabel={(option: SObjectPicklistValue) => {
        try { return option && typeof option.label === 'string' ? option.label : ''; } catch { return ''; }
      }}
      isOptionEqualToValue={(option: SObjectPicklistValue, val: SObjectPicklistValue | null) => !!val && option.value === val.value}
      onChange={handleChange}
      options={Array.isArray(options) ? options : []}
      value={autocompleteVal ?? null}
      renderInput={(params) => <TextField {...params} sx={{
        color: theme.palette.text.primary,
        '& .MuiInputBase-input': {
          color: theme.palette.text.primary, // Ensure input text uses muiColor
        },
      }}
        autoFocus
      />}
    />
  );
})

export { MuiSelectEditor };
