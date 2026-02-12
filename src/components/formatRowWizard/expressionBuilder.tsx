/*==========================================
** IMPORTS
==========================================*/
// React
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// React Hook Form
import { useForm } from 'react-hook-form'
import { DevTool } from '@hookform/devtools'

// Syncfusion QueryBuilder
import {
   QueryBuilderComponent,
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
} from '@mui/material'

import { useTheme } from '@mui/material/styles';

// Notifications
import { useSnackbar } from 'notistack'

// PubSubJS
import PubSub from "pubsub-js";

// Types
import { SObject, SObjectPermission } from '../../sObjectMetadataTypes';

import { AgRowStyle } from '../../appInterfaces/grid/gridInterfaces';

import { APIClient } from '../../brideDesignPattern/apiInterface';

/*==========================================
** TYPES & INTERFACES
==========================================*/
type RuleInputs = {
   ruleName: string
}

interface ExpressionBuilderTabProps {
   apiClient: APIClient;
   setIsRuleValid: React.Dispatch<React.SetStateAction<boolean>>;
   rowStyleCopy: AgRowStyle;
   rowData: SObject[];
   updateRowStyleProperty: <K extends keyof AgRowStyle>(
      key: K,
      value: AgRowStyle[K]
   ) => void;
   qbRef?: React.RefObject<QueryBuilderComponent>;
}

