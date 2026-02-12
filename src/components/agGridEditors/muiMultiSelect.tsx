import React, { useMemo, useRef, memo } from 'react';

// MUI
import { Autocomplete, TextField } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

// AG Grid + types
import type { ColDef, Column, RowNode } from 'ag-grid-community';

import type { SObject, SObjectFieldMetadata, SObjectPicklistValue } from '../../sObjectMetadataTypes';

import type { APIClient } from '../../brideDesignPattern/apiInterface';

interface MUIMultiSelectEditorProps {
  value: string | number | object;
  onValueChange: (value: any) => void;
  stopEditing: () => void;
  apiClient: APIClient;
  fieldMetadata: SObjectFieldMetadata;
  colDef: ColDef;
  column: Column;
  data: SObject;
  node: RowNode;
  options: SObjectPicklistValue[];
}

const MuiMultiSelectEditor = memo(function MUIMultiSelectEditor({ value, options, onValueChange }: MUIMultiSelectEditorProps) {
  const theme = useTheme();

  // Normalize incoming value (semicolon-delimited) to selected options
  const initialSelected = useMemo(() => {
    const raw = value == null ? '' : String(value);
    const tokens = raw
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (!Array.isArray(options) || options.length === 0) return [] as SObjectPicklistValue[];
    return options.filter((opt) => tokens.includes(opt.value) || tokens.includes(opt.label));
  }, [value, options]);

  const [selected, setSelected] = React.useState<SObjectPicklistValue[]>(initialSelected);
  const domRef = useRef<HTMLDivElement>(null);

  return (
    <Autocomplete
      sx={{ '& .MuiAutocomplete-popupIndicator': { color: theme.palette.text.primary } }}
      ref={domRef}
      multiple
      fullWidth
      options={Array.isArray(options) ? options : []}
      value={selected}
      isOptionEqualToValue={(o, v) => !!v && o.value === v.value}
      getOptionLabel={(o) => (o ? o.label : '')}
      onChange={(_e, newVals) => {
        setSelected(newVals || []);
        const joined = (newVals || []).map((o) => o.value).join(';');
        onValueChange(joined);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          sx={{
            color: theme.palette.text.primary,
            '& .MuiInputBase-input': { color: theme.palette.text.primary },
          }}
          autoFocus
        />
      )}
    />
  );
});

export { MuiMultiSelectEditor };

