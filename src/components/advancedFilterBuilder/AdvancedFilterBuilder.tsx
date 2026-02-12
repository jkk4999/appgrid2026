/**
 * Advanced Filter Builder Component
 *
 * A Syncfusion QueryBuilder-based dialog that provides dropdown selectors for picklist fields
 * and converts the filter rules to AG Grid's AdvancedFilterModel format.
 *
 * Used by AppGrid and SubgridCore as an alternative to AG Grid's built-in Advanced Filter Builder.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// ReactHookForm
import { useForm } from 'react-hook-form';

// Html Encode/Decode
import { decode } from 'he';

// Syncfusion QueryBuilder
import {
  QueryBuilderComponent,
  ColumnsModel,
  RuleModel,
} from '@syncfusion/ej2-react-querybuilder';

// MUI
import {
  AppBar,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';

// MUI icons
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';

// Components
import QbAutocomplete from '../queryBuilder/QbAutocomplete';
import QbSelect from '../queryBuilder/QbSelect';
import { AdvancedFilterBuilderMenu, ADVANCED_FILTER_EVENTS } from './AdvancedFilterBuilderMenu';

// Notifications
import { useSnackbar } from 'notistack';

// PubSubJS
import PubSub from 'pubsub-js';

// Types
import type { GridApi, AdvancedFilterModel } from 'ag-grid-community';

import type { SObjectFieldMetadata, SObjectMetadata, SObjectPicklistValue } from '../../sObjectMetadataTypes';

import type { FilterOption } from '../../appInterfaces/grid/gridInterfaces';

import { SelectedFilterType } from '../../appInterfaces/grid/gridInterfaces';

// Utilities
import { sfdcDataTypes } from '../../gridDataTypes';

import { prettyPrint } from '../../utilities/prettyPrint';

import {
  syncfusionRuleToAdvancedFilterModel,
  advancedFilterModelToSyncfusionRule,
  createEmptyRuleModel,
} from '../../utilities/syncfusionToAgGridFilter';

// Confirmation dialog hook
import { useConfirmationDialog, confirmationPresets } from '../../hooks/useConfirmationDialog';

const brightBlueHeaderColor = '#1976d2';

// SaveAs form inputs type
type SaveAsInputs = {
  filterName: string;
};

interface AdvancedFilterBuilderProps {
  /** Whether this is for a subgrid */
  isSubgrid?: boolean;
  /** Grid API reference */
  gridApi: GridApi | null;
  /** Object metadata for building columns */
  selectedObjMetadata: SObjectMetadata | null;
  /** API client for lookup autocomplete */
  apiClient: any;
}

