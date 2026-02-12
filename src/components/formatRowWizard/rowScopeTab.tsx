import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Zustand
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore'

// Ag-Grid
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component

// MUI
import { Box, Tab } from '@mui/material';

import { TabContext, TabList } from '@mui/lab';

import Radio from '@mui/material/Radio';

import RadioGroup from '@mui/material/RadioGroup';

import FormControlLabel from '@mui/material/FormControlLabel';

import FormControl from '@mui/material/FormControl';

import FormLabel from '@mui/material/FormLabel';

import { SObjectFieldMetadata, SObjectMetadata } from '../../sObjectMetadataTypes';

import { APIClient } from '../../brideDesignPattern/apiInterface';

import { useTheme } from '@mui/material/styles';

import {
   colorSchemeDarkBlue,
   colorSchemeDark,
   colorSchemeLight,
   ColDef,
   themeQuartz,
   RowSelectionOptions,
   GridReadyEvent,
   GridApi,
} from "ag-grid-community";

type ThemeLabel = 'darkBlue' | 'darkWarm' | 'lightCold' | 'lightWarm' | 'dark' | 'light';

interface SelectedTheme {
   label: ThemeLabel;  // the label will be one of the ThemeLabel
   value: any;         // the value can be any type, adjust according to your use case
}

// Define the themeMapping object
type DarkBlueScheme = typeof colorSchemeDarkBlue;
type LightScheme = typeof colorSchemeLight;
type Theme = DarkBlueScheme | LightScheme;

const themeMapping: Record<string, Theme> = {
   darkBlue: colorSchemeDarkBlue,
   dark: colorSchemeDark,
   light: colorSchemeLight
};

interface ColumnRowData {
   name: string;
   label: string;
}

import { AgColumnStyle, TargetDataType } from '../../appInterfaces/grid/gridInterfaces'

interface ScopeTabProps {
   apiClient: APIClient,
   columnStyleCopy: AgColumnStyle,
   selectedObjMetadata: SObjectMetadata,
   updateColumnStyleProperty: <K extends keyof AgColumnStyle>(
      key: K,
      value: AgColumnStyle[K]
   ) => void;
}


