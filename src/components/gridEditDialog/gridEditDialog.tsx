/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GridEditDialog
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * Modal dialog component for editing Salesforce records in a form view.
 * Provides field-level editing with validation using React Hook Form and Zod.
 *
 * ARCHITECTURE:
 * - Uses React Hook Form for form state management
 * - Zod for schema-based validation
 * - Renders appropriate editor components based on field type
 *
 * KEY DEPENDENCIES:
 * - React Hook Form + Zod for form handling/validation
 * - MUI for UI components
 * - Custom editor components (MuiTextEditor, MuiDateEditor, etc.)
 *
 * USAGE:
 * <GridEditDialog
 *   apiClient={apiClient}
 *   objMetadata={metadata}
 *   selectedRow={row}
 *   onClose={handleClose}
 * />
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/*==========================================
** IMPORTS
==========================================*/
// React
import React, { RefObject, useCallback, useEffect, useRef, useState } from 'react';

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// Custom Hooks
import { useThemeState } from '../../hooks/selectors/useUIState';

// React Hook Form
import { useForm, Controller, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// MUI
import { Button, Typography, Toolbar, Dialog, AppBar, DialogContent, Box, DialogActions } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid'

// Notifications
import { useSnackbar } from 'notistack';

// PubSubJS
import PubSub from 'pubsub-js';

// Utilities
import * as _ from 'lodash-es';
import { prettyPrint } from '../../utilities/prettyPrint';

// AG Grid
import { ColumnState } from 'ag-grid-community';

// Types
import {
   SObject,
   SObjectFieldMetadata,
   SObjectFieldPermission,
   SObjectMetadata,
   TreeGridState,
} from '../../sObjectMetadataTypes';
import { CurrentState } from '../../appInterfaces/grid/gridInterfaces';
import { APIClient } from '../../brideDesignPattern/apiInterface';

// Components
import MuiAutocompleteEditor from './muiAutocompleteEditor';
import ErrorBoundary from '../errorBoundry/ErrorBoundary';
import MuiCheckboxEditor from './muiCheckboxEditor';
import MuiCurrencyEditor from './muiCurrencyEditor';
import MuiDateEditor from './muiDateEditor';
import MuiEmailEditor from './muiEmailEditor';
import MuiNumericEditor from './muiNumericEditor';
import MuiPhoneEditor from './muiPhoneEditor';
import { MuiSelectEditor } from './muiSelect';
import { MuiMultiSelectEditor } from './muiMultiSelect';
import { MuiTextAreaEditor } from './muiTextArea';
import { MuiTextEditor } from './muiTextEditor';

/*==========================================
** TYPES & INTERFACES
==========================================*/
interface GridEditDialogProps {
   apiClient: APIClient;
   currentState: CurrentState | TreeGridState;
   isTimeSeriesView: boolean;
   isSubgrid: boolean;
   objFieldPermissionsMap: React.RefObject<Map<string, SObjectFieldPermission>>;
   objMetadata: SObjectMetadata;
   objMetadataMap: React.RefObject<Map<string, SObjectMetadata>>;
   selectedRow: SObject;
   onClose: () => void;
}

export type FormValues = {
   Id?: string | null | undefined;
   OwnerId?: string | null | undefined;
   [key: string]: string | number | boolean | Date | null | undefined;
};

export interface FormFieldProps<TValue> {
   value: TValue;
   onChange: (value: TValue) => void;
   onBlur: () => void;
   error?: string;
}

export interface EditorProps<TValue> {
   apiClient: APIClient;
   field: SObjectFieldMetadata;
   fieldProps: FormFieldProps<TValue>;
   isReadOnly: boolean;
   objMetadataMap?: RefObject<Map<string, SObjectMetadata>>;
   onBlur: () => void;
   rows?: number;
   selectedRow?: SObject;
}

/*==========================================
** CONSTANTS
==========================================*/


/*==========================================
** HELPER FUNCTIONS
==========================================*/
// Dynamic Zod schema generator
const createFormSchema = (fields: SObjectFieldMetadata[], isNewRecord: boolean) => {
   const schemaObject: Record<string, z.ZodTypeAny> = {};

   fields.forEach((field) => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.type) {
         case 'BOOLEAN':
            fieldSchema = z.preprocess((val) => {
               if (typeof val === 'string') {
                  return val.toLowerCase() === 'true';
               }
               return typeof val === 'boolean' ? val : false;
            }, z.boolean({ required_error: `${field.label || field.name} is required` }));
            break;
         case 'CURRENCY':
         case 'DECIMAL':
         case 'DOUBLE':
         case 'INTEGER':
         case 'LONG':
         case 'NUMBER':
         case 'PERCENT':
            // Preprocess to handle strings, null, and numbers
            fieldSchema = z.preprocess((val) => {
               if (val === null || val === undefined || val === '') {
                  return field.isNillable ? null : 0;
               }
               const num = Number(val);
               return isNaN(num) ? (field.isNillable ? null : 0) : num;
            }, field.isNillable ? z.number().nullable() : z.number());
            break;
         case 'DATE': {
            fieldSchema = z.preprocess((val) => {
               if (val === '' || val === 'null' || val === 'NULL' || val === undefined) return null;
               if (val instanceof Date) return val;
               if (typeof val === 'string' && val) {
                  const d = new Date(val);
                  return isNaN(d.getTime()) ? null : d;
               }
               return null;
            }, z.union([z.date(), z.null()]));
            break;
         }
         case 'DATETIME': {
            fieldSchema = z.preprocess((val) => {
               if (val === '' || val === 'null' || val === 'NULL' || val === undefined) return null;
               if (val instanceof Date) return val;
               if (typeof val === 'string' && val) {
                  const d = new Date(val);
                  return isNaN(d.getTime()) ? null : d;
               }
               return null;
            }, z.union([z.date(), z.null()]));
            break;
         }
         case 'EMAIL':
            fieldSchema = z
               .string()
               .nullable()
               .refine((val) => !val || /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(val), {
                  message: 'Please enter a valid email address',
               });
            break;
         case 'PHONE':
            fieldSchema = z.preprocess((val) => {
               if (val === '' || val === 'null' || val === 'NULL') return null;
               return val;
            }, z.union([
               z.string().refine((v) => /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/.test(v || ''), {
                  message: 'Please enter a valid phone number',
               }),
               z.null(),
            ]));
            break;
         case 'REFERENCE': {
            // Accept null or empty as "not selected"; when provided, must be 15 or 18-char Id
            const idRegex = /^[A-Za-z0-9]{15}([A-Za-z0-9]{3})?$/;
            fieldSchema = z.preprocess(
               (val) => {
                  if (val === '' || val === 'null' || val === 'NULL') return null;
                  return val;
               },
               z.union([
                  z.string().refine((v) => idRegex.test(v), {
                     message: 'Please select a valid record',
                  }),
                  z.null(),
               ])
            );
            break;
         }
         default:
            fieldSchema = z.string().nullable();
            break;
      }

      const isEditable =
         field.isAccessible &&
         (isNewRecord ? field.isCreateable : field.isUpdateable) &&
         !field.isCalculated &&
         !field.isAutoNumber;
      // Only enforce required client-side for non-reference fields.
      // Reference lookups can be left empty in this dialog and validated server-side.
      // Do not treat PHONE as required client-side even if non-nillable in metadata
      if (!field.isNillable && isEditable && !field.defaultValue && field.type !== 'REFERENCE' && field.type !== 'PHONE') {
         if (field.type === 'BOOLEAN') {
            fieldSchema = z.boolean({ required_error: `${field.label || field.name} is required` });
         } else if (['CURRENCY', 'DECIMAL', 'DOUBLE', 'INTEGER', 'LONG', 'PERCENT'].includes(field.type)) {
            fieldSchema = z.preprocess((val) => {
               if (val === null || val === undefined || val === '') {
                  return 0;
               }
               const num = Number(val);
               return isNaN(num) ? 0 : num;
            }, z.number({ required_error: `${field.label || field.name} is required` }));
         } else if (['DATE', 'DATETIME'].includes(field.type)) {
            fieldSchema = z.date({ required_error: `${field.label || field.name} is required` });
         } else {
            fieldSchema = z
               .string({ required_error: `${field.label || field.name} is required` })
               .min(1, `${field.label || field.name} is required`);
         }
      }

      schemaObject[field.name] = fieldSchema;
   });

   return z.object(schemaObject);
};

