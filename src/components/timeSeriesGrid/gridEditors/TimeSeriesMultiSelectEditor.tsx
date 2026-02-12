import React, { useEffect, useState, memo } from 'react';

// Zustand
import useStore from '../../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// MUI
import { Autocomplete, TextField } from '@mui/material';

import { useTheme } from '@mui/material';

// types
import { SObject, SObjectFieldMetadata, SObjectPicklistValue } from '../../../sObjectMetadataTypes';
import { Column, GridApi } from 'ag-grid-community';
import { APIClient } from '../../../brideDesignPattern/apiInterface';

interface TimeSeriesMultiSelectEditorProps {
  api: GridApi;
  apiClient: APIClient;
  column: Column;
  data: SObject;
  initialValue: boolean;
  onValueChange: (value: any) => void;
  rowData: SObject[];
  stopEditing: () => void;
  transformedRowData: Record<string, any>[];
  value: string | number | object;
}

const TimeSeriesMultiSelectEditor = memo(function TimeSeriesMultiSelectEditor({
  column,
  data,
  onValueChange,
  value,
}: TimeSeriesMultiSelectEditorProps) {
  const theme = useTheme();

  const { selectedObjMetadata } = useStore(
    useShallow((state) => ({
      selectedObjMetadata: state.selectedObjMetadata,
    }))
  );

  const [options, setOptions] = useState<SObjectPicklistValue[]>([]);
  const [selected, setSelected] = useState<SObjectPicklistValue[]>([]);

  // Load options and initialize selected values from semicolon string
  useEffect(() => {
    const meta = selectedObjMetadata?.fields?.find(
      (f: SObjectFieldMetadata) => f.name === (data as any)?.property
    );
    if (!meta) return;

    const opts = (meta.picklistValues || []) as SObjectPicklistValue[];
    setOptions(opts);

    // Determine current cell value from AG Grid or row
    const colId = (column as any)?.getColId?.() as string | undefined;
    let raw = (value as string) ?? (colId ? ((data as any)?.[colId] as string) : '');
    if (raw == null) raw = '';

    const tokens = String(raw)
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const initial = opts.filter((o) => tokens.includes(o.value) || tokens.includes(o.label));
    setSelected(initial);
  }, [column, data, selectedObjMetadata, value]);

  return (
    <Autocomplete
      multiple
      options={options}
      value={selected}
      disableCloseOnSelect
      getOptionLabel={(option: SObjectPicklistValue) => option?.label || ''}
      onChange={(_ev, newValue: SObjectPicklistValue[]) => {
        setSelected(newValue);
        const joined = newValue.map((o) => o.value).join(';');
        onValueChange(joined); // Salesforce-compatible semicolon string
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          sx={{
            color: theme.palette.text.primary,
            '& .MuiInputBase-input': { color: theme.palette.text.primary },
          }}
        />
      )}
      sx={{ '& .MuiAutocomplete-popupIndicator': { color: theme.palette.text.primary } }}
    />
  );
});

export { TimeSeriesMultiSelectEditor };
