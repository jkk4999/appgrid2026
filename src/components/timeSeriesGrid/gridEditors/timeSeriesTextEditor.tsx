
import React, { useEffect, useRef, useState, memo } from 'react'

// Mui
import { Autocomplete, TextField } from '@mui/material';

import { useTheme } from '@mui/material';

// types
import { SObject, SObjectFieldMetadata, SObjectPicklistValue } from '../../../sObjectMetadataTypes';

import { APIClient } from '../../../brideDesignPattern/apiInterface';

import { ColDef, Column, RowNode } from 'ag-grid-community';

interface MUISelectEditorProps {
  value: string | number | object;

  onValueChange: (value: any) => void;

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


const MuiSelectEditor = memo(function MUIAutocompleteEditor({ value, options, onValueChange, }: MUISelectEditorProps) {

  const theme = useTheme();

  // LOCAL STATE

  const [autocompleteVal, setAutocompleteVal] = useState<SObjectPicklistValue>()


  const domRef = useRef<HTMLInputElement>(null);

  // load option
  useEffect(() => {
    if (value) {
      const selectedOption = options.find((f: SObjectPicklistValue) => f.value === value);

      if (selectedOption) {
        setAutocompleteVal(selectedOption)
      }
    }
  }, [options, value])


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
      onChange={(
        _event: React.SyntheticEvent<Element, Event>,
        value: SObjectPicklistValue | null
      ) => {
        if (value === null) {
          return;
        }

        setAutocompleteVal(value);

        // notify grid of value change
        onValueChange(value!.value);
      }}
      options={options}
      value={autocompleteVal}
      renderInput={(params) => <TextField {...params} sx={{
        color: theme.palette.text.primary,
        '& .MuiInputBase-input': {
          color: theme.palette.text.primary,
        },
      }}
      />}
    />
  );
})

export { MuiSelectEditor };