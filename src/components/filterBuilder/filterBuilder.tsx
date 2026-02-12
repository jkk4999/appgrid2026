import React, { useState, useEffect, useRef, useCallback } from 'react';

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow'

// Domain-specific selector hooks
import { useThemeState } from '../../hooks/selectors';

// ReactHookForm
import { useForm } from 'react-hook-form'
import { DevTool } from '@hookform/devtools'

// Html Encode/Decode
import { decode } from 'he'

// Syncfusion QueryBuilder
import {
   QueryBuilderComponent,
   ColumnsModel
} from '@syncfusion/ej2-react-querybuilder';

// MUI
import {
   AppBar,
   Box,
   Button,
   Dialog,
   DialogContent,
   FormControl,
   FormControlLabel,
   FormLabel,
   IconButton,
   Portal,
   Radio,
   RadioGroup,
   Stack,
   TextField,
   Toolbar,
   Typography,
} from '@mui/material'


// MUI icons
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';

// components
import QbAutocomplete from '../queryBuilder/QbAutocomplete';
import QueryDeleteDialog from '../queryBuilder/queryDeleteDialog';
import QbSelect from '../queryBuilder/QbSelect';
import { FilterBuilderMenu } from './FilterBuilderMenu';


// notifications
import { useSnackbar } from 'notistack'


// PubSubJS
import PubSub from "pubsub-js";


import { SObjectQuery, SObjectFieldMetadata, SObjectMetadata, SObjectPermission, SObjectPicklistValue } from '../../sObjectMetadataTypes';

import { TimeSeriesFilterOption } from '../../appInterfaces/grid/gridInterfaces';

import { sfdcDataTypes } from '../../gridDataTypes';

// saveAs type declaration
type RuleInputs = {
   ruleName: string
}

const brightBlueHeaderColor = '#1976d2';