const ScopeTab = ({ columnStyleCopy, selectedObjMetadata, updateColumnStyleProperty }: ScopeTabProps) => {
   const theme = useTheme();

   // global state
   const {
      selectedAccentColor,
      selectedStyle,
      selectedTheme
   } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor,
      selectedStyle: state.selectedColumnStyle,
      selectedTheme: state.selectedTheme as SelectedTheme
   })));

   // local state
   const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

   const currentTheme = themeMapping[selectedTheme.value] || colorSchemeLight;

   const [gridApi, setGridApi] = useState<null | GridApi>(null); // State to hold gridApi

   const [rowData, setRowData] = useState<ColumnRowData[]>([])

   const [selectedTab, setSelectedTab] = React.useState('1');

   // object ref
   const gridRef = useRef<AgGridReact<unknown>>(null);

   const defaultColDef = useMemo(() => {
      return {
         editable: false,
         filter: true,
         minWidth: 150,
         cellStyle: { color: theme.palette.text.primary, }
      };
   }, [theme.palette.text.primary]);

   const rowSelection = useMemo<
      RowSelectionOptions | "single" | "multiple"
   >(() => {
      return {
         mode: "multiRow",
         groupSelects: "self",
         // checkboxLocation: 'autoGroupColumn',
      };
   }, []);

   const handleChange = (event: React.SyntheticEvent, newValue: string) => {
      setSelectedTab(newValue);
   };

   const handleColumnDataTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateColumnStyleProperty('targetDataType', (event.target as HTMLInputElement).value as TargetDataType)
      updateColumnStyleProperty('targetColumns', [])
   };

   const onGridReady = useCallback((params: GridReadyEvent) => {
      setGridApi(params.api); // Set GridApi
   }, []);

   const onSelectionChanged = useCallback(() => {
      const selectedColumns = gridApi?.getSelectedRows().map((row: AgColumnStyle) => row.name)

      updateColumnStyleProperty('targetColumns', selectedColumns as string[])
   }, [gridApi, updateColumnStyleProperty]);

   // build grid columns
   useEffect(() => {
      const createGridColumns = () => {
         const colDefs = [];

         const colDef = {
            field: 'name',
            headerName: 'label',
            editable: false,
            enablePivot: false,
            enableRowGroup: false,
            enableValue: false,
            filter: true,
            width: 250
         }

         colDefs.push(colDef);

         const colDef2 = {
            field: 'type',
            headerName: 'Data Type',
            editable: false,
            enablePivot: false,
            enableRowGroup: false,
            enableValue: false,
            filter: true,
            width: 250
         }

         colDefs.push(colDef2);

         return colDefs;
      }

      const createRowData = () => {
         const objMetadataFields = selectedObjMetadata!.fields;

         const recs = objMetadataFields.map((f: SObjectFieldMetadata) => {
            return {
               name: f.name,
               label: f.label,
               type: f.type
            }
         })

         // Sort by label only
         recs.sort((a, b) => a.label.localeCompare(b.label));

         return recs;
      }

      const cDefs = createGridColumns();

      setColumnDefs(cDefs)

      const rData = createRowData();
      setRowData(rData);

   }, [selectedObjMetadata])

   // load selected rows
   useEffect(() => {

      if (!gridApi || !selectedStyle) {
         return;
      }

      const selectedRows = selectedStyle?.targetColumns

      if (selectedRows && selectedRows.length > 0) {
         gridApi!.forEachNode((node) => {
            if (selectedRows.includes(node.data.name)) {
               node.setSelected(true);
            }
         });
      }
   }, [gridApi, selectedStyle, selectedStyle?.targetColumns])

   const getRowId = useCallback((params: any) => String(params.data.name), []);

   return (
      <Box sx={{
         width: '100%',
         height: '100%',
         flexGrow: 1,
         typography: 'body1'
      }}>
         <TabContext value={selectedTab}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
               <TabList onChange={handleChange} aria-label="lab API tabs example">
                  <Tab
                     label="Selected Columns"
                     value="1"
                     sx={{
                        color: theme.palette.text.primary, // Default color for the tab text
                        '&.Mui-selected': {
                           color: selectedAccentColor, // Color for the selected tab text
                        },
                     }} />
                  <Tab
                     label="Data Types"
                     value="2"
                     sx={{
                        color: theme.palette.text.primary, // Default color for the tab text
                        '&.Mui-selected': {
                           color: selectedAccentColor, // Color for the selected tab text
                        },
                     }} />
               </TabList>
            </Box>
            {/* selected columns */}
            <Box
               display={selectedTab === "1" ? 'block' : 'none'}
               sx={{
                  width: 575,
                  height: 350,

               }}>
               <AgGridReact
                  ref={gridRef}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  getRowId={getRowId}
                  onGridReady={onGridReady}
                  onSelectionChanged={onSelectionChanged}
                  rowData={rowData}
                  rowSelection={rowSelection}
                  theme={themeQuartz.withPart(currentTheme)}
               />
            </Box>
            {/* data type target column */}
            <Box
               display={selectedTab === "2" ? 'block' : 'none'}
               sx={{
                  width: 575,
                  height: 350
               }}>
               <FormControl>
                  <FormLabel
                     sx={{ color: theme.palette.text.primary }}>
                     Data Type</FormLabel>
                  <RadioGroup
                     value={columnStyleCopy.targetDataType}
                     onChange={handleColumnDataTypeChange}
                  >
                     <FormControlLabel
                        control={
                           <Radio
                              color="default"
                              sx={{
                                 color: theme.palette.text.primary,
                                 '&.Mui-checked': {
                                    color: selectedAccentColor
                                 }
                              }}
                           />}
                        label="String"
                        value="string" />
                     <FormControlLabel
                        control={
                           <Radio
                              color="default"
                              sx={{
                                 color: theme.palette.text.primary,
                                 '&.Mui-checked': {
                                    color: selectedAccentColor
                                 }
                              }}
                           />}
                        label="Date"
                        value="date" />
                     <FormControlLabel
                        control={<Radio
                           color="default"
                           sx={{
                              color: theme.palette.text.primary,
                              '&.Mui-checked': {
                                 color: selectedAccentColor
                              }
                           }}
                        />}
                        label="Number"
                        value="number" />
                     <FormControlLabel
                        control={<Radio
                           color="default"
                           sx={{
                              color: theme.palette.text.primary,
                              '&.Mui-checked': {
                                 color: selectedAccentColor
                              }
                           }}
                        />}
                        label="Boolean"
                        value="boolean" />
                  </RadioGroup>
               </FormControl>
            </Box>
         </TabContext>
      </Box>
   );
}

export { ScopeTab }