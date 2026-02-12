import { ColDef, ICellRendererParams } from 'ag-grid-community';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Tooltip } from '@mui/material';
import React from 'react';

import type { SObjectFieldMetadata, SObjectMetadata } from '../../../sObjectMetadataTypes';
import { MuiSelectEditor } from '../../agGridEditors/muiSelect';
import { MuiMultiSelectEditor } from '../../agGridEditors/muiMultiSelect';
import { MuiAutocompleteEditor } from '../../agGridEditors/muiAutocomplete';
import { TimeSeriesDateEditor } from '../gridEditors/TimeSeriesDateEditor';
import type { APIClient } from '../../../brideDesignPattern/apiInterface';
import { prettyPrint } from '../../../utilities/prettyPrint';

export interface CreateImportPreviewColumnsParams {
  apiClient: APIClient;
  metaFields: SObjectFieldMetadata[];
  mapping: Record<string, string>; // property -> api
  transposedField: string;
  showErrorColumn: boolean;
  objMetadataMap?: React.RefObject<Map<string, SObjectMetadata>>;
  // formatters
  currencyFormatter: Intl.NumberFormat;
  dateFormatter: Intl.DateTimeFormat;
  numberFormatter: Intl.NumberFormat;
  percentageFormatter: Intl.NumberFormat;
}

