
import React, { memo } from 'react'

// Zustand
import useStore from '../../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// Mui
import { Checkbox } from '@mui/material';

import { useTheme } from '@mui/material';


// types
import { SObject } from '../../../sObjectMetadataTypes';

import { APIClient } from '../../../brideDesignPattern/apiInterface';

import { ColDef, Column, GridApi } from 'ag-grid-community';

interface MUIBooleanEditorProps {
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


const TimeSeriesBooleanEditor = memo(function TimeSeriesBooleanEditor(
  {
    onValueChange,
  }: MUIBooleanEditorProps) {

  const theme = useTheme();

  // global state
  const { selectedAccentColor } = useStore(
    useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor,
    }))
  );

  // LOCAL STATE
  const [checked, setChecked] = React.useState(true);

  // event handlers
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
    onValueChange(event.target.checked)
  };

  return (
    <Checkbox
      checked={checked}
      onChange={onChange}
      sx={{
        color: theme.palette.text.primary, // Unchecked color
        '&.Mui-checked': {
          color: selectedAccentColor, // Checked color
        },
      }}
    />
  )
})

export { TimeSeriesBooleanEditor };