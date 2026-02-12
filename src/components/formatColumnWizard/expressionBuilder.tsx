import React, { useState, useEffect, useRef, useCallback } from 'react';

// Zustand
import useStore from '../../zustandStore'

// ReactHookForm
import { useForm } from 'react-hook-form'
import { DevTool } from '@hookform/devtools'

import { prettyPrint } from '../../utilities/prettyPrint';

// Syncfusion QueryBuilder (types only; component is lazy-loaded)
import type {
   RuleModel,
   ColumnsModel
} from '@syncfusion/ej2-react-querybuilder';

import { createQueryBuilderColumns } from '../../gridMethods/createQueryBuilderColumns';


// MUI
import {
   Box,
   Button,
   Stack,
   TextField,
   Typography,
} from '@mui/material'

import { useTheme } from '@mui/material/styles';

// components
import { ExpressionBuilderMenu } from './expressionBuilderMenu'

// notifications
import { useSnackbar } from 'notistack'

// Lodash
import _ from 'lodash'

// PubSubJS
import PubSub from "pubsub-js";

// app interfaces
// import { Query } from '../../appInterfaces/grid/gridInterfaces'

import { SObjectMetadata, SObject, SObjectPermission } from '../../sObjectMetadataTypes';

import { AgColumnStyle } from '../../appInterfaces/grid/gridInterfaces';

import { APIClient } from '../../brideDesignPattern/apiInterface';

import { useShallow } from 'zustand/react/shallow';

// saveAs type declaration
type RuleInputs = {
   ruleName: string
}

// TYPES
interface ExpressionBuilderTabProps {
   apiClient: APIClient;
   columnStyleCopy: AgColumnStyle;
   isRuleValid: boolean;
   setIsRuleValid: React.Dispatch<React.SetStateAction<boolean>>;
   objMetadata: SObjectMetadata;
   rowData: SObject[];
   updateColumnStyleProperty: <K extends keyof AgColumnStyle>(
      key: K,
      value: AgColumnStyle[K]
   ) => void;
}

