import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow'

// Ag-Grid
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component

// MUI
import { Box, Tab } from '@mui/material';

import { TabContext, TabList } from '@mui/lab';

import { useTheme } from '@mui/material/styles';

import Radio from '@mui/material/Radio';

import RadioGroup from '@mui/material/RadioGroup';

import FormControlLabel from '@mui/material/FormControlLabel';

import FormControl from '@mui/material/FormControl';

import FormLabel from '@mui/material/FormLabel';

import { SObjectFieldMetadata, SObjectMetadata } from '../../sObjectMetadataTypes';

import { APIClient } from '../../brideDesignPattern/apiInterface';

// notifications

import {
   ColDef,
   SortDirection,
   themeQuartz,
   RowSelectionOptions,
   GridReadyEvent,
   GridApi,
} from "ag-grid-community";

interface ColumnRowData {
   name: string;
   label: string;
}

import { AgColumnStyle, TargetDataType } from '../../appInterfaces/grid/gridInterfaces'

interface ScopeTabProps {
   apiClient: APIClient;
   columnStyleCopy: AgColumnStyle;
   selectedObjMetadata: SObjectMetadata;
   selectedColumnStyle: AgColumnStyle | null;
   sObjectApiName: string;
   updateColumnStyleProperty: <K extends keyof AgColumnStyle>(
      key: K,
      value: AgColumnStyle[K]
   ) => void;
}


const ScopeTab = ({ columnStyleCopy, selectedColumnStyle, selectedObjMetadata, updateColumnStyleProperty }: ScopeTabProps) => {

   const theme = useTheme();

   // notifications


   // GLOBAL STATE
   const {
      selectedAccentColor,
      selectedGridColorTheme,
   } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor,
      selectedGridColorTheme: state.selectedGridColorTheme,
   })))

   // local state
   const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

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
         const colDefs: ColDef[] = [];
         const colDef: ColDef = {
            field: 'name',
            headerName: 'label',
            editable: false,
            enablePivot: false,
            enableRowGroup: false,
            enableValue: false,
            filter: true,
            width: 250,
            sort: 'asc' as SortDirection,
         }

         colDefs.push(colDef);

         const colDef2: ColDef = {
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

      if (!gridApi || !selectedColumnStyle) {
         return;
      }

      const selectedRows = selectedColumnStyle?.targetColumns

      if (selectedRows && selectedRows.length > 0) {
         gridApi!.forEachNode((node) => {
            if (selectedRows.includes(node.data.name)) {
               node.setSelected(true);
            }
         });
      }
   }, [gridApi, selectedColumnStyle])

   const getRowId = useCallback((params: any) => String(params.data.name), []);

   return (
      <Box sx={{
         width: '100%',
         height: '100%',
         flexGrow: 1,
         typography: 'body1',
         backgroundColor: theme.palette.background.paper,
         color: theme.palette.text.primary,
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
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
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
                  theme={themeQuartz.withPart(selectedGridColorTheme.value as Parameters<typeof themeQuartz.withPart>[0])}
               />
            </Box>
            {/* data type target column */}
            <Box
               display={selectedTab === "2" ? 'block' : 'none'}
               sx={{
                  width: 575,
                  height: 350,
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
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