/*==========================================
** COMPONENT
==========================================*/
const ExpressionBuilder = ({ apiClient, rowStyleCopy, rowData, setIsRuleValid, updateRowStyleProperty, qbRef }: ExpressionBuilderTabProps) => {
   const theme = useTheme();

   /*==========================================
   ** REFS
   ==========================================*/
   const localRef = useRef<QueryBuilderComponent>(null);
   const expressionBldrRef = qbRef ?? localRef;

   /*==========================================
   ** CUSTOM HOOKS
   ==========================================*/
   const { enqueueSnackbar, closeSnackbar } = useSnackbar()

   const form = useForm<RuleInputs>()

   const { register, handleSubmit, formState, control, clearErrors } = form

   const { errors } = formState

   /*==========================================
   ** GLOBAL STATE (Zustand)
   ==========================================*/
   const {
      objectPermissions,
      selectedObjMetadata,
      setShowQueryDeleteDialog,
      setShowQueryPanel
   } = useStore(useShallow((state) => ({
      objectPermissions: state.objectPermissions,
      selectedObjMetadata: state.selectedObjMetadata,
      setShowQueryDeleteDialog: state.setShowQueryDeleteDialog,
      setShowQueryPanel: state.setShowQueryPanel,
   })));

   /*==========================================
   ** LOCAL STATE
   ==========================================*/
   const [queryBuilderColumns, setQueryBuilderColumns] = useState<ColumnsModel[]>([]);

   const [showSaveAs, setShowSaveAs] = useState(false)

   const [showErrors] = useState(false)

   const [ruleErrorMessage] = useState('')

   /*==========================================
   ** CALLBACKS
   ==========================================*/
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
      console.log(`ruleName is ${data.ruleName}`)
      // saveQueryAs('saveAs', data.ruleName)
   }

   // Validate if the query rule is complete with debugging
   const validateRule = useCallback((rule: RuleModel): boolean => {
      if (!rule) return false;
      if (!rule.rules) return false;
      if (rule.rules.length === 0) return false;

      const isValid = rule.rules.every((r, index) => {
         console.log(`validateRule - Checking rule #${index}:`, r);
         if (r.rules) {
            console.log(`validateRule - Rule #${index} is a group, validating recursively`);
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
               console.log(`validateRule - Between value #${i}: ${v}, valid: ${isValidValue}`);
               return isValidValue;
            })
            : true;

         console.log(`validateRule - Rule #${index} - Field: ${hasField}, Operator: ${hasOperator}, Value: ${hasValue}, Between: ${hasValidBetween}`);
         console.log(`validateRule - Rule #${index} - Raw value:`, r.value);

         const ruleValid = hasField && hasOperator && hasValue && hasValidBetween;
         if (!ruleValid) {
            console.log(`validateRule - Rule #${index} is invalid`);
         }
         return ruleValid;
      });

      console.log('validateRule - Final validation result:', isValid);
      return isValid;
   }, []);

   /*==========================================
   ** EVENT HANDLERS
   ==========================================*/
   const onRuleChange = (args: any) => {
      console.log('onRuleChange');
      console.dir(args)

      if (expressionBldrRef.current) {
         const rule = expressionBldrRef.current.getRules();
         console.log('onRuleChange - rule is');
         console.dir(rule);
         const validRule = validateRule(rule)

         if (validRule) {
            try {
               updateRowStyleProperty('rule', rule as any);
            } catch {
               // Fallback to direct assignment if needed
               (rowStyleCopy as any).rule = rule as any;
            }
         }

         setIsRuleValid(validRule);
      }
   }

   // Log when QueryBuilder is created
   const onCreated = useCallback(() => {
      if (selectedObjMetadata && expressionBldrRef.current) {
         console.log('QueryBuilder creating columns');
         const qbCols = createQueryBuilderColumns(selectedObjMetadata, expressionBldrRef, apiClient);
         console.log('QueryBuilder columns are');
         console.dir(qbCols);
         setQueryBuilderColumns(qbCols);
         const rule = expressionBldrRef.current.getRules();
         setIsRuleValid(validateRule(rule));
      } else {
         console.log('ExpressionBuilder - Cannot create columns in onQueryBuilderCreated: Missing metadata or ref.');
         setQueryBuilderColumns([]);
      }
   }, [apiClient, expressionBldrRef, selectedObjMetadata, setIsRuleValid, validateRule]);

   /*==========================================
   ** EFFECTS
   ==========================================*/
   // Sync changes coming from custom templates (e.g., picklist) that publish QB_RULE_CHANGED
   useEffect(() => {
      const token = PubSub.subscribe('QB_RULE_CHANGED', () => {
         const qb = expressionBldrRef.current;
         if (!qb || typeof qb.getRules !== 'function') return;
         const currentRule = qb.getRules();
         try {
            updateRowStyleProperty('rule', currentRule as any);
         } catch {
            // updateRowStyleProperty failed
         }
         setIsRuleValid(validateRule(currentRule));
      });
      return () => { PubSub.unsubscribe(token); };
   }, [expressionBldrRef, setIsRuleValid, updateRowStyleProperty, validateRule]);

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

   /*==========================================
   ** RENDER
   ==========================================*/
   return (
      <Stack direction='column'
         sx={{
            width: '100%',
            height: 350,
            flexGrow: 1,
            typography: 'body1'
         }}
      >
         <Box
            sx={{
               display: 'flex',
               marginTop: 1,
               // flexGrow: 1,
               flexDirection: 'column',
               justifyContent: 'flex-start',
               overflow: 'auto',
               backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary
            }}>
            {/* QueryBuilderComponent */}
            <Stack
               flexDirection="row">

               <QueryBuilderComponent
                  id="expressionbuilder"
                  ref={expressionBldrRef}
                  columns={queryBuilderColumns}
                  created={onCreated}
                  displayMode="Horizontal"
                  dataSource={rowData}
                  enableNotCondition={true}
                  rule={rowStyleCopy.rule}
                  ruleChange={onRuleChange}  // validates new rule
                  change={onRuleChange}  // validates rule
                  showButtons={{
                     ruleDelete: true,
                     groupInsert: true,
                     groupDelete: true,
                  }}
                  sortDirection="Ascending"
                  width='100%'
               />
            </Stack>

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
               <Stack direction={'row'} spacing={4} justifyContent="end" marginRight={12} sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, marginBottom: 2 }}>
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

/*==========================================
** EXPORT
==========================================*/
export { ExpressionBuilder }
