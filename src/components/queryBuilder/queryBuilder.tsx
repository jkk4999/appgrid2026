import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// Zustand
import useStore from '../../zustandStore'

// ReactHookForm
import { useForm } from 'react-hook-form'

// Html Encode/Decode
import { decode } from 'he'

import { prettyPrint } from '../../utilities/prettyPrint';

// Syncfusion QueryBuilder
import {
   QueryBuilderComponent,
   RuleModel,
   ColumnsModel
} from '@syncfusion/ej2-react-querybuilder';

import { enableRipple } from '@syncfusion/ej2-base';

enableRipple(true);

import { createQueryBuilderColumns } from '../../gridMethods/createQueryBuilderColumns';

// MUI
import {
   AppBar,
   Autocomplete,
   Box,
   Button,
   Checkbox,
   Dialog,
   DialogContent,
   FormControl,
   FormControlLabel,
   FormLabel,
   IconButton,
   Radio,
   RadioGroup,
   Stack,
   TextField,
   Toolbar,
   Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';

import { TabPanelProps } from '@mui/lab';

// MUI icons
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';

import Tab from '@mui/material/Tab';

import TabContext from '@mui/lab/TabContext';

import TabList from '@mui/lab/TabList';

// components
import QueryDeleteDialog from './queryDeleteDialog';
import QueryBuilderMenu from './QueryBuilderMenu';
import QbAutocomplete from './QbAutocomplete';
import QbSelect from './QbSelect';
import MuiNumberEditor from './muiNumberEditor';
import MuiTextEditor from './muiTextEditor';
import MuiEmailEditor from './muiEmailEditor';
import MuiPhoneEditor from './muiPhoneEditor';
import QbMuiDateEditor from './qbMuiDateEditor';
import { ShareQueryDialog, SharedQueriesTab, ImportQueryDialog } from '../querySharing';

import { useDeleteRecords } from '../../hooks/useDeleteRecords';
// Note: Avoid dayjs parsing to keep deps minimal here.


// notifications
import { useSnackbar } from 'notistack'

// Lodash
import _ from 'lodash'

// PubSubJS
import PubSub from "pubsub-js";

// app interfaces
// import { Query } from '../../appInterfaces/grid/gridInterfaces'

import { SObjectQuery, SObjectFieldMetadata, SharedQueryDTO } from '../../sObjectMetadataTypes';

import normalizeQueries from '../../utilities/normalizeQueries';

import { RelationPreference } from '../../appInterfaces/grid/gridInterfaces';

import { useShallow } from 'zustand/react/shallow';
import { useGridPermissions, useThemeState } from '../../hooks/selectors/useUIState';
import { useOrgMetadata } from '../../hooks/selectors/useMetadataState';

// saveAs type declaration
type RuleInputs = {
   ruleName: string
}

interface RelationOption {
   name: string,
   label: string,
   checked?: boolean,
   childSObject?: string,
   relationshipName?: string,
   selectedGridType?: string,
}

// TYPES
interface CustomTabPanelProps extends TabPanelProps {
   children?: React.ReactNode;
   value: string;
   index: string;
   keepMounted?: boolean; // Make this optional if not always required
}

interface QueryBuilderTemplateProps {
   field: ColumnsModel;
   rule: RuleModel;
   ruleID: string;
}

const buildFieldModel = (cols: ColumnsModel[] = []) => ({
   allowFiltering: true,
   popupHeight: '400px',
   width: 250,
   sortOrder: 'Ascending' as const,
   fields: {
      text: 'label',
      value: 'field',
   },
   dataSource: cols.map((col) => ({ ...col })),
});

const CustomTabPanel: React.FC<CustomTabPanelProps> = ({
   children,
   value,
   index,
   keepMounted = false,
}) => {
   const isActive = value === index;

   return (
      <div
         role="tabpanel"
         hidden={!isActive}
         id={`tabpanel-${index}`}
         aria-labelledby={`tab-${index}`}
         style={{ width: '100%', minWidth: 0, overflowX: 'hidden', height: '100%', minHeight: 0 }}
      >
         {(keepMounted || isActive) && (
            <Box sx={{ width: '100%', minWidth: 0, overflowX: 'hidden', height: '100%', minHeight: 0 }}>
               {children}
            </Box>
         )}
      </div>
   );
};

const QueryBuilder = (props: any) => {
   const { apiClient, objPermissionsMap, rowData } = props

   const theme = useTheme();
   const { selectedAccentColor } = useThemeState();
   const { gridPermissions } = useGridPermissions();
   const { userProfile } = useOrgMetadata();
   const isSystemAdmin = useMemo(() => {
      return userProfile?.name === 'System Administrator';
   }, [userProfile]);
   const isTeamSharingEnabled = useMemo(() => {
      return isSystemAdmin === true || gridPermissions?.enableTeamSharing === true;
   }, [isSystemAdmin, gridPermissions]);

   const [value, setValue] = React.useState('1');

   const handleChange = (event: React.SyntheticEvent, newValue: string) => {
      setValue(newValue);
   };

   // OBJECT REFS
   const qryBldrRef = useRef<QueryBuilderComponent>(null);

   const subQryBldrRef = useRef<QueryBuilderComponent>(null);

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
      currentQueryRule,
      isRuleValid,
      relationPreferences,
      selectedObject,
      selectedObjMetadata,
      selectedQuery,
      openShareQueryDialog,
      openImportQueryDialog,
      setSharedWithMeQueries,
      setSharedWithMeQueriesLoading,
      setCurrentQueryRule,
      setIsRuleValid,
      setLoading,
      setQueryOptions,
      setQueryRuleModified,
      setRunQuery,
      setSelectedQuery,
      setShowQueryDeleteDialog,
      setShowQueryPanel,
      showQueryDeleteDialog,
      showQueryPanel,
      userInfo
   } = useStore(useShallow((state) => ({
      currentQueryRule: state.currentQueryRule,
      isRuleValid: state.isRuleValid,
      relationPreferences: state.relationPreferences,
      selectedObject: state.selectedObject,
      selectedObjMetadata: state.selectedObjMetadata,
      selectedQuery: state.selectedQuery,
      openShareQueryDialog: state.openShareQueryDialog,
      openImportQueryDialog: state.openImportQueryDialog,
      setSharedWithMeQueries: state.setSharedWithMeQueries,
      setSharedWithMeQueriesLoading: state.setSharedWithMeQueriesLoading,
      setCurrentQueryRule: state.setCurrentQueryRule,
      setIsRuleValid: state.setIsRuleValid,
      setLoading: state.setLoading,
      setQueryOptions: state.setQueryOptions,
      setQueryRuleModified: state.setQueryRuleModified,
      setRunQuery: state.setRunQuery,
      setSelectedQuery: state.setSelectedQuery,
      setShowQueryDeleteDialog: state.setShowQueryDeleteDialog,
      setShowQueryPanel: state.setShowQueryPanel,
      showQueryDeleteDialog: state.showQueryDeleteDialog,
      showQueryPanel: state.showQueryPanel,
      userInfo: state.userInfo
   })))

   // Delete hook setup for queries
   const { deleteRecords } = useDeleteRecords({
      getGridApi: () => null,
      guardDelete: () => {
         const perm = objPermissionsMap.current.get('AppGridAg__AG_Query__c');
         if (!perm || perm.canDelete === false) {
            return { allowed: false, message: 'Delete permission not assigned for object AppGridAg__AG_Query__c' };
         }
         return { allowed: true };
      },
      apiDelete: async (ids: string[], sObjectName?: string) => {
         return await apiClient.deleteRecs({
            recordIds: ids,
            sObjectName: sObjectName || 'AppGridAg__AG_Query__c'
         });
      },
      enqueue: (msg, opts) => enqueueSnackbar(msg, opts),
   });

   const handleDeleteSelectedQuery = useCallback(async () => {
      try {
         if (!selectedQuery) return;
         const deletedId = (selectedQuery as any)?.id ?? (selectedQuery as any)?.Id;

         const deletedName = (selectedQuery as any)?.name ?? (selectedQuery as any)?.Name;

         const recIds = deletedId ? [deletedId] : [];
         if (recIds.length === 0) {
            // Fallback: nothing to delete (shouldn't happen), just return
            return;
         }

         await deleteRecords(recIds, 'AppGridAg__AG_Query__c');

         // Refresh query list
         if (selectedObject?.qualifiedApiName) {
            const objQueryApiResult = await apiClient.getObjQueries({ sObjectName: selectedObject.qualifiedApiName });

            const normalized = normalizeQueries(objQueryApiResult as any, selectedObject.qualifiedApiName);

            const filtered = (normalized || []).filter((q: any) => {
               const qId = q?.id ?? q?.Id;

               const qName = q?.name ?? q?.Name;

               if (deletedId) return qId !== deletedId;

               if (deletedName) return qName !== deletedName;
               return true;
            });

            setSelectedQuery(null);

            setQueryOptions(filtered.length > 0 ? filtered : []);
         } else {
            setSelectedQuery(null);

            setQueryOptions([]);
         }

         enqueueSnackbar('Query deleted!', { variant: 'success', autoHideDuration: 3000 });

         // Close the main query dialog as well
         setShowQueryPanel(false);
      } catch {
         // useDeleteRecords already enqueues the error, just ensure dialog closes
         setShowQueryPanel(false);
      }
   }, [apiClient, deleteRecords, enqueueSnackbar, selectedObject?.qualifiedApiName, selectedQuery, setQueryOptions, setSelectedQuery, setShowQueryPanel]);

   const handleShareQueryClick = useCallback(() => {
      const queryId = (selectedQuery as any)?.id ?? (selectedQuery as any)?.Id;
      const queryName = (selectedQuery as any)?.name ?? (selectedQuery as any)?.Name;

      if (queryId && queryName) {
         openShareQueryDialog(queryId, queryName);
      }
   }, [openShareQueryDialog, selectedQuery]);

   const upsertQueryOption = useCallback((query: SObjectQuery) => {
      setQueryOptions((prev: any[]) => {
         const list = Array.isArray(prev) ? prev : [];
         const queryId = (query as any)?.id ?? (query as any)?.Id;
         const index = queryId ? list.findIndex((q: any) => (q?.id ?? q?.Id) === queryId) : -1;

         if (index === -1) {
            return [...list, query];
         }

         const next = [...list];
         next[index] = query;
         return next;
      });
   }, [setQueryOptions]);

   const handleImportQuery = useCallback((sharedQuery: SharedQueryDTO) => {
      openImportQueryDialog(sharedQuery);
   }, [openImportQueryDialog]);

   const handleUpdateQuery = useCallback(async (sharedQuery: SharedQueryDTO) => {
      if (!apiClient || !sharedQuery.importedQueryId) return;

      try {
         const updatedQuery = await apiClient.updateImportedQuery({
            queryId: sharedQuery.importedQueryId,
         });

         if (updatedQuery) {
            upsertQueryOption(updatedQuery);
            setSelectedQuery(updatedQuery);
         }

         prettyPrint('[QueryBuilder] Query updated successfully', { queryId: sharedQuery.importedQueryId }, 'green');
      } catch (error) {
         console.error('[QueryBuilder] Error updating query:', error);
      }
   }, [apiClient, setSelectedQuery, upsertQueryOption]);

   const handleImportSuccess = useCallback((importedQuery: SObjectQuery) => {
      upsertQueryOption(importedQuery);
      setSelectedQuery(importedQuery);
   }, [setSelectedQuery, upsertQueryOption]);

   const handleRefreshSharedQueries = useCallback(async () => {
      if (!apiClient || !selectedObject?.qualifiedApiName) return;

      try {
         setSharedWithMeQueriesLoading(true);

         const response = await apiClient.getSharedQueries({
            sObjectName: selectedObject.qualifiedApiName,
         });

         if (response && Array.isArray(response)) {
            setSharedWithMeQueries(response);
         } else {
            setSharedWithMeQueries([]);
         }
      } catch (err) {
         prettyPrint('[QueryBuilder] refresh shared queries error', err);
      } finally {
         setSharedWithMeQueriesLoading(false);
      }
   }, [apiClient, selectedObject?.qualifiedApiName, setSharedWithMeQueries, setSharedWithMeQueriesLoading]);

   // LOCAL STATE
   const [isQueryBuilderMounted, setIsQueryBuilderMounted] = useState(false);

   const [queryBuilderColumns, setQueryBuilderColumns] = useState<ColumnsModel[]>([]);

   const [subQueryBuilderColumns, setSubQueryBuilderColumns] = useState<ColumnsModel[]>([]);

   const [relatedFieldsMetadata, setRelatedFieldsMetadata] = useState<SObjectFieldMetadata[]>([]);

   const [queryDisplayType, setQueryDisplayType] = useState<string>('json')

   const [queryRuleText] = useState<string>('')

   const [showQueryText] = useState<boolean>(false)

   const [showSaveAs, setShowSaveAs] = useState(false)

   const [showErrors, setShowErrors] = useState(false)

   const [relationOptions, setRelationOptions] = useState<RelationOption[]>([])

   const [selectedRelation, setSelectedRelation] = useState<RelationOption>()

   const [relatedQueryRule, setRelatedQueryRule] = useState({ condition: 'and', rules: [] });

   const mainFieldModel = useMemo(
      () => buildFieldModel(queryBuilderColumns || []),
      [queryBuilderColumns]
   );

   const subFieldModel = useMemo(
      () => buildFieldModel(subQueryBuilderColumns || []),
      [subQueryBuilderColumns]
   );

   // FUNCTIONS

   // react hook form
   const form = useForm<RuleInputs>()

   const { register, handleSubmit, formState, clearErrors } = form
   const mainRuleValidRef = useRef(false);

   const subRuleValidRef = useRef(false);

   const syncRuleValidity = useCallback(() => {
      setIsRuleValid(mainRuleValidRef.current || subRuleValidRef.current);
   }, [setIsRuleValid]);

   const updateMainRuleValidity = useCallback((isValid: boolean) => {
      mainRuleValidRef.current = isValid;
      syncRuleValidity();

   }, [syncRuleValidity]);
   const updateSubRuleValidity = useCallback((isValid: boolean) => {
      subRuleValidRef.current = isValid;
      syncRuleValidity();
   }, [syncRuleValidity]);
   const resetRuleValidity = useCallback(() => {
      mainRuleValidRef.current = false;

      subRuleValidRef.current = false;

      syncRuleValidity();
   }, [syncRuleValidity]);
   const { errors } = formState
   const [ruleErrorMessage, setRuleErrorMessage] = useState('')

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

   // Validate if the query rule is complete with debugging
   const validateRule = useCallback((rule: RuleModel): boolean => {
      if (!rule) return false;
      if (!rule.rules) return false;
      if (rule.rules.length === 0) return false;

      const isValid = rule.rules.every((r) => {
         if (r.rules) {
            return validateRule(r);
         }

         const hasField = !!r.field;

         const hasOperator = !!r.operator;

         const hasValue = r.value !== undefined && r.value !== null && (
            (Array.isArray(r.value) ? r.value.length > 0 : r.value !== '')
         );

         const isBetweenOperator = r.operator === 'between' || r.operator === 'notbetween';

         const hasValidBetween = isBetweenOperator
            ? Array.isArray(r.value) && r.value.length === 2 && r.value.every((v) => {
               const isValidValue = v !== undefined && v !== null && v !== '';
               return isValidValue;
            })
            : true;

         const ruleValid = hasField && hasOperator && hasValue && hasValidBetween;

         return ruleValid;
      });

      return isValid;
   }, []);

   // Normalize any date-like rule values to Salesforce-acceptable strings.
   // Uses object metadata to distinguish DATE vs DATETIME fields.
   function normalizeDateValues(rule: any, fieldsMetadata: SObjectFieldMetadata[]): any {
      if (!rule) return rule;

      const fieldTypeMap = new Map<string, string>();

      for (const f of fieldsMetadata) {
         if (f?.name && f?.type) fieldTypeMap.set(f.name, f.type);
      }

      const isValidDate = (d: Date) => d instanceof Date && !isNaN(d.getTime());

      const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

      const fmtDateLocal = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

      const fmtDateUTC = (d: Date) => `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;

      const fmtDateTime = (d: Date) => `${fmtDateUTC(d)}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}Z`;

      const parseDateString = (s: string): { yyyy: number; mm: number; dd: number } | null => {
         const mdY = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/;

         // M/D/YYYY or MM/DD/YYYY
         const yMd = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/;

         // YYYY-MM-DD
         let m: RegExpMatchArray | null;

         if ((m = s.match(mdY))) {
            return { mm: parseInt(m[1], 10), dd: parseInt(m[2], 10), yyyy: parseInt(m[3], 10) };
         }

         if ((m = s.match(yMd))) {
            return { yyyy: parseInt(m[1], 10), mm: parseInt(m[2], 10), dd: parseInt(m[3], 10) };
         }

         return null;
      };

      const parseStrToUTC = (s: string): Date | null => {
         const parsed = parseDateString(s);

         if (parsed) {
            const { yyyy, mm, dd } = parsed;

            const d = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0));

            return isValidDate(d) ? d : null;
         }
         const d = new Date(s);

         return isValidDate(d) ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds())) : null;
      };

      const parseAndFormat = (val: any, sfdcType: string | undefined) => {
         if (val instanceof Date) {
            return sfdcType === 'DATE' ? fmtDateLocal(val) : fmtDateTime(val);
         }

         if (typeof val === 'string') {
            const d = parseStrToUTC(val);

            if (!d) return val;

            if (sfdcType === 'DATE') {
               // Preserve the original components when string provided
               const parsed = parseDateString(val);
               if (parsed) {
                  const { yyyy, mm, dd } = parsed;
                  return `${yyyy}-${pad2(mm)}-${pad2(dd)}`;
               }
               return fmtDateLocal(d);
            }
            return fmtDateTime(d);
         }
         return val;
      };

      const clone = Array.isArray(rule) ? [...rule] : { ...rule };

      const walk = (node: any) => {
         if (!node) return;

         if (Array.isArray(node)) {
            node.forEach(walk);
            return;
         }

         if (node.rules && Array.isArray(node.rules)) {
            node.rules.forEach(walk);
            return;
         }

         // Leaf rule
         if (node.type === 'date') {
            const sfdcType = fieldTypeMap.get(node.field);

            if (Array.isArray(node.value)) {
               node.value = node.value.map((v: any) => parseAndFormat(v, sfdcType));
            } else {
               node.value = parseAndFormat(node.value, sfdcType);
            }
         }
      };

      walk(clone);
      return clone;
   }

   const saveQueryAs = useCallback(async (saveOperation: string, queryName?: string) => {

      if (!qryBldrRef.current) {
         return;
      }

      let currentRule = qryBldrRef.current?.getRules()

      prettyPrint('[QB] save:getRules', currentRule, 'orange');

      // convert the not property to isnot
      currentRule = convertNotToIsNot(currentRule);

      // Normalize any date strings to Salesforce-friendly formats
      const normalizedRule = normalizeDateValues(currentRule, selectedObjMetadata?.fields || []);

      prettyPrint('[QB] save:normalizedRule', normalizedRule, 'orange');

      const queryRuleStr = JSON.stringify(normalizedRule)

      const recsToUpsert: any = []

      const newQueryRec: any = {
         Name: '',
         AppGridAg__IsPublic__c: false,
         AppGridAg__IsActive__c: true,
         AppGridAg__IsDefault__c: false,
         // Canonical SObject name
         AppGridAg__SobjectApiName__c: selectedObject!.qualifiedApiName,
         // Persist rule to the defined field
         AppGridAg__QueryRule__c: queryRuleStr,
      }

      // get subQuery rule
      let subQueryRule = subQryBldrRef.current?.getRules()

      // convert the not property to isnot
      if (subQueryRule?.rules && subQueryRule.rules.length > 0) {
         subQueryRule = convertNotToIsNot(subQueryRule);

         const normalizedSubRule = normalizeDateValues(subQueryRule, relatedFieldsMetadata);

         const subQueryRuleStr = JSON.stringify(normalizedSubRule)

         // Save subquery rule to defined fields
         newQueryRec.AppGridAg__RelationQueryRule__c = subQueryRuleStr
         newQueryRec.AppGridAg__RelationSObjectApiName__c = selectedRelation!.name
         newQueryRec.relationRelationshipName =
            selectedRelation?.relationshipName || selectedRelation?.label || selectedRelation?.name || ''
      }

      if (saveOperation === 'saveAs' && queryName) {
         // creating new query
         newQueryRec['Name'] = decode(queryName)
      } else {
         newQueryRec['Name'] = decode(selectedQuery!.name)
         newQueryRec['Id'] = selectedQuery!.id
      }

      recsToUpsert.push(newQueryRec)

      // Debug payload
      prettyPrint('[QB] upsert payload', recsToUpsert, 'orange');

      const recsStr = JSON.stringify(recsToUpsert)

      try {
         const apiResult = await apiClient.upsertRecs({
            sObjectName: 'AppGridAg__AG_Query__c',
            jsonRecs: recsStr
         })

         if (apiResult.status !== 'success') {
            throw new Error(apiResult.errorMessage || 'Error saving query rule')
         }

         if (apiResult.results.length > 1) {
            throw new Error('Unexpected QueryBuilder error - More than 1 upsert record returned.')
         }

         let hasErrors = false;

         let ruleError = null;

         let createdId: string | null = null;

         for (const res of apiResult.results) {
            if (!res.isSuccess) {
               hasErrors = true;
               setRuleErrorMessage(res.errorMessages?.[0] || res.errors?.[0]);
            }
            if (res.isSuccess && res.recordId) {
               createdId = res.recordId;
            }
         }

         if (hasErrors) {
            setShowErrors(true);

            // notify user of save error
            enqueueSnackbar(`Error saving rule - ${ruleError}`, {
               action: action,
               variant: 'error',
            })
            return
         }

         if (!hasErrors) {
            // notify user of save success
            enqueueSnackbar('Changed saved!', {
               autoHideDuration: 3000,
               variant: 'success',
            })

            // hide error message
            setShowErrors(false);

            setRuleErrorMessage('');

            // Close the dialog first to avoid any visible flicker as store updates propagate
            setShowQueryPanel(false);

            setShowSaveAs(false);

            // Refresh query list in the background after closing
            const objQueryApiResult: SObjectQuery[] = await apiClient.getObjQueries({
               sObjectName: selectedObject!.qualifiedApiName
            })

            if (objQueryApiResult.length > 0) {
               const normalized = normalizeQueries(objQueryApiResult as any, selectedObject!.qualifiedApiName);

               // Debug: verify the stored operator on the saved record
               const savedId = saveOperation === 'saveAs' ? createdId : (selectedQuery as any)?.id ?? (selectedQuery as any)?.Id;

               const saved = (normalized as any[]).find((q) => (q.id ?? q.Id) === savedId);

               if (saved && saved.queryRule) {
                  const parsed = JSON.parse(saved.queryRule as any);

                  const op = parsed?.rules?.[0]?.operator;

                  prettyPrint('[QB] post-save verification', { savedId, operator: op, savedRule: parsed }, 'orange');
               }

               // If SaveAs and the new record isn't present due to caching, append it
               if (saveOperation === 'saveAs' && createdId && !(normalized as any).some((q: any) => (q.id ?? q.Id) === createdId)) {
                  // Append a fully-formed fallback so runQuery has a valid queryRule
                  (normalized as any).push({
                     id: createdId,
                     name: queryName,
                     sObjectApiName: selectedObject!.qualifiedApiName,
                     queryRule: queryRuleStr,
                     relationQueryRule: newQueryRec.relationQueryRule || null,
                     relationSObjectApiName: newQueryRec.relationSObjectApiName || null,
                     relationRelationshipName: newQueryRec.relationRelationshipName || null,
                  });
               }

               setQueryOptions(normalized as any)

               if (saveOperation === 'save') {
                  // find the option for the selectedQuery
                  const option = (normalized as any).find((f: any) => (f.id ?? f.Id) === (selectedQuery as any)?.id);

                  if (option) {
                     setSelectedQuery(option);
                  }
               }

               if (saveOperation === 'saveAs') {
                  // Prefer selecting by created Id; fallback to name match
                  const newQuery = (normalized as any).find((q: any) => (q.id ?? q.Id) === createdId) ||
                     (normalized as any).find((q: any) => (q.name ?? q.Name) === queryName);

                  if (newQuery) {
                     setSelectedQuery(newQuery)
                  }
               }
            } else {
               setQueryOptions([])
            }

            // Dialog already closed above
         }
      } catch (error: any) {
         enqueueSnackbar(error.message, {
            action: action,
            variant: 'error',
         })
      }
   }, [action, apiClient, convertNotToIsNot, enqueueSnackbar, relatedFieldsMetadata, selectedObjMetadata?.fields, selectedObject, selectedQuery, selectedRelation, setQueryOptions, setSelectedQuery, setShowQueryPanel])

   const handleQueryDialogCancel = () => {
      resetRuleValidity();
      setShowQueryPanel(false)
      setShowSaveAs(false)
      clearErrors()
   }

   const handleQueryDialogSaveAs = async () => {
      setShowSaveAs(true)
   }

   const handleQueryDialogClose = () => {
      resetRuleValidity();
      setShowQueryPanel(false)
   }

   const onRuleSaveAsSubmit = (data: RuleInputs) => {
      saveQueryAs('saveAs', data.ruleName)
   }

   const onRuleChange = (args: any) => {
      // Syncfusion may emit either `change` or `ruleChange` with different arg shapes
      const candidate = (args && (args.rule || args.currentRule)) || (qryBldrRef.current?.getRules?.() ?? null);

      prettyPrint('[QB] onRuleChange', { operator: candidate?.rules?.[0]?.operator, field: candidate?.rules?.[0]?.field }, 'orange');

      const rule = candidate || { condition: 'and', rules: [] };

      const validRule = validateRule(rule)
      updateMainRuleValidity(validRule);

      // Keep the latest rule in store so runQuery doesn't depend on ref timing
      setCurrentQueryRule(rule);
   }

   const onRelatedRuleChange = (args: any) => {
      const validRule = validateRule(args.rule)

      updateSubRuleValidity(validRule);
   }

   // create subQueryBuilder columns when selected relation changes
   useEffect(() => {
      const handleValueOnChange = (newValue: any, ruleID: string) => {
         // store the selected value
         const elem = document.getElementById(ruleID)!.querySelector('.e-rule-value')

         // notify QueryBuilder we have a new value for this rule
         if (elem) {
            subQryBldrRef.current!.notifyChange(newValue, elem, 'value')
         }
      }

      function referenceFieldTemplate(props: any) {
         return <QbAutocomplete
            {...props}
            apiClient={apiClient}
            qryBldrRef={subQryBldrRef}
            variant="subgrid"
         />
      }

      function createQueryColumn(field: SObjectFieldMetadata) {
         const fieldName = field.name

         const fieldLabel = field.label

         switch (field.type) {
            case 'BOOLEAN': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' }
                  ],
                  template: function ({ rule, ruleID }: QueryBuilderTemplateProps) {
                     return <Checkbox
                        // {...props}
                        checked={rule ? rule.value as boolean : false}
                        onChange={(_event: any, checked: boolean) => handleValueOnChange(checked, ruleID)}
                     />
                  },
                  type: 'boolean',
                  enableNotCondition: 'true',
               }
            }
            case 'COMBOBOX': {
               const options: any[] = []
               field.picklistValues.forEach((p: any) => {
                  const optionValue = p?.value ?? p?.name ?? null;
                  if (!optionValue) {
                     return;
                  }
                  options.push({
                     name: optionValue,
                     label: p?.label ?? optionValue,
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
                  template: (props: any) => {
                     return <QbSelect
                        {...props}
                        options={options}
                        qryBldrRef={subQryBldrRef}
                     />
                  },
                  type: 'string',
               }
            }
            case 'CURRENCY': {
               return {
                  field: fieldName,
                  // label: fieldLabel,
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                     {
                        key: 'Greater Than Or Equal',
                        value: 'greaterthanorequal',
                     },
                     { key: 'Greater Than', value: 'greaterthan' },
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                     {
                        key: 'Less Than Or Equal',
                        value: 'lessthanorequal',
                     },
                     { key: 'Less Than', value: 'lessthan' }
                  ],
                  template: (props: any) => <MuiNumberEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
                  type: 'number',
               }
            }
            case 'DATE': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  type: 'date',
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                     { key: 'Greater Than Or Equal', value: 'greaterthanorequal' },
                     { key: 'Greater Than', value: 'greaterthan' },
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                     { key: 'Less Than Or Equal', value: 'lessthanorequal' },
                     { key: 'Less Than', value: 'lessthan' }
                  ],
                  // Use date editor to produce JS Date values (ISO when stringified)
                  template: (props: any) => <QbMuiDateEditor {...props} field={field} qryBldrRef={subQryBldrRef} />,
               }
            }
            case 'DATETIME': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  type: 'date',
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                     { key: 'Greater Than Or Equal', value: 'greaterthanorequal' },
                     { key: 'Greater Than', value: 'greaterthan' },
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                     { key: 'Less Than Or Equal', value: 'lessthanorequal' },
                     { key: 'Less Than', value: 'lessthan' }
                  ],
                  // Use date editor to produce JS Date values (ISO when stringified)
                  template: (props: any) => <QbMuiDateEditor {...props} field={field} qryBldrRef={subQryBldrRef} />,
               }
            }
            case 'DECIMAL': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                     {
                        key: 'Greater Than Or Equal',
                        value: 'greaterthanorequal',
                     },
                     { key: 'Greater Than', value: 'greaterthan' },
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                     {
                        key: 'Less Than Or Equal',
                        value: 'lessthanorequal',
                     },
                     { key: 'Less Than', value: 'lessthan' }
                  ],
                  template: (props: any) => <MuiNumberEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
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
                     {
                        key: 'Greater Than Or Equal',
                        value: 'greaterthanorequal',
                     },
                     { key: 'Greater Than', value: 'greaterthan' },
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                     {
                        key: 'Less Than Or Equal',
                        value: 'lessthanorequal',
                     },
                     { key: 'Less Than', value: 'lessthan' }
                  ],
                  template: (props: any) => <MuiNumberEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
                  type: 'number',
               }
            }
            case 'EMAIL': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  type: 'string',
                  template: (props: any) => <MuiEmailEditor {...props} field={field} qryBldrRef={subQryBldrRef} />,
               }
            }
            case 'ENCRYPTEDSTRING': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  type: 'string',
                  template: (props: any) => <MuiTextEditor {...props} field={field} qryBldrRef={subQryBldrRef} />,
               }
            }
            case 'ID': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  type: 'string',
                  template: (props: any) => <MuiTextEditor {...props} field={field} qryBldrRef={subQryBldrRef} />,
               }
            }
            case 'INTEGER': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                     {
                        key: 'Greater Than Or Equal',
                        value: 'greaterthanorequal',
                     },
                     { key: 'Greater Than', value: 'greaterthan' },
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                     {
                        key: 'Less Than Or Equal',
                        value: 'lessthanorequal',
                     },
                     { key: 'Less Than', value: 'lessthan' }
                  ],
                  template: (props: any) => <MuiNumberEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
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
                     {
                        key: 'Greater Than Or Equal',
                        value: 'greaterthanorequal',
                     },
                     { key: 'Greater Than', value: 'greaterthan' },
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                     {
                        key: 'Less Than Or Equal',
                        value: 'lessthanorequal',
                     },
                     { key: 'Less Than', value: 'lessthan' }
                  ],
                  template: (props: any) => <MuiNumberEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
                  type: 'number',
               }
            }
            case 'MULTIPICKLIST': {
               const options: any[] = []
               field.picklistValues.forEach((p: any) => {
                  const optionValue = p?.value ?? p?.name ?? null;
                  if (!optionValue) {
                     return;
                  }
                  options.push({
                     name: optionValue,
                     label: p?.label ?? optionValue,
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
                  template: (props: any) => {
                     return <QbSelect
                        {...props}
                        options={options}
                        qryBldrRef={subQryBldrRef}
                     />
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
                     {
                        key: 'Greater Than Or Equal',
                        value: 'greaterthanorequal',
                     },
                     { key: 'Greater Than', value: 'greaterthan' },
                     { key: 'Between', value: 'between' },
                     { key: 'Not Between', value: 'notbetween' },
                     {
                        key: 'Less Than Or Equal',
                        value: 'lessthanorequal',
                     },
                     { key: 'Less Than', value: 'lessthan' }
                  ],
                  template: (props: any) => <MuiNumberEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
                  type: 'number',
               }
            }
            case 'PHONE': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                     { key: 'Contains', value: 'contains' },
                     { key: 'Not Contains', value: 'notcontains' },
                     { key: 'Starts With', value: 'startswith' },
                     { key: 'Ends With', value: 'endswith' }
                  ],
                  template: (props: any) => <MuiPhoneEditor {...props} field={field} qryBldrRef={subQryBldrRef} />,
                  type: 'string',
               }
            }
            case 'PICKLIST': {
               const options: any[] = []
               field.picklistValues.forEach((p: any) => {
                  const optionValue = p?.value ?? p?.name ?? null;
                  if (!optionValue) {
                     return;
                  }
                  options.push({
                     name: optionValue,
                     label: p?.label ?? optionValue,
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
                  template: (props: any) => {
                     return <QbSelect
                        {...props}
                        options={options}
                        qryBldrRef={subQryBldrRef}
                     />
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
                     { key: 'Not Equal', value: 'notequal' }
                  ],
                  template: (props: any) => referenceFieldTemplate({ ...props, fieldMetadata: field }),
                  type: 'string',
               }
            }
            case 'STRING': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                     { key: 'Contains', value: 'contains' },
                     { key: 'Not Contains', value: 'notcontains' },
                     { key: 'Starts With', value: 'startswith' },
                     { key: 'Ends With', value: 'endswith' }
                  ],
                  template: (props: any) => <MuiTextEditor {...props} field={field} qryBldrRef={subQryBldrRef} />,
                  type: 'string',
               }
            }
            case 'TEXT': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                     { key: 'Contains', value: 'contains' },
                     { key: 'Not Contains', value: 'notcontains' },
                     { key: 'Starts With', value: 'startswith' },
                     { key: 'Ends With', value: 'endswith' }
                  ],
                  template: (props: any) => <MuiTextEditor {...props} field={field} qryBldrRef={subQryBldrRef} />,
                  type: 'string',
               }
            }

            case 'URL': {
               return {
                  field: fieldName,
                  label: fieldLabel,
                  operators: [
                     { key: 'Equal', value: 'equal' },
                     { key: 'Not Equal', value: 'notequal' },
                     { key: 'Contains', value: 'contains' },
                     { key: 'Not Contains', value: 'notcontains' },
                     { key: 'Starts With', value: 'startswith' },
                     { key: 'Ends With', value: 'endswith' }
                  ],
                  template: (props: any) => <MuiTextEditor {...props} field={field} qryBldrRef={subQryBldrRef} />,
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

      function createSubQueryBuilderColumns(objMetadataFields: SObjectFieldMetadata[]) {

         const cols = []

         // only create columns for these sfdc datatypes
         const types: string[] = [
            'BOOLEAN',
            'COMBOBOX',
            'CURRENCY',
            'DATE',
            'DATETIME',
            'DECIMAL',
            'DOUBLE',
            'EMAIL',
            'ENCRYPTEDSTRING',
            'ID',
            'INTEGER',
            'LONG',
            'MULTIPICKLIST',
            'PERCENT',
            'PHONE',
            'PICKLIST',
            'REFERENCE',
            'STRING',
            'TEXTAREA',
            'URL',
         ]

         // need to use for..of so continue will work
         for (const field of objMetadataFields) {
            if (!types.includes(field.type)) {
               continue
            }

            // create the column
            const col = createQueryColumn(field)

            if (col.field !== null) {
               cols.push(col)
            }
         }

         // sort by label (case-insensitive, null-safe)
         cols.sort((a: ColumnsModel, b: ColumnsModel) =>
            (a.label || '').localeCompare(b.label || '', undefined, { sensitivity: 'base' })
         );

         return cols;

      }

      const configureRelatedQueryBldr = async () => {
         if (!selectedRelation || !selectedQuery) {
            setSubQueryBuilderColumns([]);
            setRelatedQueryRule({ condition: 'and', rules: [] });
            setRelatedFieldsMetadata([]);
            return;
         }

         try {
            const targetSObject = selectedRelation.childSObject || selectedRelation.name;
            if (!targetSObject) {
               setSubQueryBuilderColumns([]);
               setRelatedQueryRule({ condition: 'and', rules: [] });
               setRelatedFieldsMetadata([]);
               return;
            }
            const objMetadata = await apiClient.getMetadata({
               sObjectName: targetSObject,
            });
            if (!objMetadata?.fields) {
               setSubQueryBuilderColumns([]);
               setRelatedQueryRule({ condition: 'and', rules: [] });
               setRelatedFieldsMetadata([]);
               return;
            }
            const cols = createSubQueryBuilderColumns(objMetadata.fields) || [];
            setSubQueryBuilderColumns(cols);
            setRelatedFieldsMetadata(objMetadata.fields || []);
            if (selectedQuery.relationQueryRule) {
               const relatedRule = JSON.parse(decode(selectedQuery.relationQueryRule));
               setRelatedQueryRule(relatedRule || { condition: 'and', rules: [] });
            } else {
               setRelatedQueryRule({ condition: 'and', rules: [] });
            }
         } catch {
            setSubQueryBuilderColumns([]);
            setRelatedQueryRule({ condition: 'and', rules: [] });
            setRelatedFieldsMetadata([]);
         }
      };

      configureRelatedQueryBldr();
   }, [action, apiClient, enqueueSnackbar, selectedObjMetadata, selectedQuery, selectedRelation])

   // runQuery event
   useEffect(() => {
      const handleRunQuery = async () => {
         try {
            // Get current rule (defensive against null ref)
            let currentRule: any = null;
            if (qryBldrRef.current && typeof qryBldrRef.current.getRules === 'function') {
               currentRule = qryBldrRef.current.getRules();
            } else if (currentQueryRule) {
               currentRule = currentQueryRule;
            }

            if (!currentRule || !currentRule.rules || currentRule.rules.length === 0) {
               enqueueSnackbar(`Enter a rule first!`, { action: action, variant: 'warning' })
               return;
            }

            // Convert the not property to isnot
            currentRule = convertNotToIsNot(currentRule);

            // Normalize date values using current object's metadata
            const normalizedRule = normalizeDateValues(currentRule, selectedObjMetadata?.fields || []);
            const currentRuleStr = JSON.stringify(normalizedRule);

            let query: SObjectQuery;

            // Create a query object for the queryRuleModified state
            if (selectedQuery) {
               query = _.cloneDeepWith(selectedQuery);
               query.queryRule = currentRuleStr;
               query.name = 'Dynamic Query'
            } else {
               query = {
                  name: "Dynamic Query",
                  sObjectApiName: selectedObject?.qualifiedApiName || "",
                  queryRule: currentRuleStr,
               };
            }

            // Get subQuery rule
            let subQueryRule: any = { condition: 'and', rules: [] };
            if (subQryBldrRef.current && typeof subQryBldrRef.current.getRules === 'function') {
               subQueryRule = subQryBldrRef.current.getRules();
            }

            if (subQueryRule && subQueryRule.rules && subQueryRule.rules.length > 0) {
               // Convert the not property to isnot
               subQueryRule = convertNotToIsNot(subQueryRule);

               // Ensure rules exist and are non-empty
               if (subQueryRule.rules && subQueryRule.rules.length > 0) {
                  // Normalize subquery using related object's metadata
                  const normalizedSubRule = normalizeDateValues(subQueryRule, relatedFieldsMetadata);
                  const subQueryRuleStr = JSON.stringify(normalizedSubRule);
                  query.relationQueryRule = subQueryRuleStr;

                  // Extract identifiers from the relation option
                  query.relationSObjectApiName = selectedRelation?.name || "";
                  query.relationRelationshipName = selectedRelation?.relationshipName || selectedRelation?.label || selectedRelation?.name || "";
               }
            }

            setQueryRuleModified({});

            // send event to main component
            PubSub.publish('RunQuery')

            setShowQueryPanel(false);
         } catch (error: any) {
            prettyPrint('[RunQuery error]', error.message, 'red');

            enqueueSnackbar(`Error executing query - ${error.message}`, { action: action, variant: 'error' })
         }
      }

      const runQueryHandler = (msg: any) => {
         switch (msg) {
            case "RunQueryBuilderQuery":
               handleRunQuery();
               break;
            default:
               break;
         }
      };

      const runQueryToken = PubSub.subscribe("RunQueryBuilderQuery", runQueryHandler);

      return () => {
         PubSub.unsubscribe(runQueryToken);
      };
   }, [action, convertNotToIsNot, currentQueryRule, enqueueSnackbar, relatedFieldsMetadata, selectedObjMetadata?.fields, selectedObject?.qualifiedApiName, selectedQuery, selectedRelation, setLoading, setQueryRuleModified, setRunQuery, setShowQueryPanel])

   // delete query event
   useEffect(() => {
      const handleQueryDialogDelete = async () => {

         try {
            // show error message if user doesn't have delete permissions
            const deletePerm = objPermissionsMap.current.get('AppGridAg__AG_Query__c')

            if (!deletePerm) {
               throw new Error('Unexpected error: Delete permission not found in objPermissionsMap')
            }

            if (deletePerm.canDelete === false) {
               throw new Error('Delete permission not assigned for object AppGridAg__AG_Query__c')
            }

            setShowQueryDeleteDialog(true)
         } catch (error: any) {
            enqueueSnackbar(error.message, {
               action: action,
               variant: 'error',
            })
         }
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
   }, [action, enqueueSnackbar, objPermissionsMap, setShowQueryDeleteDialog]);

   // close dialog event
   useEffect(() => {
      const closeDialogHandler = (msg: any) => {
         switch (msg) {
            case "CloseQueryDialog":
               resetRuleValidity();
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
   }, [clearErrors, resetRuleValidity, setShowQueryPanel]);

   // get options for the relation selector in the subQuery
   useEffect(() => {
      const getRelationPrefs = async () => {
         try {
            if (!selectedObject || !selectedQuery) {
               return;
            }

            const options: RelationPreference[] = [];

            for (const p of relationPreferences) {
               if (!p.checked) {
                  continue
               }

               const newRelation = {
                  ...p,
                  childSObject: p.childSObject || p.name,
                  relationshipName: p.relationshipName || p.label || p.name,
               }

               options.push(newRelation)
            }

            setRelationOptions(options);

            if (selectedQuery.relationSObjectApiName) {
               const selectedRel = options.find((f: RelationPreference) => f.name === selectedQuery.relationSObjectApiName)
               if (selectedRel) {
                  setSelectedRelation(selectedRel)
               }
            }
         } catch (error: any) {
            enqueueSnackbar(`QueryBuilder - ${error.message}`, {
               action: action,
               variant: 'error',
            })
         }
      }

      getRelationPrefs();
   }, [action, apiClient, enqueueSnackbar, relationPreferences, selectedObject, selectedQuery, userInfo])

   // create queryBuilder columns
   useEffect(() => {
      // This effect prepares queryBuilderColumns.
      const metaName = selectedObjMetadata?.apiName;

      const fieldCount = Array.isArray(selectedObjMetadata?.fields) ? selectedObjMetadata!.fields.length : 0;

      prettyPrint('[QB] columns effect', { showQueryPanel, metaName, fieldCount }, 'orange');

      if (showQueryPanel && selectedObjMetadata) {
         const cols = createQueryBuilderColumns(selectedObjMetadata, qryBldrRef, apiClient) || [];

         prettyPrint('[QB] columns built', { count: cols.length }, 'orange');

         setQueryBuilderColumns(cols);
      } else {
         setQueryBuilderColumns([]);
      }
   }, [showQueryPanel, selectedObjMetadata, apiClient, qryBldrRef]); // qryBldrRef object is stable, fine as dependency.

   // save query event
   useEffect(() => {
      const handleQueryDialogSave = async () => {
         setQueryRuleModified(null)

         await saveQueryAs('save')
      }

      const saveQueryHandler = (msg: unknown) => {
         switch (msg) {
            case "SaveQuery":
               handleQueryDialogSave();
               break;
            default:
               break;
         }
      };

      const saveQueryToken = PubSub.subscribe("SaveQuery", saveQueryHandler);

      return () => {
         PubSub.unsubscribe(saveQueryToken);
      };
   }, [saveQueryAs, setQueryRuleModified]);

   // saveAs query event
   useEffect(() => {
      const saveAsQueryHandler = (msg: unknown) => {
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

   // Initialize rule validity when dialog opens or query changes
   useEffect(() => {
      if (showQueryPanel && qryBldrRef.current) {
         const currentRules = qryBldrRef.current!.getRules();

         updateMainRuleValidity(validateRule(currentRules));
      } else if (!showQueryPanel) {
         resetRuleValidity();
      }
   }, [resetRuleValidity, showQueryPanel, updateMainRuleValidity, validateRule]);

   // Hydrate date strings from Apex (UTC) back to JS Dates for the QueryBuilder UI
   const hydrateDateValuesForUI = useCallback((rule: any, fieldsMetadata: SObjectFieldMetadata[]): any => {
      if (!rule) return rule;

      const fieldTypeMap = new Map<string, string>();

      for (const f of fieldsMetadata || []) {
         if (f?.name && f?.type) fieldTypeMap.set(f.name, f.type);
      }

      const parseDateString = (s: string): { yyyy: number; mm: number; dd: number } | null => {
         const mdY = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/;

         // M/D/YYYY or MM/DD/YYYY
         const yMd = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/;

         // YYYY-MM-DD
         let m: RegExpMatchArray | null;

         if ((m = s.match(mdY))) {
            return { mm: parseInt(m[1], 10), dd: parseInt(m[2], 10), yyyy: parseInt(m[3], 10) };
         }

         if ((m = s.match(yMd))) {
            return { yyyy: parseInt(m[1], 10), mm: parseInt(m[2], 10), dd: parseInt(m[3], 10) };
         }
         return null;
      };

      const toLocalDate = (val: any, sfdcType?: string): Date | null => {
         if (!val) return null;

         if (val instanceof Date) {
            return sfdcType === 'DATE'
               ? new Date(val.getFullYear(), val.getMonth(), val.getDate())
               : new Date(val.getFullYear(), val.getMonth(), val.getDate(), val.getHours(), val.getMinutes(), val.getSeconds());
         }

         if (typeof val === 'string') {
            const s = String(val).trim();
            if (sfdcType === 'DATE') {
               const parts = parseDateString(s);
               if (parts) {
                  return new Date(parts.yyyy, parts.mm - 1, parts.dd);
               }
            }
            const d = new Date(s);
            if (!isNaN(d.getTime())) {
               if (s.endsWith('Z')) {
                  return new Date(
                     d.getUTCFullYear(),
                     d.getUTCMonth(),
                     d.getUTCDate(),
                     d.getUTCHours(),
                     d.getUTCMinutes(),
                     d.getUTCSeconds()
                  );
               }

               if (sfdcType === 'DATE') {
                  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
               }

               return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
            }
         }
         return null;
      };

      const clone = Array.isArray(rule) ? [...rule] : { ...rule };

      const walk = (node: any) => {
         if (!node) return;

         if (Array.isArray(node)) { node.forEach(walk); return; }

         if (node.rules && Array.isArray(node.rules)) { node.rules.forEach(walk); return; }

         const sfdcType = fieldTypeMap.get(node.field);

         if (node.type === 'date' || sfdcType === 'DATE' || sfdcType === 'DATETIME') {
            if (Array.isArray(node.value)) {
               node.value = node.value.map((v: any) => toLocalDate(v, sfdcType));
            } else {
               node.value = toLocalDate(node.value, sfdcType);
            }
         }
      };

      walk(clone);
      return clone;
   }, []);

   // Debug on open: show selectedQuery and metadata status
   useEffect(() => {
      if (showQueryPanel) {
         const metaName = selectedObjMetadata?.apiName;

         const fieldCount = Array.isArray(selectedObjMetadata?.fields) ? selectedObjMetadata!.fields.length : 0;

         const selId = (selectedQuery as any)?.id ?? (selectedQuery as any)?.Id ?? null;

         prettyPrint('[QB] open', { metaName, fieldCount, selectedQueryId: selId }, 'orange');
      }
   }, [showQueryPanel, selectedObjMetadata, selectedQuery]);

   // When the dialog opens and the QueryBuilder is mounted with columns, load the saved rules
   const lastAppliedQueryIdRef = useRef<string | null>(null);
   useEffect(() => {
      if (!showQueryPanel || !isQueryBuilderMounted) return;

      try {
         // Only (re)apply when the selectedQuery changes
         const selId = (selectedQuery as any)?.id ?? (selectedQuery as any)?.Id ?? null;

         if (selId && lastAppliedQueryIdRef.current === selId) return;

         // Load main query rules
         if (selectedQuery?.queryRule && qryBldrRef.current) {
            const baseRule = JSON.parse(decode(selectedQuery.queryRule));

            const hydrated = hydrateDateValuesForUI(baseRule, selectedObjMetadata?.fields || []);

            prettyPrint('[QB] hydrate main rule', hydrated, 'orange');
            qryBldrRef.current.setRules(hydrated);

            setCurrentQueryRule(hydrated);

            updateMainRuleValidity(validateRule(hydrated));
         } else {
            updateMainRuleValidity(false);
         }

         // Load sub query rules (if any)
         if (selectedQuery?.relationQueryRule && subQryBldrRef.current) {
            const subRule = JSON.parse(decode(selectedQuery.relationQueryRule));

            const hydratedSub = hydrateDateValuesForUI(subRule, relatedFieldsMetadata || []);

            prettyPrint('[QB] hydrate sub rule', hydratedSub, 'orange');

            subQryBldrRef.current.setRules(hydratedSub);

            updateSubRuleValidity(validateRule(hydratedSub));
         } else {
            updateSubRuleValidity(false);
         }

         lastAppliedQueryIdRef.current = selId;
      } catch {
         // swallow; invalid saved JSON will be handled by user edits
      }
   }, [showQueryPanel, isQueryBuilderMounted, selectedQuery, updateMainRuleValidity, updateSubRuleValidity, setCurrentQueryRule, hydrateDateValuesForUI, selectedObjMetadata?.fields, relatedFieldsMetadata, validateRule]);

   return (
      <>
         <Dialog
            fullWidth
            maxWidth="lg"
            sx={{
               '& .MuiDialog-paper': {
                  backgroundColor: theme.palette.background.paper,
                  borderColor: 'silver',
                  borderWidth: 1,
                  color: theme.palette.text.primary,
                  mt: 0,
                  // width: '60vh',
                  // height: '70vh',
                  display: 'flex',
                  flexDirection: 'column',
               },
               '& .MuiBackdrop-root': {
                  backgroundColor: 'transparent',
               },
            }}

            open={showQueryPanel}
            onClose={handleQueryDialogClose}
         >
            <AppBar
               position="static"
               sx={{
                  backgroundColor: '#1976d2',
                  color: '#FFFFFF'
               }}>
               <Toolbar variant='dense'>
                  <Typography >
                     Query Builder
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  {isTeamSharingEnabled && (((selectedQuery as any)?.id ?? (selectedQuery as any)?.Id)) && (
                     <Tooltip title="Share this query with other users">
                        <Button
                           variant="contained"
                           size="small"
                           onClick={handleShareQueryClick}
                           sx={{
                              mr: 1,
                              backgroundColor: selectedAccentColor,
                              color: 'white',
                           }}
                        >
                           Share
                        </Button>
                     </Tooltip>
                  )}
                  <IconButton
                     size="large"
                     edge="start"
                     color="inherit"
                     aria-label="menu"
                     onClick={() => {
                        handleQueryDialogCancel(); // Make sure this is defined correctly
                     }}
                  >
                     <CloseOutlinedIcon />
                  </IconButton>
               </Toolbar>
            </AppBar>

            <DialogContent
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  overflow: 'auto',
               }}>
               <Box
                  sx={{ marginTop: 2, marginBottom: 2 }}>
                  <QueryBuilderMenu
                     isRuleValid={isRuleValid} objPermissionsMap={objPermissionsMap} />
               </Box>
               <TabContext value={value}>
                  <Box sx={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                     <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList
                           onChange={handleChange}
                           sx={{
                              display: 'flex',
                              minWidth: 0,
                              '& .MuiTab-root': {
                                 flex: 1,
                                 minWidth: 0,
                              },
                           }} // Ensure the tabs are flex items
                        >
                           <Tab
                              label="Query"
                              value="1"
                              sx={{
                                 color: theme.palette.text.primary, // Default color
                                 '&.Mui-selected': {
                                    color: theme.palette.text.primary, // Color when selected
                                 },
                              }} />
                           <Tab
                              label="SubQuery"
                              value="2"
                              sx={{
                                 color: theme.palette.text.primary, // Default color
                                 '&.Mui-selected': {
                                    color: theme.palette.text.primary, // Color when selected
                                 },
                              }} />
                           {isTeamSharingEnabled && (
                              <Tab
                                 label="Shared With Me"
                                 value="3"
                                 sx={{
                                    color: theme.palette.text.primary, // Default color
                                    '&.Mui-selected': {
                                       color: theme.palette.text.primary, // Color when selected
                                    },
                                 }} />
                           )}
                        </TabList>
                     </Box>
                     <CustomTabPanel
                        value={value}
                        index="1"
                        keepMounted>
                        <Box
                           // className='border-zinc-400'
                           sx={{
                              display: 'flex',
                              marginTop: 2,
                              flexGrow: 1,
                              minHeight: 0,
                              flexDirection: 'column',
                              justifyContent: 'flex-start',
                              width: '100%',
                              minWidth: 0,
                              overflow: 'auto',
                              backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary
                           }}
                        >
                           {/* QueryBuilderComponent */}
                           <Stack
                              flexDirection="row"
                              sx={{
                                 flexFlow: 1,
                                 width: '90%',
                                 minWidth: 0,
                                 overflow: 'auto',
                              }}
                           >
                              {/* query delete confirmation dialog */}
                              {showQueryDeleteDialog && (
                                 <QueryDeleteDialog onConfirm={async () => {
                                    // Confirmed deletion handled here via useDeleteRecords
                                    await handleDeleteSelectedQuery();
                                 }} />
                              )}


                              {/* Conditional Rendering for QueryBuilderComponent */}
                              {selectedObjMetadata && queryBuilderColumns.length > 0 ? (
                                 <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <QueryBuilderComponent
                                       id="querybuilder"
                                       cssClass="appgrid-qb-fit"
                                       ref={qryBldrRef}
                                       key={selectedObject?.qualifiedApiName || 'qb-main'}
                                       columns={queryBuilderColumns}
                                       displayMode="Horizontal"
                                       fieldModel={mainFieldModel}
                                       dataSource={rowData} // Ensure rowData is used as intended or remove
                                       enableNotCondition={true}
                                       created={() => {
                                          setIsQueryBuilderMounted(true); // Signal component is mounted
                                          // Validate rules now that component is created with columns
                                          if (qryBldrRef.current) {
                                             const rule = qryBldrRef.current.getRules() || { condition: 'and', rules: [] };
                                             updateMainRuleValidity(validateRule(rule));
                                             setCurrentQueryRule(rule);
                                          }
                                       }}
                                       rule={currentQueryRule}
                                       ruleChange={onRuleChange}
                                       change={onRuleChange}
                                       sortDirection="Ascending"
                                       showButtons={{ ruleDelete: true, groupInsert: true, groupDelete: true }}
                                       width="100%"
                                    />
                                 </Box>
                              ) : (
                                 // Placeholder content while loading or if no columns
                                 <Box
                                    sx={{
                                       padding: 2,
                                       width: '800px'
                                    }}>
                                    {showQueryPanel && !selectedObjMetadata && (
                                       <Typography>Loading object metadata...</Typography>
                                    )}
                                    {showQueryPanel && selectedObjMetadata && queryBuilderColumns.length === 0 && (
                                       <Typography>No queryable fields available for this object, or still loading.</Typography>
                                    )}
                                 </Box>
                              )}

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
                                       <FormLabel id="query-display-buttons">Query Display Type</FormLabel>
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
                     </CustomTabPanel>
                     {/* related QueryBuilder */}
                     <CustomTabPanel value={value} index="2" keepMounted>
                        <Box
                           // className='border-zinc-400'
                           sx={{
                              display: 'flex',
                              flexGrow: 1,
                              minHeight: 0,
                              flexDirection: 'column',
                              justifyContent: 'flex-start',
                              width: '90%',
                              minWidth: 0,
                              overflow: 'auto',
                              backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary
                           }}
                        >
                           {/* relation selector */}
                           <Autocomplete
                              sx={{
                                 input: { color: theme.palette.text.primary },
                                 width: 250,
                                 marginTop: 2,
                                 marginBottom: 2
                              }}

                              slotProps={{
                                 clearIndicator: {
                                    style: {
                                       color: theme.palette.text.primary,
                                    }
                                 },
                                 popupIndicator: {
                                    style: {
                                       color: theme.palette.text.primary,
                                    }
                                 },
                              }}
                              options={relationOptions}
                              getOptionLabel={(option) => (option ? option.label : '')}
                              isOptionEqualToValue={(option, value) => option.name === value.name}
                              value={selectedRelation}
                              onChange={(_event, value: any) => {
                                 setSelectedRelation(value)
                              }}
                              disableClearable
                              renderInput={(params) => (
                                 <TextField
                                    {...params}
                                    label="Select relation"
                                    margin="normal"
                                    variant="standard"
                                    fullWidth
                                    sx={{
                                       '& .MuiTextField-root': {
                                          color: 'white'
                                       },
                                       '& .MuiInput-underline:before': {
                                          borderBottomColor: theme.palette.text.primary, // Set the color of the underline
                                       },
                                       '& .MuiInput-underline:hover:before': {
                                          borderBottomColor: theme.palette.text.primary, // Set the color of the underline on hover
                                       },
                                       '& .MuiInput-underline:after': {
                                          borderBottomColor: theme.palette.text.primary, // Set the color of the underline after interaction
                                       },

                                    }}
                                 />
                              )}
                           />
                           {subQueryBuilderColumns.length > 0 && relatedQueryRule.rules && (
                              <QueryBuilderComponent
                                 id="subQueryBuilder"
                                 cssClass="appgrid-qb-fit"
                                 key={JSON.stringify(relatedQueryRule)}
                                 ref={subQryBldrRef}
                                 columns={subQueryBuilderColumns}
                                 displayMode="Horizontal"
                                 fieldModel={subFieldModel}
                                 enableNotCondition={true}
                                 rule={relatedQueryRule}
                                 ruleChange={onRelatedRuleChange}
                                 change={onRelatedRuleChange}
                                 showButtons={{ ruleDelete: true, groupInsert: true, groupDelete: true }}
                                 sortDirection="Ascending"
                                 width="90%"
                              />
                           )}
                        </Box>
                     </CustomTabPanel>
                     {isTeamSharingEnabled && (
                        <CustomTabPanel value={value} index="3" keepMounted>
                           {apiClient && selectedObject?.qualifiedApiName ? (
                              <SharedQueriesTab
                                 apiClient={apiClient}
                                 sObjectName={selectedObject.qualifiedApiName}
                                 onImportQuery={handleImportQuery}
                                 onUpdateQuery={handleUpdateQuery}
                              />
                           ) : (
                              <Box
                                 sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    minHeight: 240,
                                 }}
                              >
                                 <Typography variant="body2" color="text.secondary">
                                    Select an object to view shared queries.
                                 </Typography>
                              </Box>
                           )}
                        </CustomTabPanel>
                     )}
                  </Box>
               </TabContext>
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
                              // Add label color styling
                              '& .MuiFormLabel-root': {
                                 color: theme.palette.text.primary, // Default label color
                              },
                              '& .MuiFormLabel-root.Mui-focused': {
                                 color: theme.palette.text.primary, // Label color when focused
                              },
                              '& .MuiFormLabel-root.Mui-error': {
                                 color: theme.palette.text.primary, // Label color when in error state (override default red if desired)
                              },
                           }}
                        />

                        <Button type="submit" color="primary" size="small" sx={{ paddingTop: 2 }}>
                           Submit
                        </Button>
                        {/* </Box> */}
                     </Stack>
                  </form>
                  {/* <DevTool control={control} /> */}
               </Stack>
               {/* save errors */}
               <Stack sx={{ display: showErrors ? 'block' : 'none' }} direction={'row'} justifyContent="end">
                  <TextField label="Rule name" size="small" variant="standard" value={ruleErrorMessage} />
               </Stack>
            </DialogContent>
         </Dialog>
         {isTeamSharingEnabled && apiClient && (
            <>
               <ShareQueryDialog apiClient={apiClient} />
               <ImportQueryDialog
                  apiClient={apiClient}
                  onImportSuccess={handleImportSuccess}
                  onRefreshSharedQueries={handleRefreshSharedQueries}
               />
            </>
         )}
      </>
   )
};

export default QueryBuilder;