const ExpressionBuilder = ({
   apiClient,
   columnStyleCopy,
   setIsRuleValid,
   objMetadata,
   updateColumnStyleProperty }: ExpressionBuilderTabProps) => {

   const theme = useTheme();

   console.log('loading formatColumnWizard ExpressionBuilder')

   prettyPrint('ExpressionBuilder objMetadata is', objMetadata, 'blue');

   // OBJECT REFS
   const expressionBldrRef = useRef<any>(null);

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

   // GLOBAL STATE
   const {
      objectPermissions,
      setShowQueryDeleteDialog,
      setShowQueryPanel
   } = useStore(useShallow((state) => ({
      objectPermissions: state.objectPermissions,
      setShowQueryDeleteDialog: state.setShowQueryDeleteDialog,
      setShowQueryPanel: state.setShowQueryPanel
   })))


   // LOCAL STATE
   const [queryBuilderColumns, setQueryBuilderColumns] = useState<ColumnsModel[]>([]);
   const [ruleErrorMessage] = useState('')
   const [showSaveAs, setShowSaveAs] = useState(false)
   const [showErrors] = useState(false)


   // FUNCTIONS

   // react hook form
   const form = useForm<RuleInputs>()
   const { register, handleSubmit, formState, control, clearErrors } = form
   const { errors } = formState


   const convertNotToIsNot = useCallback(function (queryRule: any) {
      // Check if the current object is an array or an object
      if (Array.isArray(queryRule)) {
         // If it's an array, iterate through each element and apply the function recursively
         queryRule.forEach(convertNotToIsNot);
      } else if (typeof queryRule === 'object' && queryRule !== null) {
         // If it's an object, check if it has a 'not' property using Object.prototype.hasOwnProperty.call()
         if (Object.prototype.hasOwnProperty.call(queryRule, 'not')) {
            // Assign the value of 'not' to 'isNot' and delete the 'not' property
            queryRule.isNot = queryRule.not;
            delete queryRule.not;
         }

         // Iterate over the object's properties to apply the function recursively
         for (const key in queryRule) {
            if (Object.prototype.hasOwnProperty.call(queryRule, key)) {
               convertNotToIsNot(queryRule[key]);
            }
         }
      }

      return queryRule; // Return the modified queryRule object
   }, []);

   const handleQueryDialogSaveAs = async () => {
      setShowSaveAs(true)
   }

   const onRuleSaveAsSubmit = (data: RuleInputs) => {
      prettyPrint(`[onRuleSaveAsSubmit] - ruleName is`, data.ruleName, 'blue')
      // saveQueryAs('saveAs', data.ruleName)
   }

   // Validate if the query rule is complete with debugging
   const validateRule = useCallback((rule: RuleModel): boolean => {
      if (!rule) return false;
      if (!rule.rules) return false;
      if (rule.rules.length === 0) return false;

      const isValid = rule.rules.every((r, index) => {
         prettyPrint(`[expressionBuilder] validateRule - Checking rule #`, {
            r: r,
            index: index
         }, 'blue');
         if (r.rules) {
            console.log(`[expressionBuilder] validateRule - Rule #${index} is a group, validating recursively`);
            return validateRule(r);
         }

         const hasField = !!r.field;
         const hasOperator = !!r.operator;
         const hasValue = r.value !== undefined && r.value !== null && (
            (Array.isArray(r.value) ? r.value.length > 0 : r.value !== '')
         );
         const isBetweenOperator = r.operator === 'between' || r.operator === 'notbetween';
         const hasValidBetween = isBetweenOperator
            ? Array.isArray(r.value) && r.value.length === 2 && r.value.every((v, i) => {
               const isValidValue = v !== undefined && v !== null && v !== '';
               prettyPrint(`[expressionBuilder] validateRule - Between value #${i}: ${v}`, { valid: isValidValue }, 'blue');
               return isValidValue;
            })
            : true;

         prettyPrint('[expressionBuilder] validateRule - Rule snapshot', {
            index,
            hasField,
            hasOperator,
            hasValue,
            hasValidBetween,
         }, 'blue');

         prettyPrint(`[expressionBuilder] validateRule - Rule #${index} - Raw value:`, r.value, 'blue');

         const ruleValid = hasField && hasOperator && hasValue && hasValidBetween;
         if (!ruleValid) {
            prettyPrint(`[expressionBuilder] validateRule - Rule #${index} is invalid`, null, 'blue');
         }
         return ruleValid;
      });

      prettyPrint('[expressionBuilder] validateRule - Final validation result:', isValid, 'blue');
      return isValid;
   }, []);

   // When user closes external Query Builder, pull rule from store and apply
   const queryRuleModified = useStore((state) => state.queryRuleModified as any);

   useEffect(() => {
      const closeDialogHandler = (msg: unknown) => {
         if (msg === 'CloseQueryDialog') {
            try {
               const qr = (queryRuleModified && (queryRuleModified.queryRule || queryRuleModified.rule)) as string | RuleModel | undefined;
               let nextRule: RuleModel | undefined;
               if (typeof qr === 'string') {
                  nextRule = JSON.parse(qr);
               } else if (qr && typeof qr === 'object') {
                  nextRule = qr as RuleModel;
               }
               if (nextRule) {
                  const normalized = convertNotToIsNot(_.cloneDeep(nextRule)) as RuleModel;
                  prettyPrint('[ExpressionBuilder] Applying rule from external QB', normalized, 'green');
                  updateColumnStyleProperty('rule', normalized as any);
                  setIsRuleValid(validateRule(normalized));
               }
            } catch (e) {
               prettyPrint('[ExpressionBuilder] Failed to apply rule from external QB', String(e), 'red');
            }
         }
      };
      const token = PubSub.subscribe('CloseQueryDialog', closeDialogHandler as any);
      return () => {
         PubSub.unsubscribe(token);
      }
   }, [convertNotToIsNot, queryRuleModified, setIsRuleValid, updateColumnStyleProperty, validateRule]);

   // Build columns as soon as metadata is available (avoid relying on onCreated for initial columns)
   useEffect(() => {
      try {
         if (!objMetadata) {
            prettyPrint('ExpressionBuilder: objMetadata missing, skipping columns build', null, 'orange');
            setQueryBuilderColumns([]);
            return;
         }
         console.log('ExpressionBuilder creating columns (effect)');
         const qbCols = createQueryBuilderColumns(objMetadata, expressionBldrRef, apiClient);
         prettyPrint('ExpressionBuilder columns are', qbCols, 'blue');
         setQueryBuilderColumns(Array.isArray(qbCols) ? qbCols : []);
      } catch (e) {
         prettyPrint('ExpressionBuilder: failed to create columns', e, 'red');
         setQueryBuilderColumns([]);
      }
   }, [apiClient, objMetadata]);

   // saveAs query event
   useEffect(() => {
      const saveAsQueryHandler = (msg: any) => {
         switch (msg) {
            case "SaveAsQuery":
               handleQueryDialogSaveAs();
               break;
            default:
               break;
         }
      };
      const saveAsQueryToken = PubSub.subscribe("SaveAsQuery", saveAsQueryHandler);

      return () => {
         PubSub.unsubscribe(saveAsQueryToken);
      };
   }, []);

   // delete query event
   useEffect(() => {
      const handleQueryDialogDelete = async () => {

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

      const deleteQueryHandler = (msg: any) => {
         switch (msg) {
            case "DeleteQuery":
               handleQueryDialogDelete();
               break;
            default:
               break;
         }
      };
      const deleteQueryToken = PubSub.subscribe("DeleteQuery", deleteQueryHandler);

      return () => {
         PubSub.unsubscribe(deleteQueryToken);
      };
   }, [action, enqueueSnackbar, objectPermissions, setShowQueryDeleteDialog]);

   // close dialog event
   useEffect(() => {
      const closeDialogHandler = (msg: any) => {
         switch (msg) {
            case "CloseQueryDialog":
               setShowQueryPanel(false)
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
   }, [clearErrors, setShowQueryPanel]);

   // close dialog event
   useEffect(() => {
      const closeDialogHandler = (msg: unknown) => {
         switch (msg) {
            case "CloseQueryDialog":
               setShowQueryPanel(false)
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
   }, [clearErrors, setShowQueryPanel]);

   prettyPrint('rendering expressionBuilder', {
      columns: queryBuilderColumns,
      // rowData: rowData,
      rule: columnStyleCopy.rule
   }, 'green')

   // Debug lifecycle traces to isolate Aura/LWS timing issues
   useEffect(() => {
      prettyPrint('[ExpressionBuilder] mounted', {
         columnsLen: queryBuilderColumns.length,
      }, 'purple');
      const onError = (e: any) => {
         try {
            prettyPrint('[ExpressionBuilder] window.onerror', {
               message: e?.message,
               error: String(e?.error || ''),
            }, 'red');
         } catch (logErr) {
            prettyPrint('[ExpressionBuilder] error logging failed', logErr, 'red');
         }
      };
      window.addEventListener('error', onError);
      return () => {
         window.removeEventListener('error', onError);
         prettyPrint('[ExpressionBuilder] unmounted', null, 'purple');
      };
   }, [queryBuilderColumns.length]);

   // Deferred debug read of rules (read-only) after mount
   useEffect(() => {
      if (!expressionBldrRef.current) return;
      const id = setTimeout(() => {
         try {
            const r = expressionBldrRef.current?.getRules?.();
            prettyPrint('[ExpressionBuilder] deferred getRules()', r, 'blue');
         } catch (err) {
            prettyPrint('[ExpressionBuilder] deferred getRules() failed', String(err), 'red');
         }
      }, 200);
      return () => clearTimeout(id);
   }, [queryBuilderColumns.length]);

   return (
      <Stack direction='column'
         sx={{
            width: 650,
            height: 350,
            flexGrow: 1,
            typography: 'body1'
         }}
      >
         <Box
         // sx={{ marginTop: 1 }}
         >
            <ExpressionBuilderMenu />
         </Box>

         <Box
            sx={{
               display: 'flex',
               marginTop: 1,
               // flexGrow: 1,
               flexDirection: 'column',
               justifyContent: 'flex-start',
               overflow: 'auto',
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary
            }}>

            {/* TEMP: Replace QueryBuilder with a simple placeholder to validate tab loading */}
            {
               (
                  <Box
                     sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 360,
                        border: '1px dashed',
                        borderColor: 'divider',
                        color: theme.palette.text.primary,
                        backgroundColor: 'transparent'
                     }}
                  >
                     <Typography variant="body1">QueryBuilder</Typography>
                  </Box>
               )
            }

         </Box>

         {/* saveAs name */}
         <Stack
            sx={{
               display: showSaveAs ? 'block' : 'none',
               // marginTop: 3,
               // marginBottom: 3,
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               marginTop: 2
            }}
            direction={'row'}
            justifyContent="center"
         >
            {/* "handleSubmit" will validate your inputs before invoking "onSubmit" */}

            <form onSubmit={handleSubmit(onRuleSaveAsSubmit)} noValidate>
               <Stack
                  direction={'row'}
                  spacing={4}
                  justifyContent="end"
                  marginRight={12}
                  sx={{
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary, marginBottom: 2
                  }}>
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
                        input: { color: theme.palette.text.primary, },
                        '& .MuiInput-underline:before': {
                           borderBottom: `2px solid ${theme.palette.text.primary}`,
                        },
                        '& .MuiInput-underline:hover:before': {
                           borderBottom: `2px solid ${theme.palette.text.primary}`,
                        },
                        '& .MuiInput-underline:after': {
                           borderBottom: `2px solid ${theme.palette.text.primary}`,
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
      </Stack>
   )
};

export { ExpressionBuilder }
