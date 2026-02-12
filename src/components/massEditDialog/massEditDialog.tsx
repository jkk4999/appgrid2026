/**
 * MassEditDialog
 *
 * A dialog component for performing mass edit operations on AG Grid column values.
 * Inspects the selected column definition to determine the appropriate editor type
 * and allows users to enter a value to be applied to either selected cells or all cells.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

// MUI
import {
   alpha,
   Autocomplete,
   Box,
   Button,
   CircularProgress,
   Dialog,
   DialogActions,
   DialogContent,
   DialogTitle,
   FormControlLabel,
   Radio,
   RadioGroup,
   TextField,
   Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers';

// dayjs
import dayjs, { Dayjs } from 'dayjs';

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// AG Grid
import type { CellRange, Column, GridApi } from 'ag-grid-community';

// Types
import type { SObjectFieldMetadata, SObjectMetadata, SObjectPicklistValue } from '../../sObjectMetadataTypes';

// Utilities
import { prettyPrint } from '../../utilities/prettyPrint';
import { decode } from 'he';

// Notifications
import { useSnackbarAction } from '../../hooks/useSnackbarAction';

// API
import type { APIClient } from '../../brideDesignPattern/apiInterface';

/*==========================================
** TYPES & INTERFACES
==========================================*/
export interface MassEditDialogProps {
   open: boolean;
   onClose: () => void;
   gridApi: GridApi | null;
   column: Column | null;
   metadata: SObjectMetadata | null;
   apiClient: APIClient;
   objMetadataMap?: React.RefObject<Map<string, SObjectMetadata>>;
   addChangedRow: (rowId: string) => void;
}

interface AutocompleteOption {
   id: string | null;
   label: string;
}

type EditMode = 'selectedRange' | 'allRows';

/*==========================================
** HELPER FUNCTIONS
==========================================*/

// Get field metadata for a column
const getFieldMetadata = (
   column: Column | null,
   metadata: SObjectMetadata | null
): SObjectFieldMetadata | null => {
   if (!column || !metadata) return null;

   const colDef = column.getColDef();
   const fieldName = colDef.field;

   if (!fieldName) return null;

   return metadata.fields.find((f) => f.name === fieldName) || null;
};

// Determine editor type from field metadata
const getEditorType = (field: SObjectFieldMetadata | null): string => {
   if (!field) return 'text';

   switch (field.type) {
      case 'PICKLIST':
         return 'picklist';
      case 'MULTIPICKLIST':
         return 'multipicklist';
      case 'REFERENCE':
         return 'autocomplete';
      case 'DATE':
         return 'date';
      case 'DATETIME':
         return 'datetime';
      case 'BOOLEAN':
         return 'boolean';
      case 'CURRENCY':
      case 'DECIMAL':
      case 'DOUBLE':
      case 'INTEGER':
      case 'LONG':
      case 'NUMBER':
      case 'PERCENT':
         return 'number';
      case 'TEXTAREA':
      case 'ENCRYPTEDSTRING':
         return 'textarea';
      case 'EMAIL':
         return 'email';
      case 'PHONE':
         return 'phone';
      case 'URL':
         return 'url';
      default:
         return 'text';
   }
};

