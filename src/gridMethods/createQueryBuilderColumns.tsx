import React from 'react';

// components
import QbAutocomplete from '../components/queryBuilder/QbAutocomplete';
import QbSelect from '../components/queryBuilder/QbSelect';
import MuiNumberEditor from '../components/queryBuilder/muiNumberEditor';
import QbMuiDateEditor from '../components/queryBuilder/qbMuiDateEditor';
import MuiTextEditor from '../components/queryBuilder/muiTextEditor';
import MuiEmailEditor from '../components/queryBuilder/muiEmailEditor';
import MuiPhoneEditor from '../components/queryBuilder/muiPhoneEditor';

import { prettyPrint } from '../utilities/prettyPrint';

import { SObjectMetadata, SObjectFieldMetadata } from '../sObjectMetadataTypes';

import { PicklistItem } from '../appInterfaces/grid/gridInterfaces';
import { ColumnsModel, QueryBuilderComponent } from '@syncfusion/ej2-react-querybuilder';
import { APIClient } from '../brideDesignPattern/apiInterface';
import { sfdcDataTypes } from '../gridDataTypes'

// HTML Encode/Decode
import { decode } from 'he'

const compareLabels = (labelA?: string | null, labelB?: string | null) =>
  (labelA || '').localeCompare(labelB || '', undefined, { sensitivity: 'base' });

