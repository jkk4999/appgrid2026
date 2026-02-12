import React, { memo } from 'react'

// Zustand
import useStore from '../../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// Mui
import { DatePicker } from '@mui/x-date-pickers';
import { DateField } from '@mui/x-date-pickers/DateField';

import { useTheme } from '@mui/material';


// dayjs
import dayjs, { Dayjs } from 'dayjs';

// types
import { SObject, } from '../../../sObjectMetadataTypes';

import { APIClient } from '../../../brideDesignPattern/apiInterface';

import { ColDef, Column, GridApi } from 'ag-grid-community';

interface MUIDateEditorProps {
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


const TimeSeriesDateEditor = memo(function TimeSeriesDateEditor(
   {
      onValueChange,
      value }: MUIDateEditorProps) {

   const theme = useTheme();

   // global state
   const { selectedAccentColor } = useStore(
      useShallow((state) => ({
         selectedAccentColor: state.selectedAccentColor,
      }))
   );

   return (
      <DatePicker
         value={value ? dayjs(value as Date) : null}
         onChange={(newValue: Dayjs | null) => {
            onValueChange(newValue ? newValue.startOf('day').toDate() : null);
         }}
         slots={{ field: DateField }}
         slotProps={{
            field: {
               fullWidth: true,
               sx: {
                  '& .MuiInputBase-input': { color: theme.palette.text.primary },
                  '& .MuiFormLabel-root': { color: selectedAccentColor },
                  '& .MuiSvgIcon-root': { color: theme.palette.text.primary },
               },
               format: 'YYYY-MM-DD',
            } as any,
         }}
         sx={{
            '& .MuiIconButton-root': { color: theme.palette.text.primary },
            '& .MuiAutocomplete-popupIndicator': { color: theme.palette.text.primary },
            '& .MuiInput-underline:before': { borderBottomColor: theme.palette.text.primary },
            '& .MuiInput-underline:hover:before': { borderBottomColor: theme.palette.text.primary },
            '& .MuiInput-underline:after': { borderBottomColor: theme.palette.text.primary },
            '& .MuiInputBase-input.Mui-disabled': { opacity: 1, WebkitTextFillColor: `rgba(var(--muiColor), 0.2)` },
         }}
      />
   )
})

export { TimeSeriesDateEditor };