/*==========================================
** COMPONENT
==========================================*/
export const MassEditDialog: React.FC<MassEditDialogProps> = ({
   open,
   onClose,
   gridApi,
   column,
   metadata,
   apiClient,
   objMetadataMap,
   addChangedRow,
}) => {
   const theme = useTheme();
   const { enqueueSnackbar, action } = useSnackbarAction();

   // Zustand state
   const { selectedAccentColor } = useStore(
      useShallow((state) => ({
         selectedAccentColor: state.selectedAccentColor,
      }))
   );

   const disabledLabel = alpha(selectedAccentColor, 0.8);

   // Local state
   const [editMode, setEditMode] = useState<EditMode>('selectedRange');

   const [value, setValue] = useState<any>(null);

   const [loading, setLoading] = useState(false);

   const [autocompleteOptions, setAutocompleteOptions] = useState<AutocompleteOption[]>([]);

   const [autocompleteInputValue, setAutocompleteInputValue] = useState('');

   const [autocompleteLoading, setAutocompleteLoading] = useState(false);

   // Derived values
   const fieldMetadata = useMemo(
      () => getFieldMetadata(column, metadata),
      [column, metadata]
   );

   const editorType = useMemo(
      () => getEditorType(fieldMetadata),
      [fieldMetadata]
   );

   const columnLabel = useMemo(() => {
      if (!column) return '';

      const colDef = column.getColDef();

      return colDef.headerName || colDef.field || '';
   }, [column]);

   // Calculate affected row count
   const affectedRowCount = useMemo(() => {
      if (!gridApi) return 0;

      if (editMode === 'allRows') {
         let count = 0;

         gridApi.forEachNode(() => {
            count++;
         });

         return count;
      }

      // For selected range mode, get the cell ranges
      const cellRanges = gridApi.getCellRanges();

      if (!cellRanges || cellRanges.length === 0) return 0;

      const colId = column?.getColId();
      if (!colId) return 0;

      // Count unique rows in ranges that include our column
      const rowIndices = new Set<number>();

      cellRanges.forEach((range: CellRange) => {
         const rangeColIds = range.columns.map((c) => c.getColId());

         if (rangeColIds.includes(colId)) {
            const startRow = Math.min(range.startRow?.rowIndex ?? 0, range.endRow?.rowIndex ?? 0);

            const endRow = Math.max(range.startRow?.rowIndex ?? 0, range.endRow?.rowIndex ?? 0);

            for (let i = startRow; i <= endRow; i++) {
               rowIndices.add(i);
            }
         }
      });

      return rowIndices.size;
   }, [gridApi, editMode, column]);

   // Check if there's a valid cell selection
   const hasValidSelection = useMemo(() => {
      if (!gridApi || !column) return false;

      const cellRanges = gridApi.getCellRanges();

      if (!cellRanges || cellRanges.length === 0) return false;

      const colId = column.getColId();

      return cellRanges.some((range: CellRange) =>
         range.columns.some((c) => c.getColId() === colId)
      );
   }, [gridApi, column]);

   // Picklist options
   const picklistOptions = useMemo(() => {
      if (!fieldMetadata || !fieldMetadata.picklistValues) return [];

      return (fieldMetadata.picklistValues || []).map((opt: any) => ({
         value: decode(String(opt?.value ?? '')),
         label: decode(String(opt?.label ?? opt?.value ?? '')),
      }));
   }, [fieldMetadata]);

   // Reset state when dialog opens/closes
   useEffect(() => {
      if (open) {
         setValue(null);

         setEditMode(hasValidSelection ? 'selectedRange' : 'allRows');

         setAutocompleteOptions([]);

         setAutocompleteInputValue('');
      }
   }, [open, hasValidSelection]);

   // Fetch autocomplete options for reference fields
   const fetchAutocompleteOptions = useCallback(async (searchText: string) => {
      if (!fieldMetadata || !apiClient || !searchText || searchText.length < 2) {
         setAutocompleteOptions([]);
         return;
      }

      const referenceTo = fieldMetadata.referenceTo?.[0];

      if (!referenceTo) return;

      setAutocompleteLoading(true);

      try {
         // Get reference object metadata
         let refMetadata = objMetadataMap?.current?.get(referenceTo);

         if (!refMetadata) {
            refMetadata = await apiClient.getMetadata({ sObjectName: referenceTo });

            if (refMetadata && objMetadataMap?.current) {
               objMetadataMap.current.set(referenceTo, refMetadata);
            }
         }

         if (!refMetadata) {
            throw new Error(`Metadata not found for ${referenceTo}`);
         }

         const nameField = refMetadata.fields.find((f: any) => f.isNameField)?.name || 'Name';

         const queryRule = {
            condition: 'AND',
            rules: [
               { field: nameField, operator: 'startswith', type: 'string', value: searchText }
            ]
         };

         const result = await apiClient.executeDynamicSOQL({
            sObjectName: referenceTo,
            queryRule: JSON.stringify(queryRule),
            subQueryRule: null,
            subQueryRelation: null,
         });

         if (result.status === 'success' && result.records) {
            const options: AutocompleteOption[] = result.records.map((rec: any) => ({
               id: String(rec.Id),
               label: String(rec[nameField] || ''),
            }));

            setAutocompleteOptions(options);
         }
      } catch (error: any) {
         prettyPrint('[MassEditDialog] Error fetching autocomplete options', error.message, 'red');

         enqueueSnackbar(`Error fetching options: ${error.message}`, { action, variant: 'error' });
      } finally {
         setAutocompleteLoading(false);
      }
   }, [fieldMetadata, apiClient, objMetadataMap, enqueueSnackbar, action]);

   // Debounced autocomplete search
   useEffect(() => {
      if (editorType !== 'autocomplete') return;

      const timer = setTimeout(() => {
         if (autocompleteInputValue && autocompleteInputValue.length >= 2) {
            fetchAutocompleteOptions(autocompleteInputValue);
         }
      }, 300);

      return () => clearTimeout(timer);
   }, [autocompleteInputValue, editorType, fetchAutocompleteOptions]);

   // Apply mass edit
   const handleApply = useCallback(async () => {
      if (!gridApi || !column || value === null) {
         enqueueSnackbar('Please enter a value to apply', { action, variant: 'warning' });
         return;
      }

      setLoading(true);

      try {
         const colId = column.getColId();

         const fieldName = column.getColDef().field;

         if (!fieldName) {
            throw new Error('Column field name not found');
         }

         const rowsToUpdate: any[] = [];

         if (editMode === 'allRows') {
            // Update all rows
            gridApi.forEachNode((node) => {
               if (node.data) {
                  rowsToUpdate.push(node.data);
               }
            });
         } else {
            // Update only rows in selected ranges
            const cellRanges = gridApi.getCellRanges();
            if (!cellRanges) {
               throw new Error('No cell ranges selected');
            }

            const processedRowIds = new Set<string>();

            cellRanges.forEach((range: CellRange) => {
               const rangeColIds = range.columns.map((c) => c.getColId());

               if (!rangeColIds.includes(colId)) return;

               const startRow = Math.min(range.startRow?.rowIndex ?? 0, range.endRow?.rowIndex ?? 0);

               const endRow = Math.max(range.startRow?.rowIndex ?? 0, range.endRow?.rowIndex ?? 0);

               for (let i = startRow; i <= endRow; i++) {
                  const rowNode = gridApi.getDisplayedRowAtIndex(i);

                  if (rowNode?.data && !processedRowIds.has(rowNode.data.Id)) {
                     processedRowIds.add(rowNode.data.Id);

                     rowsToUpdate.push(rowNode.data);
                  }
               }
            });
         }

         if (rowsToUpdate.length === 0) {
            enqueueSnackbar('No rows to update', { action, variant: 'warning' });
            setLoading(false);
            return;
         }

         // Prepare the value to apply
         let valueToApply = value;

         // Handle special cases for different editor types
         if (editorType === 'autocomplete' && value) {
            valueToApply = value.id;
            // Also update the relationship object if present
            const relationshipName = fieldMetadata?.relationshipName;

            if (relationshipName) {
               rowsToUpdate.forEach((row) => {
                  row[relationshipName] = { Id: value.id, Name: value.label };
               });
            }
         } else if (editorType === 'date' || editorType === 'datetime') {
            prettyPrint('[MassEditDialog] Date raw value:', {
               value,
               isDayjs: dayjs.isDayjs(value),
               isDate: value instanceof Date,
               typeof: typeof value,
            }, 'cyan');

            let dateToApply: Date | null = null;

            if (value instanceof Date) {
               dateToApply = value;
            } else if (dayjs.isDayjs(value)) {
               dateToApply = value.toDate();
            } else if (typeof value === 'string') {
               const parsed = new Date(value);
               if (!isNaN(parsed.getTime())) {
                  dateToApply = parsed;
               }
            }

            if (!dateToApply || isNaN(dateToApply.getTime())) {
               throw new Error('Invalid date value');
            }

            valueToApply = dateToApply;

            prettyPrint('[MassEditDialog] Normalized Date:', dateToApply, 'green');
         } else if (editorType === 'boolean') {
            valueToApply = value === 'true' || value === true;
         } else if (editorType === 'picklist') {
            valueToApply = value?.value ?? value;
         }

         // Update the row data
         const updatedRows = rowsToUpdate.map((row) => ({
            ...row,
            [fieldName]: valueToApply,
         }));

         // Apply transaction to grid
         gridApi.applyTransaction({ update: updatedRows });

         // Mark rows as changed for save tracking
         updatedRows.forEach((row) => {
            if (row.Id && addChangedRow) {
               addChangedRow(row.Id);
            }
         });

         // Refresh cells to show updated values
         gridApi.refreshCells({ force: true });

         enqueueSnackbar(
            `Successfully updated ${updatedRows.length} row${updatedRows.length !== 1 ? 's' : ''}`,
            { action, variant: 'success', autoHideDuration: 3000 }
         );

         onClose();
      } catch (error: any) {
         prettyPrint('[MassEditDialog] Error applying mass edit', error.message, 'red');

         enqueueSnackbar(`Error applying mass edit: ${error.message}`, { action, variant: 'error' });
      } finally {
         setLoading(false);
      }
   }, [gridApi, column, value, editMode, fieldMetadata, editorType, addChangedRow, enqueueSnackbar, action, onClose]);

   // Render the appropriate editor based on field type
   const renderEditor = () => {
      const commonSx = {
         '& .MuiInputBase-input': {
            color: theme.palette.text.primary,
         },
         '& .MuiFormLabel-root': {
            color: selectedAccentColor,
         },
         '& .MuiInputBase-input.Mui-disabled': {
            color: '#888888',
            WebkitTextFillColor: '#888888',
         },
         '& .MuiFormLabel-root.Mui-disabled': {
            color: disabledLabel,
         },
      };

      switch (editorType) {
         case 'picklist':
            return (
               <Autocomplete
                  fullWidth
                  options={picklistOptions}
                  value={value}
                  onChange={(_, newValue) => setValue(newValue)}
                  getOptionLabel={(option: SObjectPicklistValue) => option?.label || ''}
                  isOptionEqualToValue={(option, val) => option?.value === val?.value}
                  renderInput={(params) => (
                     <TextField
                        {...params}
                        label={`New ${columnLabel} Value`}
                        sx={commonSx}
                     />
                  )}
               />
            );

         case 'boolean':
            return (
               <Autocomplete
                  fullWidth
                  options={[
                     { value: 'true', label: 'True' },
                     { value: 'false', label: 'False' },
                  ]}
                  value={value}
                  onChange={(_, newValue) => setValue(newValue?.value)}
                  getOptionLabel={(option) => option?.label || ''}
                  isOptionEqualToValue={(option, val) => option?.value === val}
                  renderInput={(params) => (
                     <TextField
                        {...params}
                        label={`New ${columnLabel} Value`}
                        InputLabelProps={{ shrink: true }}
                        sx={commonSx}
                     />
                  )}
               />
            );

         case 'date':
         case 'datetime': {
            // Convert to dayjs only if value is a Date, matching MuiDateEditor pattern
            const dayjsValue: Dayjs | null = value instanceof Date ? dayjs(value) : null;

            return (
               <DatePicker
                  enableAccessibleFieldDOMStructure={false}
                  value={dayjsValue}
                  onChange={(newValue: Dayjs | null) => {
                     try {
                        const dateValue = newValue ? newValue.toDate() : null;
                        setValue(dateValue);
                     } catch (e) {
                        console.error('[MassEditDialog] DatePicker onChange error', e);
                        setValue(null);
                     }
                  }}
                  slots={{
                     textField: TextField,
                  }}
                  slotProps={{
                     textField: {
                        fullWidth: true,
                        label: `New ${columnLabel} Value`,
                        InputLabelProps: { shrink: true },
                        sx: commonSx,
                     },
                  }}
               />
            );
         }

         case 'autocomplete':
            return (
               <Autocomplete
                  fullWidth
                  options={autocompleteOptions}
                  value={value}
                  inputValue={autocompleteInputValue}
                  onInputChange={(_, newInputValue) => setAutocompleteInputValue(newInputValue)}
                  onChange={(_, newValue) => setValue(newValue)}
                  getOptionLabel={(option: AutocompleteOption) => option?.label || ''}
                  isOptionEqualToValue={(option, val) => option?.id === val?.id}
                  loading={autocompleteLoading}
                  filterOptions={(x) => x}
                  renderInput={(params) => (
                     <TextField
                        {...params}
                        label={`New ${columnLabel} Value`}
                        InputLabelProps={{ shrink: true }}
                        placeholder="Type to search..."
                        sx={commonSx}
                        slotProps={{
                           input: {
                              ...params.InputProps,
                              endAdornment: (
                                 <>
                                    {autocompleteLoading ? <CircularProgress size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                 </>
                              ),
                           },
                        }}
                     />
                  )}
               />
            );

         case 'number':
            return (
               <TextField
                  fullWidth
                  type="number"
                  label={`New ${columnLabel} Value`}
                  value={value ?? ''}
                  onChange={(e) => {
                     const val = e.target.value;
                     setValue(val === '' ? null : Number(val));
                  }}
                  sx={commonSx}
               />
            );

         case 'textarea':
            return (
               <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={`New ${columnLabel} Value`}
                  value={value ?? ''}
                  onChange={(e) => setValue(e.target.value || null)}
                  sx={commonSx}
               />
            );

         default:
            return (
               <TextField
                  fullWidth
                  label={`New ${columnLabel} Value`}
                  value={value ?? ''}
                  onChange={(e) => setValue(e.target.value || null)}
                  sx={commonSx}
               />
            );
      }
   };

   return (
      <Dialog
         open={open}
         onClose={onClose}
         maxWidth="sm"
         fullWidth
         disableEnforceFocus
         disableRestoreFocus
         sx={{
            '& .MuiDialog-paper': {
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            },
            '& .MuiBackdrop-root': {
               backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
         }}
      >
         <DialogTitle
            sx={{
               backgroundColor: selectedAccentColor,
               color: '#ffffff',
               fontWeight: 'bold',
            }}
         >
            Mass Edit: {columnLabel}
         </DialogTitle>

         <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
               {/* Edit Mode Selection */}
               <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                     Apply To:
                  </Typography>
                  <RadioGroup
                     value={editMode}
                     onChange={(e) => setEditMode(e.target.value as EditMode)}
                  >
                     <FormControlLabel
                        value="selectedRange"
                        control={<Radio sx={{ color: selectedAccentColor, '&.Mui-checked': { color: selectedAccentColor } }} />}
                        label={`Selected cells only${hasValidSelection ? '' : ' (no selection)'}`}
                        disabled={!hasValidSelection}
                        sx={{ color: theme.palette.text.primary }}
                     />
                     <FormControlLabel
                        value="allRows"
                        control={<Radio sx={{ color: selectedAccentColor, '&.Mui-checked': { color: selectedAccentColor } }} />}
                        label="All rows in the grid"
                        sx={{ color: theme.palette.text.primary }}
                     />
                  </RadioGroup>
               </Box>

               {/* Editor */}
               <Box>{renderEditor()}</Box>

               {/* Confirmation Message */}
               <Box
                  sx={{
                     p: 2,
                     backgroundColor: alpha(selectedAccentColor, 0.1),
                     borderRadius: 1,
                     border: `1px solid ${alpha(selectedAccentColor, 0.3)}`,
                  }}
               >
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                     This action will update{' '}
                     <Typography component="span" fontWeight="bold" color={selectedAccentColor}>
                        {affectedRowCount}
                     </Typography>{' '}
                     row{affectedRowCount !== 1 ? 's' : ''}.
                  </Typography>
                  {fieldMetadata && !fieldMetadata.isUpdateable && (
                     <Typography variant="body2" sx={{ color: theme.palette.error.main, mt: 1 }}>
                        Warning: This field may not be updateable.
                     </Typography>
                  )}
               </Box>
            </Box>
         </DialogContent>

         <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
               onClick={onClose}
               variant="outlined"
               sx={{
                  borderColor: theme.palette.text.secondary,
                  color: theme.palette.text.primary,
                  '&:hover': {
                     borderColor: theme.palette.text.primary,
                  },
               }}
            >
               Cancel
            </Button>
            <Button
               onClick={handleApply}
               variant="contained"
               disabled={loading || value === null || affectedRowCount === 0}
               sx={{
                  backgroundColor: selectedAccentColor,
                  '&:hover': {
                     backgroundColor: alpha(selectedAccentColor, 0.8),
                  },
                  '&.Mui-disabled': {
                     backgroundColor: alpha(selectedAccentColor, 0.3),
                  },
               }}
            >
               {loading ? <CircularProgress size={24} color="inherit" /> : 'Apply'}
            </Button>
         </DialogActions>
      </Dialog>
   );
};

export default MassEditDialog;