const FilterBuilder = (props: any) => {
   const { apiClient, rowData } = props

   // console.log('FilterBuilder rendering');

   // OBJECT REFS
   const filterBldrRef = useRef<QueryBuilderComponent>(null);

   // NOTIFICATIONS
   const { enqueueSnackbar, closeSnackbar } = useSnackbar()

   const action = useCallback(
      (snackbarId: any) => (
         <>
            <button
               onClick={() => {
                  closeSnackbar(snackbarId)
               }}
            >
               Dismiss
            </button>
         </>
      ),
      [closeSnackbar],
   )

   // Theme state - using unified hook
   const { muiColor, muiBackgroundColor, selectedAccentColor } = useThemeState();

   // GLOBAL STATE - time-series-specific state (not grid-context state)
   const {
      addTimeSeriesFilterOption,
      currentTimeSeriesFilterRule,
      objectPermissions,
      updateTimeSeriesFilterOption,
      selectedTimeSeriesFilter,
      selectedObject,
      selectedObjMetadata,
      selectedQuery,
      setCurrentTimeSeriesFilterRule,
      setQueryRuleModified,
      setRunQuery,
      setSelectedTimeSeriesFilter,
      setShowQueryDeleteDialog,
      showFilterBuilder,
      showQueryDeleteDialog,
      setShowFilterBuilder,
      timeSeriesFilterOptions
   } = useStore(useShallow((state) => ({
      addTimeSeriesFilterOption: state.addTimeSeriesFilterOption,
      currentTimeSeriesFilterRule: state.currentTimeSeriesFilterRule,
      objectPermissions: state.objectPermissions,
      updateTimeSeriesFilterOption: state.updateTimeSeriesFilterOption,
      selectedTimeSeriesFilter: state.selectedTimeSeriesFilter,
      selectedObject: state.selectedObject,
      selectedObjMetadata: state.selectedObjMetadata,
      selectedQuery: state.selectedQuery as SObjectQuery | null,
      setCurrentTimeSeriesFilterRule: state.setCurrentTimeSeriesFilterRule,
      setQueryRuleModified: state.setQueryRuleModified,
      setRunQuery: state.setRunQuery,
      setSelectedTimeSeriesFilter: state.setSelectedTimeSeriesFilter,
      setShowQueryDeleteDialog: state.setShowQueryDeleteDialog,
      showFilterBuilder: state.showFilterBuilder,
      showQueryDeleteDialog: state.showQueryDeleteDialog,
      setShowFilterBuilder: state.setShowFilterBuilder,
      timeSeriesFilterOptions: state.timeSeriesFilterOptions
   })));


   // LOCAL STATE
   const [filterBuilderColumns, setFilterBuilderColumns] = useState<ColumnsModel[]>([]);
   const [queryDisplayType, setQueryDisplayType] = useState<string>('json')
   const [queryRuleText] = useState<string>('')
   const [showQueryText] = useState<boolean>(false)
   const [showSaveAs, setShowSaveAs] = useState(false)
   const [showErrors] = useState(false)

   // FUNCTIONS

   // react hook form
   const form = useForm<RuleInputs>()

   const { register, handleSubmit, formState, control, clearErrors } = form
   const { errors } = formState
   const [ruleErrorMessage] = useState('')

   const convertNotToIsNot = useCallback(function (filterRule: any) {
      // Check if the current object is an array or an object
      if (Array.isArray(filterRule)) {
         // If it's an array, iterate through each element and apply the function recursively
         filterRule.forEach(convertNotToIsNot);
      } else if (typeof filterRule === 'object' && filterRule !== null) {
         // If it's an object, check if it has a 'not' property using Object.prototype.hasOwnProperty.call()
         if (Object.prototype.hasOwnProperty.call(filterRule, 'not')) {
            // Assign the value of 'not' to 'isNot' and delete the 'not' property
            filterRule.isNot = filterRule.not;
            delete filterRule.not;
         }

         // Iterate over the object's properties to apply the function recursively
         for (const key in filterRule) {
            if (Object.prototype.hasOwnProperty.call(filterRule, key)) {
               convertNotToIsNot(filterRule[key]);
            }
         }
      }

      return filterRule; // Return the modified queryRule object
   }, []);


   const onFilterRuleChange = (args: any) => {
      console.log('onQueryRuleChange - args are:')
      console.dir(args);
      if (filterBldrRef.current) {
         if (args.type === 'deleteRule') {
            console.log('A rule was deleted');
         }
         const currentRule = filterBldrRef.current.getRules();
         console.log('Current rules:', currentRule);
         // setCurrentTimeSeriesFilterRule(currentRule)
      }
   }


   const handleFilterDialogCancel = () => {
      setShowFilterBuilder(false)
      setShowSaveAs(false)
      clearErrors()
   }

   const handleFilterDialogClose = () => {
      setShowFilterBuilder(false)
   }

   const onFilterRuleSaveAsSubmit = (data: RuleInputs) => {
      console.log(`ruleName is ${data.ruleName}`)

      const currentRule = filterBldrRef.current!.getRules();
      console.log('onFilterRuleSaveAsSubmit - currentRule is');
      console.dir(currentRule);
      setCurrentTimeSeriesFilterRule(currentRule)

      // create a new filter option
      const newFilterOption: TimeSeriesFilterOption = {
         name: data.ruleName,
         filterRule: currentRule
      }

      addTimeSeriesFilterOption(newFilterOption);

      // send event to timeSeriesGrid for execution
      PubSub.publish('SaveAsTimeSeriesFilter', data.ruleName)

      setShowFilterBuilder(false);
   }

   // create QueryBuilder columns when selectedObjMetadata changes
   useEffect(() => {
      function createQueryColumn(field: SObjectFieldMetadata) {
         const fieldName = decode(field.name);
         const fieldLabel = decode(field.label);

         switch (field.type) {
            case 'BOOLEAN': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                  ],
                  // template: QbMuiCheckbox,
                  // template: { muiCheckboxTemplate },
                  type: 'boolean',
                  enableNotCondition: 'true',
               }
            }
            case 'COMBOBOX': {
               const options: { name: string; label: string }[] = []
               field.picklistValues.forEach((p: SObjectPicklistValue) => {
                  const optionValue = p?.value ?? null;
                  if (!optionValue) {
                     return;
                  }
                  options.push({
                     name: decode(optionValue),
                     label: decode(p?.label ?? optionValue),
                  })
               })
               return {
                  field: fieldName,
                  label: fieldLabel,
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                     { key: 'In', value: 'in' },
                     { key: 'Not In', value: 'notin' }
                  ],
                  template: function (props: any) {
                     return (
                        <QbSelect
                           {...props}
                           qryBldrRef={filterBldrRef}
                           options={options} />
                     )
                  },
                  type: 'string',
               }
            }
            case 'CURRENCY': {
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
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                  ],
                  type: 'number',
               }
            }
            case 'DATE': {
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
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                  ],
                  type: 'date',
               }
            }
            case 'DATETIME': {
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
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                  ],
                  type: 'date',
               }
            }
            case 'DECIMAL': {
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
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                  ],
                  type: 'number',
               }
            }
            case 'DOUBLE': {
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
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                  ],
                  type: 'number',
               }
            }
            case 'EMAIL': {
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
               }
            }
            case 'ENCRYPTEDSTRING': {
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
               }
            }
            case 'ID': {
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
               }
            }
            case 'INTEGER': {
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
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                  ],
                  type: 'number',
               }
            }
            case 'LONG': {
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
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                  ],
                  type: 'number',
               }
            }
            case 'MULTIPICKLIST': {
               const options: { name: string; label: string }[] = []
               field.picklistValues.forEach((p: SObjectPicklistValue) => {
                  const optionValue = p?.value ?? null;
                  if (!optionValue) {
                     return;
                  }
                  options.push({
                     name: decode(optionValue),
                     label: decode(p?.label ?? optionValue),
                  })
               })

               return {
                  field: fieldName,
                  label: fieldLabel,
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                     { key: 'In', value: 'in' },
                     { key: 'Not In', value: 'notin' }
                  ],
                  template: function (props: any) {
                     return (
                        <QbSelect
                           {...props}
                           qryBldrRef={filterBldrRef}
                           options={options} />
                     )
                  },
                  type: 'string',
               }
            }
            case 'PERCENT': {
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
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                  ],
                  type: 'number',
               }
            }
            case 'PHONE': {
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
               }
            }
            case 'PICKLIST': {
               const options: { name: string; label: string }[] = []
               field.picklistValues.forEach((p: SObjectPicklistValue) => {
                  const optionValue = p?.value ?? null;
                  if (!optionValue) {
                     return;
                  }
                  options.push({
                     name: decode(optionValue),
                     label: decode(p?.label ?? optionValue),
                  })
               })

               return {
                  field: fieldName,
                  label: fieldLabel,
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                     { key: 'In', value: 'in' },
                     { key: 'Not In', value: 'notin' }
                  ],
                  template: function (props: any) {
                     return (
                        <QbSelect
                           {...props}
                           qryBldrRef={filterBldrRef}
                           options={options} />
                     )
                  },
                  type: 'string',
               }
            }
            case 'REFERENCE': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                  ],
                  template: (props: any) => (
                     <QbAutocomplete {...props} fieldMetadata={field} qryBldrRef={filterBldrRef} apiClient={apiClient} variant="main" />
                  ),
                  type: 'string',
               }
            }
            case 'STRING': {
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
               }
            }
            case 'URL': {
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
               }
            }
            default: {
               // only create columns for the types above
               // skip the rest (such as compound fields and blobs)
               return {
                  field: null,
                  label: null,
                  type: null,
               }
            }
         }
      }

      function createQueryBuilderColumns(objMetadata: SObjectMetadata) {
         // const objMetadataFields = objMetadata.fields  // returns a map

         const objMetadataFields: SObjectFieldMetadata[] = objMetadata.fields;

         const cols: ColumnsModel[] = [];

         // need to use for..of so continue will work
         for (const field of objMetadataFields) {

            const fieldType = field.type;

            if (!sfdcDataTypes.includes(fieldType)) {
               continue
            }

            // create the column
            const col = createQueryColumn(field)

            if (col.field !== null) {
               cols.push(col)
            }
         }

         // sort by value
         cols.sort((a: ColumnsModel, b: ColumnsModel) => (a.label! < b.label!) ? -1 : (a.label! > b.label!) ? 1 : 0);


         return cols

      }

      if (!selectedObjMetadata) {
         return;
      }

      const qbCols = createQueryBuilderColumns(selectedObjMetadata);
      console.log('filterBuilder qbCols are');
      console.dir(qbCols);

      setFilterBuilderColumns(qbCols)
   }, [apiClient, selectedObjMetadata])


   // runFilter event
   useEffect(() => {
      const handleRunFilter = async () => {
         try {

            // update the current rule
            const currentRule = filterBldrRef.current!.getRules();
            console.log('onFilterRuleSave - currentRule is');
            console.dir(currentRule);
            setCurrentTimeSeriesFilterRule(currentRule)

            // 
            const newFilter: TimeSeriesFilterOption = { name: 'Dynamic Filter', filterRule: currentRule }
            setSelectedTimeSeriesFilter(newFilter)

            // send event to grid for execution
            // PubSub.publish('RunTimeSeriesFilter')
            setShowFilterBuilder(false);
         } catch (error: any) {
            console.log(error.message)
            enqueueSnackbar(`Error executing query - ${error.message}`, { action: action, variant: 'error' })
         }
      }

      const runFilterHandler = (msg: any) => {
         switch (msg) {
            case "FilterBulderRunFilter":
               handleRunFilter();
               break;
            default:
               break;
         }
      };

      const runQueryToken = PubSub.subscribe("FilterBulderRunFilter", runFilterHandler);

      return () => {
         PubSub.unsubscribe(runQueryToken);
      };
   }, [action, convertNotToIsNot, enqueueSnackbar, selectedObject?.qualifiedApiName, selectedQuery, setCurrentTimeSeriesFilterRule, setQueryRuleModified, setRunQuery, setSelectedTimeSeriesFilter, setShowFilterBuilder])

   // save filter event
   useEffect(() => {
      const handleFilterDialogSave = async () => {
         // update the current rule
         const currentRule = filterBldrRef.current!.getRules();
         console.log('onFilterRuleSave - currentRule is');
         console.dir(currentRule);
         setCurrentTimeSeriesFilterRule(currentRule)

         // update the filter option
         const option = timeSeriesFilterOptions.find((f: TimeSeriesFilterOption) => f.name === selectedTimeSeriesFilter?.name);


         if (option && selectedTimeSeriesFilter) {
            option.filterRule = currentRule;
            updateTimeSeriesFilterOption(selectedTimeSeriesFilter.name, option);
            // send event to timeSeriesGrid for execution
            PubSub.publish('SaveTimeSeriesFilter')
         }

         setShowFilterBuilder(false)
      }

      const saveFilterHandler = (msg: any) => {
         switch (msg) {
            case "FilterBuilderSave":
               handleFilterDialogSave();
               break;
            default:
               break;
         }
      };
      const saveFilterToken = PubSub.subscribe("FilterBuilderSave", saveFilterHandler);

      return () => {
         PubSub.unsubscribe(saveFilterToken);
      };
   }, [selectedTimeSeriesFilter, setCurrentTimeSeriesFilterRule, setQueryRuleModified, setShowFilterBuilder, timeSeriesFilterOptions, updateTimeSeriesFilterOption]);

   // saveAs filter event
   useEffect(() => {
      const handleFilterDialogSaveAs = async () => {
         console.log('running filter saveAs')
         setShowSaveAs(true);
      }

      const saveAsFilterHandler = (msg: any) => {
         switch (msg) {
            case "FilterBuilderSaveAs":
               handleFilterDialogSaveAs();
               break;
            default:
               break;
         }
      };
      const saveAsFilterToken = PubSub.subscribe("FilterBuilderSaveAs", saveAsFilterHandler);

      return () => {
         PubSub.unsubscribe(saveAsFilterToken);
      };
   }, []);

   // delete filter event
   useEffect(() => {
      const handleFilterDialogDelete = async () => {


         // show error message if user doesn't have delete permissions
         const deletePerm = objectPermissions.find((p: SObjectPermission) => p.sObjectType === 'AppGridAg__AG_Query__c')
         if (!deletePerm) {
            enqueueSnackbar(`Unexpected error: delete permission not found`, {
               action: action,
               variant: 'error',
            })
            return;
         }

         if (!deletePerm.permissionsDelete) {
            enqueueSnackbar(`Delete permission not assigned for object AppGridAg__AG_Query__c`, {
               action: action,
               variant: 'error',
            })
            return;
         }

         setShowQueryDeleteDialog(true)
      }

      const deleteFilterHandler = (msg: any) => {
         switch (msg) {
            case "DeleteFilter":
               handleFilterDialogDelete();
               break;
            default:
               break;
         }
      };
      const deleteFilterToken = PubSub.subscribe("DeleteQuery", deleteFilterHandler);

      return () => {
         PubSub.unsubscribe(deleteFilterToken);
      };
   }, [action, enqueueSnackbar, objectPermissions, setShowQueryDeleteDialog]);

   // close dialog event
   useEffect(() => {
      const closeDialogHandler = (msg: any) => {
         switch (msg) {
            case "CloseQueryDialog":
               setShowFilterBuilder(false)
               setShowSaveAs(false)
               clearErrors()
               break;
            default:
               break;
         }
      };
      const closeDialogToken = PubSub.subscribe("CloseQueryDialog", closeDialogHandler);

      return () => {
         PubSub.unsubscribe(closeDialogToken);
      };
   }, [clearErrors, setShowFilterBuilder]);

   return (
      <Portal>
         <Dialog
            data-name="FilterBuilder"
            fullWidth
            maxWidth="md"
            sx={{
               margin: 0,
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               zIndex: 2000
            }}
            open={showFilterBuilder}
            onClose={handleFilterDialogClose}
            disablePortal
         >
            <AppBar
               position="static"
               sx={{
                  backgroundColor: brightBlueHeaderColor,
                  color: muiColor, borderColor:
                     selectedAccentColor,
                  borderWidth: 1
               }}>
               <Toolbar variant='dense'>
                  <Typography >
                     Filter Builder
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <IconButton
                     size="large"
                     edge="start"
                     color="inherit"
                     aria-label="menu"
                     onClick={() => {
                        handleFilterDialogCancel(); // Make sure this is defined correctly
                     }}
                  >
                     <CloseOutlinedIcon />
                  </IconButton>
               </Toolbar>
            </AppBar>

            <DialogContent sx={{ backgroundColor: muiBackgroundColor, width: '700px', height: '400px' }}>
               {/* filter builder buttons */}
               <Box
                  sx={{ marginTop: 2, marginBottom: 2 }}>
                  <FilterBuilderMenu />
               </Box>

               {/* QueryBuilderComponent */}
               <Box
                  sx={{
                     display: 'flex',
                     marginTop: 2,
                     // flexGrow: 1,
                     flexDirection: 'column',
                     justifyContent: 'flex-start',
                     overflow: 'auto',
                     backgroundColor: muiBackgroundColor, color: muiColor
                  }}
               >
                  <Stack
                     flexDirection="row" >
                     {/* query delete confirmation dialog */}
                     {showQueryDeleteDialog && <QueryDeleteDialog />}

                     {filterBuilderColumns ?
                        <QueryBuilderComponent
                           id="querybuilder"
                           ref={filterBldrRef}
                           columns={filterBuilderColumns}
                           displayMode="Horizontal"
                           dataSource={rowData}
                           enableNotCondition={true}
                           rule={currentTimeSeriesFilterRule}
                           change={onFilterRuleChange}
                           showButtons={{
                              ruleDelete: true,
                              groupInsert: false,
                              groupDelete: false,
                           }}
                           sortDirection="Ascending"
                           width='800px'
                        /> : null}

                     {/* 2nd column - query text */}
                     {showQueryText ? (
                        <Stack
                           flexDirection="column"
                           sx={{

                              ml: 5,
                           }}
                        >
                           {/* json/sql buttons */}
                           <FormControl
                           >
                              <FormLabel id="query-display-buttons">Filter Display Type</FormLabel>
                              <RadioGroup
                                 row
                                 aria-labelledby="radio-buttons-group-label"
                                 name="query-display-type-buttons-group"
                                 onChange={(event) => {
                                    setQueryDisplayType(event.target.value)
                                 }}
                                 value={queryDisplayType}
                              >
                                 <FormControlLabel value="json" control={<Radio />} label="JSON" />
                                 <FormControlLabel value="sql" control={<Radio />} label="SQL" />
                              </RadioGroup>
                           </FormControl>

                           {/* query results */}
                           <Box
                              sx={{
                                 color: 'black',
                                 backgroundColor: 'white',
                                 width: 300
                              }}
                           >
                              <TextField fullWidth multiline maxRows={8} value={queryRuleText} />
                           </Box>
                        </Stack>
                     ) : (
                        null
                     )}
                  </Stack>
               </Box>
               {/* saveAs name */}
               <Stack
                  sx={{
                     display: showSaveAs ? 'block' : 'none',
                     // marginTop: 3,
                     // marginBottom: 3,
                     backgroundColor: muiBackgroundColor,
                     color: muiColor,
                     marginTop: 2
                  }}
                  direction={'row'}
                  justifyContent="center"
               >
                  {/* "handleSubmit" will validate your inputs before invoking "onSubmit" */}

                  <form onSubmit={handleSubmit(onFilterRuleSaveAsSubmit)} noValidate>
                     <Stack direction={'row'} spacing={4} justifyContent="end" marginRight={12} sx={{ backgroundColor: muiBackgroundColor, color: muiColor, marginBottom: 2 }}>
                        <TextField
                           defaultValue={''}
                           label="Rule name"
                           size="small"
                           variant="standard"
                           {...register('ruleName', {
                              required: 'Rule name is required',
                           })}
                           error={!!errors.ruleName}
                           helperText={errors.ruleName?.message}

                           sx={{
                              marginTop: -2,
                              input: { color: muiColor, },
                              '& .MuiInputLabel-root': {
                                 color: muiColor, // This sets the label color
                              },
                              '& .MuiInputLabel-root.Mui-focused': {
                                 color: muiColor,
                              },
                              '& .MuiInput-underline:before': {
                                 borderBottom: `2px solid ${muiColor}`,
                              },
                              '& .MuiInput-underline:hover:before': {
                                 borderBottom: `2px solid ${muiColor}`,
                              },
                              '& .MuiInput-underline:after': {
                                 borderBottom: `2px solid ${muiColor}`,
                              },
                              '& .MuiInputBase-input.Mui-disabled': {
                                 opacity: 1,
                                 WebkitTextFillColor: `rgba(var(--adaptableInputColor), 0.2)`,
                              },
                           }}
                        />

                        <Button type="submit" color="primary" size="small" sx={{ paddingTop: 2 }}>
                           Submit
                        </Button>
                        {/* </Box> */}
                     </Stack>
                  </form>
                  <DevTool control={control} />
               </Stack>
               {/* save errors */}
               <Stack sx={{ display: showErrors ? 'block' : 'none' }} direction={'row'} justifyContent="end">
                  <TextField label="Rule name" size="small" variant="standard" value={ruleErrorMessage} />
               </Stack>
            </DialogContent>
         </Dialog>
      </Portal>
   )
};

export { FilterBuilder };