export function createQueryBuilderColumns(selectedObjMetadata: SObjectMetadata, qryBldrRef: React.RefObject<QueryBuilderComponent | null>, apiClient: APIClient): ColumnsModel[] {
   prettyPrint('[QB:columns] start', { object: selectedObjMetadata?.apiName, fields: Array.isArray(selectedObjMetadata?.fields) ? selectedObjMetadata.fields.length : 'n/a' }, 'orange');
   function createQueryColumn(field: SObjectFieldMetadata) {
      const fieldName = decode(field.name);
      const fieldLabel = decode(field.label);

      switch (field.type) {
         case 'REFERENCE': {
            // Use autocomplete template to search referenced records by name
            return {
               field: fieldName,
               label: fieldLabel,
               operators: [
                  { key: 'Equal', value: 'equal' },
                  { key: 'Not Equal', value: 'notequal' },
                  { key: 'In', value: 'in' },
                  { key: 'Not In', value: 'notin' }
               ],
               template: (props: any) => (
                  <QbAutocomplete
                     {...props}
                     fieldMetadata={field}
                     apiClient={apiClient}
                     qryBldrRef={qryBldrRef}
                     variant="main"
                  />
               ),
               type: 'string',
            }
         }
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
               enableNotCondition: true,
            }
         }
         case 'COMBOBOX': {
            const options: PicklistItem[] = []
            const pvals = Array.isArray(field.picklistValues) ? field.picklistValues as any[] : [];
            pvals.forEach((p: any) => {
               options.push({
                  name: decode(String(p?.name ?? p?.value ?? '')),
                  label: decode(String(p?.label ?? p?.value ?? '')),
               })
            })
            // Sort options by label in ascending order
            options.sort((a, b) => a.label.localeCompare(b.label));

            return {
               field: fieldName,
               label: fieldLabel,
               operators: [
                  { key: 'Equal', value: 'equal' },
                  { key: 'Not Equal', value: 'notequal' },
                  { key: 'In', value: 'in' },
                  { key: 'Not In', value: 'notin' }
               ],
               template: (props: any) => (
                  <QbSelect
                     {...props}
                     qryBldrRef={qryBldrRef}
                     options={options}
                  />
               ),
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
               template: (props: any) => <MuiNumberEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
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
               template: (props: any) => <QbMuiDateEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
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
               // Use the date editor so values are JS Dates (stringify to ISO 8601)
               template: (props: any) => <QbMuiDateEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
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
                  { key: 'Greater Than', value: 'greaterthan' },
                  { key: 'Greater Than Or Equal', value: 'greaterthanorequal' },
                  { key: 'Less Than', value: 'lessthan' },
                  { key: 'Less Than Or Equal', value: 'lessthanorequal' },
                  { key: 'Between', value: 'between' },
                  { key: 'Not Between', value: 'notbetween' },
               ],
               template: (props: any) => <MuiNumberEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
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
               template: (props: any) => <MuiEmailEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
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
               template: (props: any) => <MuiTextEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
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
               template: (props: any) => <MuiTextEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
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
                  { key: 'Greater Than', value: 'greaterthan' },
                  { key: 'Greater Than Or Equal', value: 'greaterthanorequal' },
                  { key: 'Less Than', value: 'lessthan' },
                  { key: 'Less Than Or Equal', value: 'lessthanorequal' },
                  { key: 'Between', value: 'between' },
                  { key: 'Not Between', value: 'notbetween' },
               ],
               template: (props: any) => <MuiNumberEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
               type: 'number',
            }
         }
         case 'MULTIPICKLIST': {
            const options: PicklistItem[] = []
            const pvals = Array.isArray(field.picklistValues) ? field.picklistValues as any[] : [];
            pvals.forEach((p: any) => {
               options.push({
                  name: decode(String(p?.name ?? p?.value ?? '')),
                  label: decode(String(p?.label ?? p?.value ?? '')),
               })
            })
            // Sort options by label in ascending order
            options.sort((a, b) => a.label.localeCompare(b.label));

            return {
               field: fieldName,
               label: fieldLabel,
               operators: [
                  { key: 'Equal', value: 'equal' },
                  { key: 'Not Equal', value: 'notequal' },
                  { key: 'In', value: 'in' },
                  { key: 'Not In', value: 'notin' }
               ],
               template: (props: any) => (
                  <QbSelect
                     {...props}
                     qryBldrRef={qryBldrRef}
                     options={options}
                  />
               ),
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
               template: (props: any) => <MuiNumberEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
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
               template: (props: any) => <MuiPhoneEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
               type: 'string',
            }
         }
         case 'PICKLIST': {
            const options: PicklistItem[] = []
            const pvals = Array.isArray(field.picklistValues) ? field.picklistValues as any[] : [];
            pvals.forEach((p: any) => {
               options.push({
                  name: decode(String(p?.name ?? p?.value ?? '')),
                  label: decode(String(p?.label ?? p?.value ?? '')),
               })
            })
            // Sort options by label in ascending order
            options.sort((a, b) => a.label.localeCompare(b.label));

            return {
               field: fieldName,
               label: fieldLabel,
               operators: [
                  { key: 'Equal', value: 'equal' },
                  { key: 'Not Equal', value: 'notequal' },
                  { key: 'In', value: 'in' },
                  { key: 'Not In', value: 'notin' }
               ],
               template: (props: any) => (
                  <QbSelect
                     {...props}
                     qryBldrRef={qryBldrRef}
                     options={options}
                  />
               ),
               type: 'string',
            }
         }
         // duplicate 'REFERENCE' case removed (handled earlier with richer operator set)
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
               template: (props: any) => <MuiTextEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
               type: 'string',
            }
         }
         case 'TEXT': {
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
               template: (props: any) => <MuiTextEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
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
               template: (props: any) => <MuiTextEditor {...props} field={field} qryBldrRef={qryBldrRef} />,
               type: 'string',
            }
         }
         default: {
            // only create columns for the types above
            // skip the rest (such as compound fields and blobs)
            return null;
         }
      }
   }

   function createColumns(objMetadata: SObjectMetadata) {
      // const objMetadataFields = objMetadata.fields  // returns a map

      const objMetadataFields: SObjectFieldMetadata[] = objMetadata.fields;

      const cols: ColumnsModel[] = [];

      for (const field of objMetadataFields) {
         const fieldType = field.type;

         if (!sfdcDataTypes.includes(fieldType)) {
            continue
         }

         // create the column
         const col = createQueryColumn(field)

         if (col && col.field !== null && col.type !== null) { // Ensure col is not null and has a type
            cols.push(col);
         }
      }

      const validCols = cols.filter(c => c !== null) as ColumnsModel[]; // Filter out nulls

      // sort by value
      validCols.sort((a: ColumnsModel, b: ColumnsModel) => compareLabels(a.label, b.label));

      prettyPrint('[QB:columns] built', { object: objMetadata.apiName, columnCount: validCols.length }, 'orange');
      return [...validCols]
   }

   const qbCols = createColumns(selectedObjMetadata!);

   return qbCols;
}