export function createImportPreviewColumns({
  apiClient,
  metaFields,
  mapping,
  transposedField,
  showErrorColumn,
  objMetadataMap,
  currencyFormatter,
  dateFormatter,
  numberFormatter,
  percentageFormatter,
}: CreateImportPreviewColumnsParams): ColDef[] {
  const byApi = new Map<string, SObjectFieldMetadata>(
    (metaFields || []).map((f) => [f.name, f])
  );

  const cols: ColDef[] = [];

  // Error indicator column (similar behavior to AppGrid)
  cols.push({
    headerName: 'Error',
    field: '__error',
    colId: '__error',
    editable: false,
    suppressHeaderMenuButton: true,
    suppressHeaderContextMenu: true,
    width: 50,
    sortable: false,
    filter: false,
    tooltipField: '__error',
    hide: !showErrorColumn,
    cellRenderer: (params: ICellRendererParams) => {
      const errorMsg = (params?.data && params.data.__error) || '';
      if (!errorMsg) return null;
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Tooltip title={errorMsg} arrow slotProps={{ tooltip: { sx: { fontSize: '15px', padding: '4px' } } }}>
            <ErrorOutlineIcon style={{ color: 'red', fontSize: '20px' }} />
          </Tooltip>
        </div>
      );
    },
  });

  const addFieldCol = (f: SObjectFieldMetadata) => {
    const col: ColDef = {
      field: f.name,
      headerName: f.label || f.name,
      editable: f.isCreateable === true, // importing new rows => use createable
      filter: true,
      suppressFillHandle: !f.isCreateable,
    };

    // Editors
    if (f.type === 'REFERENCE') {
      col.cellEditor = MuiAutocompleteEditor as any;
      col.cellEditorParams = {
        apiClient,
        fieldMetadata: f,
        objMetadataMap: objMetadataMap ?? { current: new Map<string, SObjectMetadata>() },
      } as any;
      // Display label if relation object is present
      const relationName: string | undefined = typeof f.relationshipName === 'string' ? f.relationshipName : undefined;
      col.valueFormatter = ({ value, data }) => {
        try {
          if (relationName && data && (data as any)[relationName]) {
            const rel = (data as any)[relationName];
            return rel?.Name || value;
          }
        } catch (e: any) {
          prettyPrint('[createImportPreviewColumns] Reference valueFormatter error', {
            fieldName: f.name,
            relationName,
            error: e?.message || String(e)
          }, 'orange');
        }
        return value;
      };
    } else if (f.type === 'DATE') {
      // Use a Date-only editor for DATE fields (no time controls)
      col.cellEditor = TimeSeriesDateEditor as any;
    } else if (f.type === 'MULTIPICKLIST') {
      col.cellEditor = MuiMultiSelectEditor as any;
      col.cellEditorParams = {
        apiClient,
        fieldMetadata: f,
        options: f.picklistValues,
      } as any;
      col.filter = 'agSetColumnFilter';
    } else if (f.type === 'COMBOBOX' || f.type === 'PICKLIST') {
      col.cellEditor = MuiSelectEditor as any;
      col.cellEditorParams = {
        apiClient,
        fieldMetadata: f,
        options: f.picklistValues,
      } as any;
      col.filter = 'agSetColumnFilter';
    }

    // Formatters
    col.valueFormatter = ({ value, data }) => {
      if (value == null) return value;
      switch (f.type) {
        case 'REFERENCE': {
          const relationName: string | undefined = typeof f.relationshipName === 'string' ? f.relationshipName : undefined;
          try {
            if (relationName && data && (data as any)[relationName]) {
              const rel = (data as any)[relationName];
              return rel?.Name || value;
            }
          } catch (e: any) {
            prettyPrint('[createImportPreviewColumns] REFERENCE formatter error', {
              fieldName: f.name,
              relationName,
              error: e?.message || String(e)
            }, 'orange');
          }
          return value;
        }
        case 'CURRENCY':
          return currencyFormatter.format(value);
        case 'DATE':
        case 'DATETIME':
          return value ? dateFormatter.format(new Date(value)) : value;
        case 'DECIMAL':
        case 'DOUBLE':
        case 'INTEGER':
        case 'LONG':
          return numberFormatter.format(value);
        case 'PERCENTAGE':
          return percentageFormatter.format(value);
        case 'PICKLIST':
        case 'COMBOBOX': {
          try {
            const opts = (f.picklistValues || []) as any[];
            const hit = opts.find((o) => o.value === value);
            return hit?.label ?? value;
          } catch (e: any) {
            prettyPrint('[createImportPreviewColumns] PICKLIST formatter error', {
              fieldName: f.name,
              type: f.type,
              error: e?.message || String(e)
            }, 'orange');
            return value;
          }
        }
        case 'MULTIPICKLIST': {
          if (value == null || value === '') return value;
          try {
            const opts = (f.picklistValues || []) as any[];
            const tokens = String(value)
              .split(';')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            const labels = tokens.map((v) => opts.find((o) => o.value === v)?.label || v);
            return labels.join('; ');
          } catch (e: any) {
            prettyPrint('[createImportPreviewColumns] MULTIPICKLIST formatter error', {
              fieldName: f.name,
              error: e?.message || String(e)
            }, 'orange');
            return value;
          }
        }
        default:
          return value;
      }
    };

    // Filters
    if (
      f.type === 'CURRENCY' ||
      f.type === 'DECIMAL' ||
      f.type === 'DOUBLE' ||
      f.type === 'INTEGER' ||
      f.type === 'LONG' ||
      f.type === 'PERCENTAGE'
    ) {
      col.filter = 'agNumberColumnFilter';
      col.filterParams = { buttons: ['apply', 'clear', 'cancel'], closeOnApply: true };
    } else if (f.type === 'DATE' || f.type === 'DATETIME') {
      col.filter = 'agDateColumnFilter';
      col.filterParams = { buttons: ['apply', 'clear', 'cancel'], closeOnApply: true, suppressAndOrCondition: true, browserDatePicker: true };
    } else if (f.type === 'COMBOBOX' || f.type === 'PICKLIST' || f.type === 'MULTIPICKLIST') {
      col.filter = 'agSetColumnFilter';
      col.filterParams = { excelMode: 'mac', buttons: ['apply', 'clear', 'cancel'], closeOnApply: true };
    } else {
      col.filter = 'agTextColumnFilter';
      col.filterParams = { buttons: ['apply', 'clear', 'cancel'], closeOnApply: true };
    }

    return col;
  };

  // Transposed column first (if not part of mapping values)
  const mappedApis = new Set(Object.values(mapping).filter(Boolean));
  if (!mappedApis.has(transposedField)) {
    const f = byApi.get(transposedField);
    if (f) cols.push(addFieldCol(f));
  }

  // Columns for each mapped field in mapping order
  for (const [, api] of Object.entries(mapping)) {
    if (!api) continue;
    const f = byApi.get(api);
    if (!f) continue;
    cols.push(addFieldCol(f));
  }

  return cols;
}
