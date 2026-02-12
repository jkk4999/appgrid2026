
import React, { useEffect, useState, memo } from 'react'

// Zustand
import useStore from '../../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// Mui
import { Autocomplete, TextField } from '@mui/material';

import { useTheme } from '@mui/material';

// types
import { SObject, SObjectFieldMetadata, SObjectPicklistValue } from '../../../sObjectMetadataTypes';
import { APIClient } from '../../../brideDesignPattern/apiInterface';
import { ColDef, Column, GridApi } from 'ag-grid-community';

interface TimeSeriesSelectEditorProps {
  api: GridApi;
  apiClient: APIClient;
  changedRows: Set<string>;
  colDef: ColDef,
  column: Column,
  data: SObject,
  initialValue: boolean;
  onValueChange: (value: any) => void;
  rowData: SObject[];
  stopEditing: () => void;
  transformedRowData: Record<string, any>[];
  value: string | number | object;
}


const TimeSeriesSelectEditor = memo(function TimeSeriesSelectEditor(
  {
    colDef,
    column,
    data,
    onValueChange,
    rowData,
    transformedRowData,
    value }: TimeSeriesSelectEditorProps) {

  const theme = useTheme();

  console.log('TimeSeriesSelectEditor props are');
  console.dir({
    colDef: colDef,
    column: column,
    data: data,
    rowData: rowData,
    transformedRowData: transformedRowData
  })

  // global state
  const { selectedObjMetadata } = useStore(
    useShallow((state) => ({
      selectedObjMetadata: state.selectedObjMetadata,
    }))
  );

  // local state
  const [autocompleteVal, setAutocompleteVal] = useState<SObjectPicklistValue>()

  const [options, setOptions] = useState<SObjectPicklistValue[]>([])

  // load options + initialize selected value robustly (handles tabbing focus)
  useEffect(() => {
    const objMetadataField = selectedObjMetadata?.fields.find((f: SObjectFieldMetadata) => f.name === data.property);

    if (!objMetadataField) return;

    setOptions(objMetadataField.picklistValues as SObjectPicklistValue[]);

    // Determine current cell value: prefer AG Grid provided value, else read from row
    const colId = column?.getColId?.() as string;

    const currentVal = (value as any) ?? (colId ? (data as any)?.[colId] : undefined);

    if (currentVal == null || currentVal === '') {
      setAutocompleteVal(undefined);
      return;
    }

    // Try match by value, then by label (some orgs keep them identical)
    const selectedOption =
      objMetadataField.picklistValues.find((f: SObjectPicklistValue) => f.value === currentVal) ||
      objMetadataField.picklistValues.find((f: SObjectPicklistValue) => f.label === currentVal);

    if (selectedOption) setAutocompleteVal(selectedOption);
  }, [column, data, selectedObjMetadata, value])


  return (
    <Autocomplete
      sx={{
        '& .MuiAutocomplete-popupIndicator': {
          color: theme.palette.text.primary, // Set the dropdown arrow color
        },
      }}
      fullWidth
      isOptionEqualToValue={(option, val) => option?.value === val?.value}
      getOptionLabel={(option: SObjectPicklistValue) => (option ? option.label : '')}
      onChange={(
        _event,
        value: SObjectPicklistValue | null,
      ) => {
        if (value === null) {
          return;
        }

        setAutocompleteVal(value);

        // notify grid of value change
        onValueChange(value.value);
      }}
      options={options}
      value={autocompleteVal}
      renderInput={(params) => <TextField {...params} sx={{
        color: theme.palette.text.primary,
        '& .MuiInputBase-input': {
          color: theme.palette.text.primary, // Ensure input text uses muiColor
        },
      }}
      />}
    />
  );
})

export { TimeSeriesSelectEditor };