const AdvancedFilterBuilder: React.FC<AdvancedFilterBuilderProps> = ({
  isSubgrid = false,
  gridApi,
  selectedObjMetadata,
  apiClient,
}) => {
  // Refs
  const advancedFilterBuilderRef = useRef<QueryBuilderComponent>(null);

  // Notifications
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const snackbarAction = useCallback(
    (snackbarId: any) => (
      <button onClick={() => closeSnackbar(snackbarId)}>Dismiss</button>
    ),
    [closeSnackbar]
  );

  // Confirmation dialog
  const { showConfirmation } = useConfirmationDialog();

  // Form for SaveAs
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
    clearErrors,
  } = useForm<SaveAsInputs>();

  // Dialog visibility state from store
  const dialogState = useStore(
    useShallow((state) => {
      if (isSubgrid) {
        return {
          showDialog: state.showSubgridAdvancedFilterBuilder,
          setShowDialog: state.setShowSubgridAdvancedFilterBuilder,
        };
      }

      return {
        showDialog: state.showAdvancedFilterBuilder,
        setShowDialog: state.setShowAdvancedFilterBuilder,
      };
    })
  );


  // Filter state from store
  const filterState = useStore(
    useShallow((state) => {
      if (isSubgrid) {
        return {
          filterOptions: state.subgridFilterOptions,
          setFilterOptions: state.setSubgridFilterOptions,
          selectedFilter: state.selectedSubgridFilter,
          setSelectedFilter: state.setSelectedSubgridFilter,
        };
      }

      return {
        filterOptions: state.filterOptions,
        setFilterOptions: state.setFilterOptions,
        selectedFilter: state.selectedFilter,
        setSelectedFilter: state.setSelectedFilter,
      };
    })
  );

  const { showDialog, setShowDialog } = dialogState;

  const { filterOptions, setFilterOptions, selectedFilter, setSelectedFilter } = filterState;

  // Local state
  const [queryBuilderColumns, setQueryBuilderColumns] = useState<ColumnsModel[]>([]);

  const [currentRule, setCurrentRule] = useState<RuleModel>(createEmptyRuleModel());

  const [showSaveAs, setShowSaveAs] = useState(false);

  // Event topics based on context
  const events = useMemo(
    () =>
      isSubgrid
        ? {
          run: ADVANCED_FILTER_EVENTS.SUBGRID_RUN_FILTER,
          save: ADVANCED_FILTER_EVENTS.SUBGRID_SAVE_FILTER,
          saveAs: ADVANCED_FILTER_EVENTS.SUBGRID_SAVE_AS_FILTER,
          delete: ADVANCED_FILTER_EVENTS.SUBGRID_DELETE_FILTER,
          clear: ADVANCED_FILTER_EVENTS.SUBGRID_CLEAR_FILTER,
        }
        : {
          run: ADVANCED_FILTER_EVENTS.RUN_FILTER,
          save: ADVANCED_FILTER_EVENTS.SAVE_FILTER,
          saveAs: ADVANCED_FILTER_EVENTS.SAVE_AS_FILTER,
          delete: ADVANCED_FILTER_EVENTS.DELETE_FILTER,
          clear: ADVANCED_FILTER_EVENTS.CLEAR_FILTER,
        },
    [isSubgrid]
  );

  /**
   * Create a QueryBuilder column definition from Salesforce field metadata
   */
  const createQueryColumn = useCallback(
    (field: SObjectFieldMetadata): ColumnsModel | null => {
      const fieldName = decode(field.name);
      const fieldLabel = decode(field.label);

      switch (field.type) {
        case 'BOOLEAN':
          return {
            field: fieldName,
            label: fieldLabel,
            operators: [
              { key: 'Equal', value: 'equal' },
              { key: 'Not Equal', value: 'notequal' },
            ],
            type: 'boolean',
          };

        case 'COMBOBOX':
        case 'PICKLIST':
        case 'MULTIPICKLIST': {
          const options: { name: string; label: string }[] = [];
          field.picklistValues?.forEach((p: SObjectPicklistValue) => {
            const optionValue = p?.value ?? null;
            if (!optionValue) return;
            options.push({
              name: decode(optionValue),
              label: decode(p?.label ?? optionValue),
            });
          });

          return {
            field: fieldName,
            label: fieldLabel,
            operators: [
              { key: 'Equal', value: 'equal' },
              { key: 'Not Equal', value: 'notequal' },
              { key: 'In', value: 'in' },
              { key: 'Not In', value: 'notin' },
            ],
            template: function (props: any) {
              return <QbSelect {...props} qryBldrRef={advancedFilterBuilderRef} options={options} />;
            },
            type: 'string',
          };
        }

        case 'CURRENCY':
        case 'DECIMAL':
        case 'DOUBLE':
        case 'INTEGER':
        case 'LONG':
        case 'PERCENT':
          return {
            field: fieldName,
            label: fieldLabel,
            operators: [
              { key: 'Equal', value: 'equal' },
              { key: 'Not Equal', value: 'notequal' },
              { key: 'Greater Than', value: 'greaterthan' },
              { key: 'Greater Than Or Equal', value: 'greaterthanorequal' },
              { key: 'Less Than', value: 'lessthan' },
              { key: 'Less Than Or Equal', value: 'lessthanorequal' },
            ],
            type: 'number',
          };

        case 'DATE':
        case 'DATETIME':
          return {
            field: fieldName,
            label: fieldLabel,
            operators: [
              { key: 'Equal', value: 'equal' },
              { key: 'Not Equal', value: 'notequal' },
              { key: 'Greater Than', value: 'greaterthan' },
              { key: 'Greater Than Or Equal', value: 'greaterthanorequal' },
              { key: 'Less Than', value: 'lessthan' },
              { key: 'Less Than Or Equal', value: 'lessthanorequal' },
            ],
            type: 'date',
          };

        case 'REFERENCE':
          return {
            field: fieldName,
            label: fieldLabel,
            operators: [
              { key: 'Equal', value: 'equal' },
              { key: 'Not Equal', value: 'notequal' },
            ],
            template: (props: any) => (
              <QbAutocomplete
                {...props}
                fieldMetadata={field}
                qryBldrRef={advancedFilterBuilderRef}
                apiClient={apiClient}
                variant="main"
              />
            ),
            type: 'string',
          };

        case 'EMAIL':
        case 'ENCRYPTEDSTRING':
        case 'ID':
        case 'PHONE':
        case 'STRING':
        case 'URL':
          return {
            field: fieldName,
            label: fieldLabel,
            operators: [
              { key: 'Starts With', value: 'startswith' },
              { key: 'Ends With', value: 'endswith' },
              { key: 'Contains', value: 'contains' },
              { key: 'Equal', value: 'equal' },
              { key: 'Not Equal', value: 'notequal' },
            ],
            type: 'string',
          };

        default:
          return null;
      }
    },
    [apiClient]
  );

  /**
   * Build QueryBuilder columns from object metadata
   */
  useEffect(() => {
    if (!selectedObjMetadata) return;

    const cols: ColumnsModel[] = [];

    for (const field of selectedObjMetadata.fields) {
      if (!sfdcDataTypes.includes(field.type)) continue;

      const col = createQueryColumn(field);
      if (col) {
        cols.push(col);
      }
    }

    // Sort by label
    cols.sort((a, b) => (a.label! < b.label! ? -1 : a.label! > b.label! ? 1 : 0));

    setQueryBuilderColumns(cols);
  }, [selectedObjMetadata, createQueryColumn]);

  /**
   * Load selected filter into QueryBuilder when filter selection changes
   */
  useEffect(() => {
    if (!selectedFilter || !showDialog) return;

    // Only load AdvancedFilterModel type filters
    if (selectedFilter.type === SelectedFilterType.AdvancedFilterModel) {
      const agModel = selectedFilter.filterModel as AdvancedFilterModel;

      const syncfusionRule = advancedFilterModelToSyncfusionRule(agModel);

      if (syncfusionRule) {
        setCurrentRule(syncfusionRule);
      }
    }
  }, [selectedFilter, showDialog]);

  /**
   * Apply the current filter to the grid
   */
  const applyFilter = useCallback(() => {
    if (!gridApi) {
      enqueueSnackbar('Grid API not available', { variant: 'error', action: snackbarAction });
      return;
    }

    const rule = advancedFilterBuilderRef.current?.getRules();

    if (!rule) return;

    prettyPrint('[AdvancedFilterBuilder] Applying filter rule', rule, 'blue');

    // Convert to AG Grid format
    const agModel = syncfusionRuleToAdvancedFilterModel(rule);

    prettyPrint('[AdvancedFilterBuilder] Converted to AG Grid model', agModel, 'green');

    // Apply to grid
    gridApi.setAdvancedFilterModel(agModel);

    // Close dialog
    setShowDialog(false);
  }, [gridApi, setShowDialog, enqueueSnackbar, snackbarAction]);

  /**
   * Clear the filter
   */
  const clearFilter = useCallback(() => {
    if (!gridApi) return;

    // Clear the grid filter
    gridApi.setAdvancedFilterModel(null);

    // Reset QueryBuilder
    setCurrentRule(createEmptyRuleModel());

    // Clear selected filter
    setSelectedFilter(null);

    // Close dialog
    setShowDialog(false);
  }, [gridApi, setShowDialog, setSelectedFilter]);

  /**
   * Save the current filter (update existing)
   */
  const saveFilter = useCallback(() => {
    if (!selectedFilter) return;

    const rule = advancedFilterBuilderRef.current?.getRules();
    if (!rule) return;

    const agModel = syncfusionRuleToAdvancedFilterModel(rule);

    if (!agModel) return;

    const updatedOptions: FilterOption[] = filterOptions.map((opt) =>
      opt.name === selectedFilter.name
        ? {
          name: opt.name,
          type: SelectedFilterType.AdvancedFilterModel,
          filterModel: agModel, // must be AdvancedFilterModel
        }
        : opt
    );

    setFilterOptions(updatedOptions);

    enqueueSnackbar(`Filter "${selectedFilter.name}" saved`, { variant: 'success' });
  }, [selectedFilter, filterOptions, setFilterOptions, enqueueSnackbar]);

  /**
   * Save As - create a new filter
   */
  const onSaveAsSubmit = useCallback(
    (data: SaveAsInputs) => {
      const filterName = data.filterName.trim();

      if (!filterName) return;

      // Check for duplicate name
      if (filterOptions.some((opt: FilterOption) => opt.name === filterName)) {
        enqueueSnackbar(`Filter "${filterName}" already exists`, { variant: 'warning' });
        return;
      }

      const rule = advancedFilterBuilderRef.current?.getRules();

      if (!rule) return;

      const agModel = syncfusionRuleToAdvancedFilterModel(rule);

      if (!agModel) return;

      // Create new filter option
      const newFilter: FilterOption = {
        name: filterName,
        filterModel: agModel,
        type: SelectedFilterType.AdvancedFilterModel,
      };

      setFilterOptions([...filterOptions, newFilter]);

      setSelectedFilter(newFilter);

      setShowSaveAs(false);

      resetForm();

      enqueueSnackbar(`Filter "${filterName}" created`, { variant: 'success' });
    },
    [filterOptions, setFilterOptions, setSelectedFilter, resetForm, enqueueSnackbar]
  );

  /**
   * Delete the selected filter
   */
  const deleteFilter = useCallback(async () => {
    if (!selectedFilter) return;

    const confirmed = await showConfirmation(confirmationPresets.deleteFilter(selectedFilter.name));

    if (!confirmed) return;

    const updatedOptions = filterOptions.filter(
      (opt: FilterOption) => opt.name !== selectedFilter.name
    );

    setFilterOptions(updatedOptions);

    setSelectedFilter(null);

    setCurrentRule(createEmptyRuleModel());

    enqueueSnackbar(`Filter "${selectedFilter.name}" deleted`, { variant: 'success' });
  }, [selectedFilter, filterOptions, setFilterOptions, setSelectedFilter, showConfirmation, enqueueSnackbar]);

  /**
   * Subscribe to PubSub events
   */
  useEffect(() => {
    const tokens: string[] = [];

    tokens.push(PubSub.subscribe(events.run, applyFilter));

    tokens.push(PubSub.subscribe(events.save, saveFilter));

    tokens.push(PubSub.subscribe(events.saveAs, () => setShowSaveAs(true)));

    tokens.push(PubSub.subscribe(events.delete, deleteFilter));

    tokens.push(PubSub.subscribe(events.clear, clearFilter));

    return () => {
      tokens.forEach((token) => PubSub.unsubscribe(token));
    };
  }, [events, applyFilter, saveFilter, deleteFilter, clearFilter]);

  /**
   * Handle dialog close
   */
  const handleClose = useCallback(() => {
    setShowDialog(false);

    setShowSaveAs(false);

    clearErrors();
  }, [setShowDialog, clearErrors]);

  /**
   * Handle filter selection change
   */
  const handleFilterSelectionChange = useCallback(
    (_event: any, newValue: FilterOption | null) => {
      setSelectedFilter(newValue);

      if (newValue && newValue.type === SelectedFilterType.AdvancedFilterModel) {
        const agModel = newValue.filterModel as AdvancedFilterModel;

        const syncfusionRule = advancedFilterModelToSyncfusionRule(agModel);

        if (syncfusionRule) {
          setCurrentRule(syncfusionRule);
        }
      } else {
        setCurrentRule(createEmptyRuleModel());
      }
    },
    [setSelectedFilter]
  );

  // Only show AdvancedFilterModel type filters in the dropdown
  const advancedFilterOptions = useMemo(
    () => filterOptions.filter((opt: FilterOption) => opt.type === SelectedFilterType.AdvancedFilterModel),
    [filterOptions]
  );

  return (
    <Dialog
      data-name="AdvancedFilterBuilder"
      fullWidth
      maxWidth="lg"
      open={showDialog}
      onClose={handleClose}
    >
      <AppBar position="static" sx={{ backgroundColor: brightBlueHeaderColor }}>
        <Toolbar variant="dense">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Advanced Filter Builder
          </Typography>
          <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
            <CloseOutlinedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <DialogContent>
        <Stack spacing={2}>
          {/* Menu bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <AdvancedFilterBuilderMenu
              isSubgrid={isSubgrid}
              hasSelectedFilter={!!selectedFilter}
            />

            {/* Filter selector */}
            <Autocomplete
              size="small"
              sx={{ width: 250 }}
              options={advancedFilterOptions}
              getOptionLabel={(option: FilterOption) => option.name}
              value={selectedFilter}
              onChange={handleFilterSelectionChange}
              isOptionEqualToValue={(option, value) => option.name === value?.name}
              renderInput={(params) => (
                <TextField {...params} label="Saved Filters" placeholder="Select a filter..." />
              )}
            />
          </Box>

          {/* Save As input (shown when SaveAs is clicked) */}
          {showSaveAs && (
            <Box
              component="form"
              onSubmit={handleSubmit(onSaveAsSubmit)}
              sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}
            >
              <TextField
                size="small"
                label="Filter Name"
                {...register('filterName', { required: 'Filter name is required' })}
                error={!!errors.filterName}
                helperText={errors.filterName?.message}
                sx={{ width: 250 }}
              />
              <Button type="submit" variant="contained" size="small">
                Save
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setShowSaveAs(false);
                  resetForm();
                  clearErrors();
                }}
              >
                Cancel
              </Button>
            </Box>
          )}

          {/* QueryBuilder */}
          <Box sx={{ minHeight: 300 }}>
            {queryBuilderColumns.length > 0 && (
              <QueryBuilderComponent
                id="advancedFilterBuilder"
                ref={advancedFilterBuilderRef}
                columns={queryBuilderColumns}
                rule={currentRule}
                allowValidation={true}
              />
            )}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export { AdvancedFilterBuilder };
export default AdvancedFilterBuilder;