/*==========================================
** COMPONENT
==========================================*/
const GridEditDialog = ({
   apiClient,
   currentState,
   isTimeSeriesView,
   isSubgrid,
   objFieldPermissionsMap,
   objMetadataMap,
   objMetadata,
   selectedRow,
   onClose,
}: GridEditDialogProps) => {

   /*==========================================
   ** CONTEXT
   ==========================================*/
   const theme = useTheme();

   /*==========================================
   ** CUSTOM HOOKS
   ==========================================*/
   const { enqueueSnackbar, closeSnackbar } = useSnackbar();

   // Theme state from domain hook
   const { selectedAccentColor } = useThemeState();

   /*==========================================
   ** CALLBACKS
   ==========================================*/
   const action = useCallback(
      (snackbarId: any) => (
         <>
            <button onClick={() => closeSnackbar(snackbarId)}>Dismiss</button>
         </>
      ),
      [closeSnackbar]
   );

   /*==========================================
   ** GLOBAL STATE (Zustand)
   ==========================================*/
   const { gridEditDialogState, selectedGridType, setQueryRuleModified, treeGridPreferences } = useStore(useShallow((state) => ({
      gridEditDialogState: state.gridEditDialogState,
      selectedGridType: state.selectedGridType,
      setQueryRuleModified: state.setQueryRuleModified,
      treeGridPreferences: state.treeGridPreferences,
   })));

   /*==========================================
   ** REFS
   ==========================================*/
   const hideCloneButton = useRef(true);
   const isCloneOperation = useRef(false);

   /*==========================================
   ** LOCAL STATE
   ==========================================*/
   const [defaultValues, setDefaultValues] = useState<FormValues>({});
   const [errorMessage, setErrorMessage] = useState('');
   const [formFields, setFormFields] = useState<SObjectFieldMetadata[]>([]);

   const [showErrors, setShowErrors] = useState(false);

   const [isSubmitting, setIsSubmitting] = useState(false);

   const isNewRecord = selectedRow.Id?.startsWith('000000') || isCloneOperation.current;

   /*==========================================
   ** DERIVED STATE / MEMOIZED VALUES
   ==========================================*/
   // Recompute resolver when fields or mode (new vs existing) change
   const resolver = React.useMemo(() => zodResolver(createFormSchema(formFields, isNewRecord)), [formFields, isNewRecord]);

   const form = useForm<FormValues>({
      resolver,
      defaultValues,
      mode: 'onSubmit',
      shouldUnregister: false,
   });

   const { handleSubmit, reset, clearErrors, trigger } = form;

   /*==========================================
   ** EVENT HANDLERS
   ==========================================*/
   const onInvalid = useCallback((errors: any) => {
      prettyPrint('[onInvalid] - errors are', Object.keys(errors), 'red')

      // Clear any prior form-level error banner
      setShowErrors(false);

      enqueueSnackbar('Please fix the highlighted errors before saving.', { action, variant: 'error' });

      setShowErrors(true);
   }, [enqueueSnackbar, action]);

   /*==========================================
   ** EFFECTS
   ==========================================*/
   useEffect(() => {
      prettyPrint('[GridEditDialog] opening dialog', {
         isSubgrid,
         isNewRecord,
         sObject: objMetadata?.apiName,
         selectedRow,
      }, 'purple');
   }, [isSubgrid, isNewRecord, objMetadata?.apiName, selectedRow]);

   useEffect(() => {
      function getFieldDefaultValue(field: SObjectFieldMetadata): string | number | boolean | Date | null {
         if (field.defaultValue !== undefined && field.defaultValue !== null) {
            return field.defaultValue;
         }

         if (field.name === 'Id' || field.name === 'OwnerId') {
            return null;
         }

         switch (field.type.toUpperCase()) {
            case 'BOOLEAN':
               return false; // Booleans always default to false
            case 'STRING':
            case 'TEXT':
            case 'TEXTAREA':
            case 'PHONE':
            case 'EMAIL':
            case 'URL':
            case 'REFERENCE':
               return null; // References default to null (no selection)
            case 'PICKLIST':
            case 'MULTIPICKLIST':
            case 'COMBOBOX':
            case 'ID':
               return ''; // Always return empty string for string fields
            case 'DECIMAL':
            case 'DOUBLE':
            case 'INTEGER':
            case 'LONG':
            case 'CURRENCY':
            case 'PERCENT':
               return field.isNillable ? null : 0; // Respect nillable for numerics
            case 'CHECKBOX':
               return field.isNillable ? null : false;
            case 'DATE':
            case 'DATETIME':
               return field.isNillable ? null : new Date();
            default:
               console.warn(`No default value defined for field type: ${field.type}`);
               return field.isNillable ? null : null;
         }
      }

      if (!objMetadata || !selectedRow || (!isTimeSeriesView && !currentState?.columnState)) return;

      // Normalize selectedRow to include all fields from objMetadata
      const normalizedSelectedRow: SObject = { ...selectedRow };

      for (const field of objMetadata.fields) {
         if (!(field.name in normalizedSelectedRow)) {
            normalizedSelectedRow[field.name] = null; // Ensure missing fields are null
         }
      }

      // Extra sanitation: convert any lingering string 'null' values to actual nulls,
      // but keep seeded relationship objects when they exist (to preserve default lookups)
      for (const key of Object.keys(normalizedSelectedRow)) {
         const val = (normalizedSelectedRow as any)[key];

         if (val === 'null' || val === 'NULL') {
            (normalizedSelectedRow as any)[key] = null;
         }
      }
      const keepRelation = (fieldName: string) => {
         if (!objMetadata?.fields) return false;

         const meta = objMetadata.fields.find((f) => f.name === fieldName);

         return meta?.type === 'REFERENCE';
      };
      for (const key of Object.keys(normalizedSelectedRow)) {
         const value = (normalizedSelectedRow as any)[key];

         if (value && typeof value === 'object' && !Array.isArray(value)) {
            const maybeRelation = objMetadata?.fields.find((f) => f.relationshipName === key);

            if (maybeRelation?.type === 'REFERENCE') {
               continue;
            }

            if (keepRelation(key)) {
               continue;
            }
         }
      }

      let nameField = '';

      for (const el of objMetadata.fields) {
         if (el.isNameField) {
            nameField = el.name;
            break;
         }
      }

      const requiredCols: SObjectFieldMetadata[] = objMetadata.fields
         .filter(
            (f: SObjectFieldMetadata) =>
               f.isAccessible &&
               !f.isCalculated &&
               !f.isNillable &&
               f.isCreateable &&
               !f.isDefaultedOnCreate &&
               !(isNewRecord && (f.name === 'OwnerId' || f.name === 'Id')) &&
               f.name !== nameField &&
               f.name !== 'IsDeleted'
         )
         .map((f: SObjectFieldMetadata) => f);

      if (selectedGridType.name === 'treeGrid' && treeGridPreferences?.AppGridAg__Parent_Lookup_Field__c) {
         const parentLookupCol = objMetadata.fields.find(
            (f: SObjectFieldMetadata) => f.name === ((treeGridPreferences as any).AppGridAg__Parent_Lookup_Field__c as string)
         );

         if (parentLookupCol && parentLookupCol.name !== 'IsDeleted') requiredCols.push(parentLookupCol);
      }

      const nameCol = objMetadata.fields.find((f: SObjectFieldMetadata) => f.name === nameField);

      if (nameCol && !nameCol.isAutoNumber) requiredCols.push(nameCol);

      const idField = objMetadata.fields.find((f: SObjectFieldMetadata) => f.name === 'Id');

      if (idField && !isNewRecord) requiredCols.push(idField);

      let visibleCols;

      if (isTimeSeriesView) {
         const fieldNames = objMetadata.fields.map((f) => f.name);

         visibleCols = Object.keys(normalizedSelectedRow)
            .filter((key) => fieldNames.includes(key))
            .map((key) => ({
               colId: key,
               hide: false,
            }));
      } else {
         visibleCols = currentState?.columnState?.filter(
            (col: ColumnState) =>
               !col.hide &&
               col.colId !== 'ag-Grid-SelectionColumn' &&
               !col.colId.includes('AutoColumn') &&
               col.colId !== 'error'
         );
      }

      const requiredColState = requiredCols.map((fieldMetadata) => ({
         colId: fieldMetadata.name,
         hide: false,
      }));

      // filter out fields
      let allVisibleCols = [
         ...requiredColState.filter(
            (requiredCol) =>
               !visibleCols!.some((visibleCol: ColumnState) => visibleCol.colId === requiredCol.colId) &&
               !(isNewRecord && (requiredCol.colId === 'OwnerId' || requiredCol.colId === 'Id'))
         ),
         ...visibleCols!.filter((col: ColumnState) =>
            !(isNewRecord &&
               (col.colId === 'OwnerId' || col.colId === 'Id'))),
      ];

      allVisibleCols = allVisibleCols.filter((f) => f.colId !== 'AppGridAg__Resources__c')

      const columnOrderMap = new Map<string, number>();

      allVisibleCols.forEach((col: ColumnState, index: number) => {
         columnOrderMap.set(col.colId, index);
      });

      const columnSet = new Set(allVisibleCols.map((col: ColumnState) => col.colId));

      // filter objMetadataFields by all visible columns
      const fields = objMetadata.fields
         .filter((field) => {
            if (field.name === 'IsDeleted') {
               return false;
            }

            if (isNewRecord && field.name === 'OwnerId') return false;

            const isInColumnSet = columnSet.has(field.name) || field.name === 'Id';

            // filter out non updatable date fields
            if (
               !field.isUpdateable &&
               (field.type.toUpperCase() === 'DATETIME' || field.type.toUpperCase() === 'DATE') &&
               (normalizedSelectedRow[field.name] === null ||
                  normalizedSelectedRow[field.name] === undefined ||
                  normalizedSelectedRow[field.name] === 'null' ||
                  normalizedSelectedRow[field.name] === 'NULL')
            ) {
               return false;
            }

            if (isNewRecord) {
               return (
                  isInColumnSet &&
                  field.isAccessible &&
                  field.isCreateable &&
                  !field.isCalculated &&
                  !field.isAutoNumber
               );
            }

            return (
               (isInColumnSet &&
                  field.isAccessible &&
                  (field.isUpdateable || field.name === 'Id'))
            );
         })
         .sort((a, b) => {
            if (a.name === 'Id') return -1;
            if (b.name === 'Id') return 1;
            if (a.name === nameField) return -1;
            if (b.name === nameField) return 1;
            const aIndex = columnOrderMap.get(a.name) ?? Number.MAX_SAFE_INTEGER;
            const bIndex = columnOrderMap.get(b.name) ?? Number.MAX_SAFE_INTEGER;
            return aIndex - bIndex;
         });

      setFormFields(fields);

      const stringFieldTypes = new Set([
         'STRING',
         'TEXT',
         'TEXTAREA',
         'PHONE',
         'EMAIL',
         'URL',
         'REFERENCE',
         'PICKLIST',
         'MULTIPICKLIST',
         'COMBOBOX',
         'ID'
      ]);

      const defaults: FormValues = Object.fromEntries(
         fields.map((field) => {
            const isNewRecord = !selectedRow || selectedRow.Id?.startsWith('000000');

            let value: string | number | boolean | Date | null;

            if (!isNewRecord) {
               // Sanitize raw values upfront: turn 'null'/'NULL' into actual null
               const rawUnclean = normalizedSelectedRow[field.name] as any;

               const rawValue = (rawUnclean === 'null' || rawUnclean === 'NULL') ? null : rawUnclean;

               if (rawValue === null || rawValue === undefined || rawValue === 'null' || rawValue === 'NULL') {
                  value = getFieldDefaultValue(field);
               } else {
                  switch (field.type.toUpperCase()) {
                     case 'REFERENCE': {
                        const relationName = field.relationshipName;

                        const relationObj = relationName ? (selectedRow as any)?.[relationName] : null;

                        const seededId =
                           (rawValue && rawValue !== 'null' && rawValue !== 'NULL' ? rawValue : null) ||
                           ((selectedRow as any)?.[field.name] ?? null) ||
                           (relationObj?.Id ?? null);

                        value = seededId;

                        if (process.env.NODE_ENV !== 'production') {
                           prettyPrint('[GridEditDialog] reference default resolved', {
                              field: field.name,
                              rawValue,
                              fallbackFieldValue: (selectedRow as any)?.[field.name],
                              relationObj,
                              finalValue: value,
                           }, 'purple');
                        }
                        break;
                     }
                     case 'BOOLEAN':
                        value = typeof rawValue === 'boolean' ? rawValue : rawValue === 'true';

                        break;
                     case 'CHECKBOX':
                        value = typeof rawValue === 'boolean' ? rawValue : getFieldDefaultValue(field);

                        break;
                     case 'DECIMAL':
                     case 'DOUBLE':
                     case 'INTEGER':
                     case 'LONG':
                     case 'CURRENCY':
                     case 'PERCENT': {
                        if (rawValue === null || rawValue === '' || rawValue === undefined) {
                           value = getFieldDefaultValue(field);
                        } else {
                           const numValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);

                           value = isNaN(numValue as number) ? getFieldDefaultValue(field) : (numValue as number);
                        }
                        break;
                     }
                     case 'DATE':
                     case 'DATETIME':
                        value = rawValue instanceof Date ? rawValue : getFieldDefaultValue(field);
                        break;
                     default:
                        // Handle string-like fields
                        if (stringFieldTypes.has(field.type.toUpperCase())) {
                           value = typeof rawValue === 'string' && rawValue !== 'null' && rawValue !== 'NULL' ? rawValue : '';
                        } else {
                           value = getFieldDefaultValue(field);
                        }
                        break;
                  }
               }
            } else {
               value = getFieldDefaultValue(field);
            }

            return [field.name, value];
         })
      );

      setDefaultValues(defaults);

      reset(defaults);
   }, [
      currentState,
      isTimeSeriesView,
      selectedGridType.name,
      objMetadata,
      selectedRow,
      treeGridPreferences,
      objFieldPermissionsMap,
      isNewRecord,
      reset,
   ]);

   const debouncedSubmit = _.debounce(async (formValues: FormValues) => {
      if (isSubmitting) {
         return;
      }

      setIsSubmitting(true);

      try {
         // Treat clone as create by stripping identifiers even if the dialog didn't rerender
         const treatAsNew = isCloneOperation.current || (selectedRow?.Id?.startsWith?.('000000') ?? false);

         if (treatAsNew) {
            delete formValues.Id;
            delete formValues.OwnerId;
         }

         {
            const normalizedFormValues = { ...formValues };

            const omittedPicklists: Array<{
               field: string; reason: string; value: any;
               isNillable: boolean; type: string
            }> = [];

            for (const [key, value] of Object.entries(normalizedFormValues)) {
               const fieldMetadata = objMetadata!.fields.find((f: { name: string }) => f.name === key);

               if (!fieldMetadata) {
                  delete normalizedFormValues[key];
                  continue;
               }

               if (
                  key !== 'Id' &&
                  ((treatAsNew && !fieldMetadata.isCreateable) ||
                     (!treatAsNew && (!fieldMetadata.isUpdateable || fieldMetadata.isCalculated || fieldMetadata.isAutoNumber)))
               ) {
                  delete normalizedFormValues[key];

                  continue;
               }

               const fieldDataType = fieldMetadata.type;

               if (fieldDataType === 'DATE' && value instanceof Date) {
                  const utcDate = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));

                  normalizedFormValues[key] = utcDate.toISOString().split('T')[0];
               } else if (fieldDataType === 'DATETIME' && value instanceof Date) {
                  const utcDate = new Date(
                     Date.UTC(
                        value.getFullYear(),
                        value.getMonth(),
                        value.getDate(),
                        value.getHours(),
                        value.getMinutes(),
                        value.getSeconds()
                     )
                  );

                  normalizedFormValues[key] = utcDate;
               } else if (
                  (
                     ['PICKLIST', 'MULTIPICKLIST', 'COMBOBOX'].includes(fieldDataType) ||
                     (Array.isArray((fieldMetadata as any)?.picklistValues) && (fieldMetadata as any).picklistValues.length > 0)
                  )
               ) {
                  // For picklist-like fields: if metadata says nillable and the value is empty/blank,
                  // omit the field from payload to avoid sending null to restricted picklists.
                  const emptyLike = value === undefined || value === null || value === '' || value === 'null' || value === 'NULL';

                  if (fieldMetadata.isNillable && emptyLike) {
                     omittedPicklists.push({
                        field: key,
                        reason: 'empty picklist omitted',
                        value,
                        isNillable: !!fieldMetadata.isNillable,
                        type: String(fieldDataType),
                     });
                     delete normalizedFormValues[key];
                  }
               } else {
                  // Normalize string-like fields: convert literal 'null'/'NULL' to null or empty string based on nillability
                  const stringLike = new Set(['STRING', 'TEXT', 'TEXTAREA', 'PHONE', 'EMAIL', 'URL', 'ID']);

                  if (stringLike.has(fieldDataType)) {
                     if (value === 'null' || value === 'NULL') {
                        (normalizedFormValues as any)[key] = fieldMetadata.isNillable ? null : '';
                     }
                  }
               }
            }

            const recsToUpsert = [normalizedFormValues];

            isCloneOperation.current = false;

            const recsStr = JSON.stringify(recsToUpsert);

            const result = await apiClient.upsertRecs({
               sObjectName: objMetadata!.sobjectType,
               jsonRecs: recsStr,
            });

            prettyPrint('[gridEditDialog] upsertRecs result:', result, 'blue');

            if (result.status !== 'success') {
               enqueueSnackbar(result.errorMessage || 'Error saving record', {
                  action,
                  variant: 'error',
               });
               return;
            }

            if (result.results.length > 1) {
               enqueueSnackbar('Error - more than 1 upsert record returned. Please contact your administrator.', {
                  action,
                  variant: 'error',
               });
               return;
            }

            if (result.results.length === 1) {
               // Normalize possible API shapes for robust success/error handling
               const res: any = result.results[0] as any;

               const ok = (res?.isSuccess ?? res?.success ?? res?.status) === true;

               const firstError = Array.isArray(res?.errors) && res.errors.length
                  ? res.errors[0]
                  : (Array.isArray(res?.errorMessages) && res.errorMessages.length ? res.errorMessages[0] : (res?.errorMessage || null));

               if (!ok) {
                  setShowErrors(true);

                  const errorMsg = firstError || 'Unknown server error';

                  setErrorMessage(errorMsg);

                  enqueueSnackbar(`Server error: ${errorMsg}`, { action, variant: 'error' });
               } else {
                  enqueueSnackbar('Changes saved!', { autoHideDuration: 3000, variant: 'success' });

                  setShowErrors(false);

                  setErrorMessage('');

                  if (isSubgrid) {
                     onClose();

                     PubSub.publish('RefreshSubgridQuery');
                  } else {
                     console.log('>>> gridEditDialog refreshing query');
                     // Clone to ensure Zustand sees a new reference on repeated inserts
                     // Trigger query refresh
                     setQueryRuleModified({});

                     PubSub.publish('RunQuery');
                     onClose();
                  }
               }
            } else {
               enqueueSnackbar('Error - no records upserted. Please try again.', { action, variant: 'error' });
            }
         }
      } catch (error: any) {
         enqueueSnackbar(`Error saving changes - ${error.message}`, { action, variant: 'error' });
      } finally {
         setIsSubmitting(false);
      }
   }, 100);

   const onSubmit = (data: FormValues) => {
      debouncedSubmit(data);
   };

   /*==========================================
   ** RENDER HELPERS
   ==========================================*/
   const renderFieldComponent = (
      field: SObjectFieldMetadata,
      fieldProps: FormFieldProps<string | number | boolean | Date | null>,
      isReadOnly: boolean,
      apiClient: APIClient,
      selectedRow?: SObject,
      objMetadataMap?: RefObject<Map<string, SObjectMetadata>>,
      rows?: number
   ) => {
      switch (field.type) {
         case 'BOOLEAN': {
            const editorProps: EditorProps<boolean | null> = {
               field,
               fieldProps: fieldProps as FormFieldProps<boolean | null>,
               isReadOnly,
               onBlur: fieldProps.onBlur,
               apiClient,
               selectedRow,
               objMetadataMap,
               rows,
            };
            return (
               <ErrorBoundary>
                  <MuiCheckboxEditor {...editorProps} />
               </ErrorBoundary>
            );
         }
         case 'COMBOBOX':
         case 'PICKLIST': {
            const editorProps: EditorProps<string | null> = {
               field,
               fieldProps: fieldProps as FormFieldProps<string | null>,
               isReadOnly,
               onBlur: fieldProps.onBlur,
               apiClient,
               selectedRow,
               objMetadataMap,
               rows,
            };
            return (
               <ErrorBoundary>
                  <MuiSelectEditor {...editorProps} />
               </ErrorBoundary>
            );
         }
         case 'MULTIPICKLIST': {
            const editorProps: EditorProps<string | null> = {
               field,
               fieldProps: fieldProps as FormFieldProps<string | null>,
               isReadOnly,
               onBlur: fieldProps.onBlur,
               apiClient,
               selectedRow,
               objMetadataMap,
               rows,
            };
            return (
               <ErrorBoundary>
                  <MuiMultiSelectEditor {...editorProps} />
               </ErrorBoundary>
            );
         }
         case 'CURRENCY': {
            const editorProps: EditorProps<number | null> = {
               field,
               fieldProps: fieldProps as FormFieldProps<number | null>,
               isReadOnly,
               onBlur: fieldProps.onBlur,
               apiClient,
               selectedRow,
               objMetadataMap,
               rows,
            };
            return (
               <ErrorBoundary>
                  <MuiCurrencyEditor {...editorProps} />
               </ErrorBoundary>
            );
         }
         case 'DATE':
         case 'DATETIME': {
            const editorProps: EditorProps<Date | null> = {
               field,
               fieldProps: fieldProps as FormFieldProps<Date | null>,
               isReadOnly,
               onBlur: fieldProps.onBlur,
               apiClient,
               selectedRow,
               objMetadataMap,
               rows,
            };
            return (
               <ErrorBoundary>
                  <MuiDateEditor {...editorProps} />
               </ErrorBoundary>
            );
         }
         case 'DECIMAL':
         case 'DOUBLE':
         case 'INTEGER':
         case 'LONG':
         case 'PERCENT': {
            const editorProps: EditorProps<number | null> = {
               field,
               fieldProps: fieldProps as FormFieldProps<number | null>,
               isReadOnly,
               onBlur: fieldProps.onBlur,
               apiClient,
               selectedRow,
               objMetadataMap,
               rows,
            };
            return (
               <ErrorBoundary>
                  <MuiNumericEditor {...editorProps} />
               </ErrorBoundary>
            );
         }
         case 'EMAIL': {
            const editorProps: EditorProps<string | null> = {
               field,
               fieldProps: fieldProps as FormFieldProps<string | null>,
               isReadOnly,
               onBlur: fieldProps.onBlur,
               apiClient,
               selectedRow,
               objMetadataMap,
               rows,
            };
            return (
               <ErrorBoundary>
                  <MuiEmailEditor {...editorProps} />
               </ErrorBoundary>
            );
         }
         case 'PHONE': {
            const editorProps: EditorProps<string | null> = {
               field,
               fieldProps: fieldProps as FormFieldProps<string | null>,
               isReadOnly,
               onBlur: fieldProps.onBlur,
               apiClient,
               selectedRow,
               objMetadataMap,
               rows,
            };
            return (
               <ErrorBoundary>
                  <MuiPhoneEditor {...editorProps} />
               </ErrorBoundary>
            );
         }
         case 'REFERENCE': {
            const editorProps: EditorProps<string | null> = {
               field,
               fieldProps: fieldProps as FormFieldProps<string | null>,
               isReadOnly,
               onBlur: fieldProps.onBlur,
               apiClient,
               selectedRow,
               objMetadataMap,
               rows,
            };
            return (
               <ErrorBoundary>
                  <MuiAutocompleteEditor {...editorProps} />
               </ErrorBoundary>
            );
         }
         case 'ID':
         case 'TEXT': {
            const editorProps: EditorProps<string | null> = {
               field,
               fieldProps: fieldProps as FormFieldProps<string | null>,
               isReadOnly,
               onBlur: fieldProps.onBlur,
               apiClient,
               selectedRow,
               objMetadataMap,
               rows,
            };
            return (
               <ErrorBoundary>
                  <MuiTextEditor {...editorProps} />
               </ErrorBoundary>
            );
         }
         case 'TEXTAREA':
         case 'ADDRESS': {
            const editorProps: EditorProps<string | null> = {
               field,
               fieldProps: fieldProps as FormFieldProps<string | null>,
               isReadOnly,
               onBlur: fieldProps.onBlur,
               apiClient,
               selectedRow,
               objMetadataMap,
               rows: rows ?? 4,
            };
            return (
               <ErrorBoundary>
                  <MuiTextAreaEditor {...editorProps} />
               </ErrorBoundary>
            );
         }
         default: {
            const editorProps: EditorProps<string | null> = {
               field,
               fieldProps: fieldProps as FormFieldProps<string | null>,
               isReadOnly,
               onBlur: fieldProps.onBlur,
               apiClient,
               selectedRow,
               objMetadataMap,
               rows,
            };
            return (
               <ErrorBoundary>
                  <MuiTextEditor {...editorProps} />
               </ErrorBoundary>
            );
         }
      }
   };

   const renderField = (
      field: SObjectFieldMetadata,
      apiClient: APIClient,
      selectedRow: SObject,
      objMetadataMap: RefObject<Map<string, SObjectMetadata>>,
      isNewRecord: boolean,
      form: UseFormReturn<FormValues>
   ) => {
      const isReadOnly =
         !field.isAccessible ||
         (isNewRecord ? !field.isCreateable : !field.isUpdateable) ||
         field.isCalculated ||
         field.isAutoNumber;

      // Determine required fields for UI indicator (asterisk). Mirror client-side schema:
      // - must be editable in this context
      // - non-nillable
      // - no default value prefilled
      // - exclude REFERENCE types (server-side validation/pattern only)
      // Asterisk should reflect server rules: only when field is non‑nillable
      const isRequired = !field.isNillable;

      // Clone field to append a visual required marker to the label only
      const uiField: SObjectFieldMetadata = isRequired
         ? { ...(field as any), label: `${field.label || field.name} *` }
         : field;

      const stringFieldTypes = new Set([
         'STRING',
         'TEXT',
         'TEXTAREA',
         'PHONE',
         'EMAIL',
         'URL',
         'REFERENCE',
         'PICKLIST',
         'MULTIPICKLIST',
         'COMBOBOX',
         'ID'
      ]);

      return (
         <Controller
            name={field.name}
            control={form.control}
            render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => {
               let normalizedValue;

               const fType = field.type.toUpperCase();

               if (fType === 'REFERENCE') {
                  // For lookups, keep null as null (Autocomplete expects empty as null/undefined)
                  // Treat empty string as null as well
                  normalizedValue = (value === undefined || value === '' || value === 'null' || value === 'NULL') ? null : value;
               } else if ([
                  'DECIMAL', 'DOUBLE', 'INTEGER', 'LONG', 'CURRENCY', 'PERCENT'
               ].includes(fType)) {
                  // Numeric types: convert 'null'/'NULL'/'' to null; coerce numeric strings to numbers
                  if (value === undefined || value === null || value === '' || value === 'null' || value === 'NULL') {
                     normalizedValue = null;
                  } else {
                     normalizedValue = (typeof value === 'number') ? value : Number(value as any);

                     if (isNaN(normalizedValue as number)) normalizedValue = null;
                  }
               } else if (stringFieldTypes.has(fType)) {
                  // String-like fields: use empty string for empty
                  normalizedValue = (value === null || value === 'null' || value === 'NULL') ? '' : (value ?? '');
               } else {
                  // Non-string fields: normalize undefined to null
                  normalizedValue = value === undefined ? null : value;
               }

               const fieldProps: FormFieldProps<string | number | boolean | Date | null> = {
                  value: normalizedValue,
                  onChange,
                  onBlur,
                  error: error?.message,
               };

               return (
                  <>
                     {renderFieldComponent(uiField, fieldProps, isReadOnly, apiClient, selectedRow, objMetadataMap)}
                  </>
               );
            }}
         />
      );
   };

   /*==========================================
   ** RENDER
   ==========================================*/
   return (
      <Dialog
         data-name="gridEditDialogBox"
         fullWidth
         maxWidth="md"
         open={gridEditDialogState.show}
         onClose={(event, reason) => {
            if (reason !== 'backdropClick') {
               onClose();
            }
         }}
         sx={{
            // Let MUI center the dialog (no transforms) and size the paper
            '& .MuiDialog-paper': {
               backgroundColor: theme.palette.background.paper,
               borderColor: 'silver',
               borderWidth: 1,
               color: theme.palette.text.primary,
               height: '70vh',
               maxWidth: 960,
               width: '60vw',
            },
            '& .MuiBackdrop-root': {
               backgroundColor: 'transparent',
            },
         }}
      >
         <AppBar
            position="static"
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               borderColor: selectedAccentColor,
               borderWidth: 1,
            }}
         >
            <Toolbar variant="dense">
               <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Edit Record
               </Typography>
            </Toolbar>
         </AppBar>
         <DialogContent
            data-name="gridEditDialogContent"
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               overflow: 'auto',
            }}
         >
            <Box
               data-name="gridEditDialogContentBox"
               sx={{
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  mt: 0,
                  ml: 0,
                  mr: 0,
                  mb: 0,
                  overflow: 'auto',
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
               }}
               border={2}
               borderColor={theme.palette.text.primary}
               padding={2}
            >
               {showErrors && (
                  <Box
                     sx={{
                        color: theme.palette.error.main,
                        fontWeight: 'bold',
                        marginBottom: 2,
                     }}
                  >
                     <p>{errorMessage}</p>
                  </Box>
               )}

               <div>
                  <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
                     <Grid container spacing={2}>
                        {formFields.map((item) => (
                           <Grid size={6} key={item.name}>
                              {renderField(item, apiClient, selectedRow, objMetadataMap, isNewRecord, form)}
                           </Grid>
                        ))}
                     </Grid>
                  </form>
               </div>
            </Box>
         </DialogContent>
         <DialogActions>
            {!isNewRecord && (
               <Button
                  sx={{ display: hideCloneButton.current ? 'block' : 'inline' }}
                  onClick={() => {
                     isCloneOperation.current = true;
                     clearErrors();
                     trigger()
                        .then(() => handleSubmit(onSubmit, onInvalid)())
                        .catch(() => handleSubmit(onSubmit, onInvalid)());
                  }}
               >
                  Clone
               </Button>
            )}
            <Button onClick={() => { clearErrors(); trigger().then(() => handleSubmit(onSubmit, onInvalid)()).catch(() => handleSubmit(onSubmit, onInvalid)()); }}>Save</Button>
            <Button onClick={onClose}>Cancel</Button>
         </DialogActions>
      </Dialog>
   );
};

/*==========================================
** EXPORT
==========================================*/
export { GridEditDialog };
