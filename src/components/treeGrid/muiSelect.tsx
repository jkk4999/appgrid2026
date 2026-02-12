
import React, { useRef, memo } from 'react'

// Mui
import { Autocomplete, TextField, useTheme } from '@mui/material';

// types
import { SObject, SObjectFieldMetadata, SObjectPicklistValue } from '../../sObjectMetadataTypes';

import { APIClient } from '../../brideDesignPattern/apiInterface';

import { ColDef, Column, RowNode } from 'ag-grid-community';

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

  // Theme state from domain hook

  // global state


  // LOCAL STATE

  // Initialize with the matching option or null
  const initialValue = React.useMemo(() => {
    if (!value) return null; // Empty string means no selection
    return options.find((opt) => opt.value === value) || null;
  }, [value, options]);

  const [autocompleteVal, setAutocompleteVal] = React.useState<SObjectPicklistValue | null>(initialValue);


  const domRef = useRef<HTMLInputElement>(null);

  // Handle change
  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: SObjectPicklistValue | null,
    reason: string
  ) => {
    setAutocompleteVal(newValue);
    onValueChange(newValue ? newValue.value : null); // Send string value or null to Ag-Grid
    if (reason === 'selectOption') {
      stopEditing(); // Close editor after selection
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
      getOptionLabel={(option: SObjectPicklistValue) => (option ? option.label : '')}
      onChange={handleChange}
      options={options}
      value={autocompleteVal}
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