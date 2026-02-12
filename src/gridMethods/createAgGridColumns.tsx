import React, { useEffect, useState } from 'react';

// AgGrid
import {
    ColDef,
    ColumnState,
    ValueGetterParams,
    ICellRendererParams,
    CellStyle,
} from 'ag-grid-community';

// MUI icons
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Tooltip, IconButton } from '@mui/material';

import { decode } from 'he'; // Assuming HTML entities

// import { prettyPrint } from '../utilities/prettyPrint';

// Your Type Imports (adjust paths)
import {
    SObjectMetadata,
    SObjectFieldMetadata,
    SObjectView,
} from '../sObjectMetadataTypes';

import { AgCalculatedColumn } from '../appInterfaces/grid/gridInterfaces';

import { Store } from '../zustandStore'; // Your Zustand store type
import { StoreApi } from 'zustand';
import { UseBoundStore } from 'zustand/react';

import { MuiAutocompleteEditor } from '../components/agGridEditors/muiAutocomplete';
import { MuiSelectEditor } from '../components/agGridEditors/muiSelect';
import { MuiMultiSelectEditor } from '../components/agGridEditors/muiMultiSelect';

import {
    parseExpression,
    evaluateExpression,
    getExpressionType,
    mapApexTypeToJsType,
} from '../components/calcuatedColumnWizard/expressionEvaluator';

import { buildCellStyleCss, findFirstMatchingColumnStyle } from '../gridMethods/styleUtils';
import { APIClient } from '../brideDesignPattern/apiInterface';
import { emitEditRecord } from '../events/topics';
import { enqueueSnackbar } from 'notistack';

// Types
export type AgGridChartDataType =
    | 'excluded'
    | 'category'
    | 'series'
    | 'time'
    | undefined;

// Props
interface AgGridColumnsProps {
    apiClient: APIClient;
    isSubgrid: boolean;
    zustandRef: React.RefObject<UseBoundStore<StoreApi<Store>>>;
    selectedObjMetadata: SObjectMetadata | null | undefined;
    selectedView: SObjectView | null | undefined;
    objMetadataMap: React.RefObject<Map<string, SObjectMetadata>>;
    currencyFormatter: Intl.NumberFormat;
    dateFormatter: Intl.DateTimeFormat;
    numberFormatter: Intl.NumberFormat;
    percentageFormatter: Intl.NumberFormat;
    nameFieldMap?: Map<string, string>;
    objectsWithoutNameFieldMap?: Map<string, string>;
    gridId?: string | number | null;
}

export function createAgGridColumns({
    apiClient,
    isSubgrid,
    zustandRef,
    selectedObjMetadata,
    selectedView,
    objMetadataMap,
    currencyFormatter,
    dateFormatter,
    numberFormatter,
    percentageFormatter,
    nameFieldMap,
    objectsWithoutNameFieldMap,
    gridId,
}: AgGridColumnsProps): ColDef[] {
    // -------------------------
    // Name-field cache (sync lookup only - no metadata fetching)
    // -------------------------
    const nameFieldCache = new Map<string, string>();

    const resolveNameFieldFromType = (typeName?: string): string | undefined => {
        if (!typeName) return undefined;
        if (nameFieldMap?.has(typeName)) return nameFieldMap.get(typeName);
        if (nameFieldCache.has(typeName)) return nameFieldCache.get(typeName);
        const cachedMeta = objMetadataMap?.current?.get(typeName);
        if (cachedMeta) {
            const nf = cachedMeta.fields.find((f) => f.isNameField)?.name;
            if (nf) {
                nameFieldCache.set(typeName, nf);
                return nf;
            }
        }
        return undefined;
    };

    const resolveReferenceLabel = (
        rawValue: any,
        data: any,
        relationName?: string,
        referenceTo?: string[]
    ): any => {
        if (rawValue === null || typeof rawValue === 'undefined') return rawValue;
        if (!relationName || !data || typeof data !== 'object') return rawValue;

        const related = (data as any)[relationName];
        if (!related || typeof related !== 'object') return rawValue;

        const candidateFields: string[] = [];

        const relatedType =
            typeof related?.attributes?.type === 'string' ? related.attributes.type : undefined;
        const explicit = resolveNameFieldFromType(relatedType);
        if (explicit) candidateFields.push(explicit);

        if (Array.isArray(referenceTo) && referenceTo.length === 1) {
            const refObj = referenceTo[0];
            const mapped = resolveNameFieldFromType(refObj);
            if (mapped) candidateFields.push(mapped);
        }

        if (
            typeof rawValue === 'string' &&
            rawValue.length >= 3 &&
            objectsWithoutNameFieldMap?.has(rawValue.substring(0, 3))
        ) {
            const mappedType = objectsWithoutNameFieldMap?.get(rawValue.substring(0, 3));
            const mappedField = resolveNameFieldFromType(mappedType);
            if (mappedField) candidateFields.push(mappedField);
        }

        candidateFields.push('Name');
        candidateFields.push('FullName');
        candidateFields.push('Id');

        for (const fieldName of candidateFields) {
            if (!fieldName) continue;
            const candidate = related[fieldName];
            if (typeof candidate === 'string' && candidate.trim().length > 0) {
                return candidate;
            }
        }

        return rawValue;
    };

    // -------------------------
    // Helpers
    // -------------------------
    const getAgGridColumnType2 = (field: SObjectFieldMetadata) => {
        switch (field.type) {
            case 'DECIMAL':
            case 'DOUBLE':
            case 'INTEGER':
            case 'LONG':
                return 'numericColumn';
            default:
                return null;
        }
    };

    const enableColumnAggregration = (field: SObjectFieldMetadata) =>
        ['CURRENCY', 'DECIMAL', 'DOUBLE', 'INTEGER', 'LONG'].includes(field.type);

    const enableColumnRowGroup = (field: SObjectFieldMetadata) =>
        !['ADDRESS', 'CURRENCY', 'DECIMAL', 'DOUBLE', 'INTEGER', 'PERCENT'].includes(field.type);

    // FIX 1: remove unused parameter
    const enableColumnPivot = () => true;

    const getChartDataType = (fieldMetadata: SObjectFieldMetadata) => {
        switch (fieldMetadata.type) {
            case 'ADDRESS':
            case 'BOOLEAN':
            case 'EMAIL':
            case 'ENCRYPTEDSTRING':
            case 'FAX':
            case 'ID':
            case 'PHONE':
            case 'TEXT':
            case 'TEXTAREA':
                return 'excluded';
            case 'CURRENCY':
            case 'DECIMAL':
            case 'DOUBLE':
            case 'INTEGER':
            case 'LONG':
                return 'series';
            case 'DATE':
            case 'DATETIME':
            case 'REFERENCE':
                return 'excluded';
            default:
                return 'category';
        }
    };

    const formatValue = (value: any, formatType: string): string | null => {
        if (value === null || value === undefined) return null;
        switch (formatType) {
            case 'CURRENCY':
                return currencyFormatter.format(value);
            case 'DATE':
            case 'DATETIME':
                return dateFormatter.format(value);
            case 'NUMBER':
            case 'DECIMAL':
            case 'DOUBLE':
            case 'INTEGER':
            case 'LONG':
                return numberFormatter.format(value);
            case 'PERCENTAGE':
                return percentageFormatter.format(value);
            case 'BOOLEAN':
                return value ? 'Yes' : 'No';
            default:
                return String(value);
        }
    };

    const mapExprTypeToFormatType = (exprType: string): string => {
        switch (exprType) {
            case 'number':
                return 'NUMBER';
            case 'date':
                return 'DATE';
            case 'string':
                return 'STRING';
            case 'boolean':
                return 'BOOLEAN';
            default:
                return 'STRING';
        }
    };

    const createValueGetter = (expr: string, fieldMap: Record<string, string>) => {
        const ast = parseExpression(expr);
        return (params: ValueGetterParams) => {
            try {
                const result = evaluateExpression(ast, params.data, fieldMap);
                return result.value;
            } catch (error: any) {
                console.error(`Error evaluating expression "${expr}": ${error.message}`);
                return null;
            }
        };
    };

    const fieldMap =
        selectedObjMetadata?.fields.reduce((acc, field) => {
            const jsType = mapApexTypeToJsType(field.type);
            if (jsType) {
                acc[field.name] = jsType;
            }
            return acc;
        }, {} as Record<string, string>) || {};

    const getNameField = (objMetadata: SObjectMetadata) =>
        objMetadata.fields.find((f) => f.isNameField)?.name || '';

    // Sanitize ColumnState -> Partial<ColDef> to avoid null/union mismatches
    const sanitizeStateToColDef = (savedCol: ColumnState): Partial<ColDef> => {
        const patch: Partial<ColDef> = {};
        if (typeof savedCol.width === 'number') patch.width = savedCol.width;
        if (typeof savedCol.hide === 'boolean') patch.hide = savedCol.hide; // skip null
        if (typeof savedCol.flex === 'number') patch.flex = savedCol.flex;
        if (savedCol.sort === 'asc' || savedCol.sort === 'desc') patch.sort = savedCol.sort;
        if (typeof savedCol.sortIndex === 'number') patch.sortIndex = savedCol.sortIndex;
        if (savedCol.aggFunc != null) (patch as any).aggFunc = savedCol.aggFunc;
        if (typeof savedCol.rowGroup === 'boolean') patch.rowGroup = savedCol.rowGroup;
        if (typeof savedCol.rowGroupIndex === 'number') patch.rowGroupIndex = savedCol.rowGroupIndex;
        if (typeof savedCol.pivot === 'boolean') patch.pivot = savedCol.pivot;
        if (typeof savedCol.pivotIndex === 'number') patch.pivotIndex = savedCol.pivotIndex;
        if (savedCol.pinned === 'left' || savedCol.pinned === 'right') patch.pinned = savedCol.pinned;
        return patch;
    };

    const applySavedColumnStateAndOrder = (
        generatedColDefs: ColDef[],
        savedColState: ColumnState[]
    ): ColDef[] => {
        let orderedGridCols: ColDef[] = [];
        const colDefMap = new Map<string, ColDef>();

        generatedColDefs.forEach((col) => {
            colDefMap.set(col.field || col.colId || '', col);
        });

        if (savedColState?.length > 0) {
            const usedColIds = new Set<string>();

            savedColState.forEach((savedCol) => {
                const colId = savedCol.colId;
                if (colDefMap.has(colId)) {
                    const baseColDef = colDefMap.get(colId)!;
                    const patch = sanitizeStateToColDef(savedCol);
                    const orderedColDef: ColDef = { ...baseColDef, ...patch };
                    orderedGridCols.push(orderedColDef);
                    usedColIds.add(colId);
                }
            });

            generatedColDefs.forEach((colDef) => {
                const colId = colDef.field || colDef.colId || '';
                if (!usedColIds.has(colId)) {
                    orderedGridCols.push(colDef);
                }
            });
        } else {
            orderedGridCols = [...generatedColDefs];
        }

        return orderedGridCols;
    };

    // -----------------------------------------
    // React cell renderer for REFERENCE fields
    // -----------------------------------------
    type ReferenceRendererProps = ICellRendererParams & {
        relationName?: string;
        referenceTo?: string[] | undefined;
    };

    const ReferenceCellRenderer: React.FC<ReferenceRendererProps> = (props) => {
        const { value, data, node, relationName, referenceTo } = props;
        const [label, setLabel] = useState<string>('');

        useEffect(() => {
            let alive = true;

            const resolve = async () => {
                if (!value) {
                    if (alive) setLabel('');
                    return;
                }

                const relName = typeof relationName === 'string' ? relationName : undefined;
                const syncLabel = resolveReferenceLabel(value, data, relName, referenceTo);
                if (syncLabel !== undefined && syncLabel !== null && syncLabel !== value) {
                    if (alive) setLabel(String(syncLabel));
                }

                // Group row
                if (node?.group) {
                    const sampleChild = node.allLeafChildren?.find((child) => child?.data)?.data;
                    const display = resolveReferenceLabel(value, sampleChild, relName, referenceTo);
                    if (display !== undefined && display !== null) {
                        if (alive) setLabel(String(display));
                        return;
                    }
                    if (alive) setLabel((node?.key as string | undefined) ?? String(value));
                    return;
                }

                // Non-group row
                const runtimeRelated =
                    relName && data && typeof data === 'object' ? (data as any)[relName] : undefined;

                // Try to resolve the display value without fetching metadata
                // Most objects use "Name" as the name field, so check that first
                if (runtimeRelated?.Name) {
                    if (alive) setLabel(String(runtimeRelated.Name));
                    return;
                }

                const runtimeType: string | undefined = runtimeRelated?.attributes?.type;
                const candidateSObject =
                    (referenceTo && referenceTo.length === 1 && referenceTo[0]) || runtimeType;

                // Check if we already know the name field from the map or cache (sync lookup)
                const knownNameField = candidateSObject ? resolveNameFieldFromType(candidateSObject) : undefined;
                if (knownNameField && runtimeRelated?.[knownNameField]) {
                    if (alive) setLabel(String(runtimeRelated[knownNameField]));
                    return;
                }

                // Fallback to Id or raw value if no display name is available
                // Don't fetch metadata - the cost is too high for the benefit
                const fallback =
                    runtimeRelated?.Id ??
                    String(value);
                if (alive) setLabel(fallback);
            };

            resolve().catch((e) => {
                console.error('ReferenceCellRenderer error:', e);
                if (alive) setLabel(String(value ?? ''));
            });

            return () => {
                alive = false;
            };
        }, [value, data, node, relationName, referenceTo]);

        return <span>{label ?? ''}</span>;
    };

    // -------------------------
    // Column construction
    // -------------------------
    const createGridColumns = (
        nameField: string,
        selectedView: SObjectView,
        colState: ColumnState[]
    ) => {
        let gridCols: ColDef[] = [
            {
                headerName: 'Error',
                field: 'error',
                cellRenderer: (params: any) => {
                    const store = zustandRef.current.getState();
                    const gridErrors = isSubgrid ? store.subgridErrors : store.gridErrors;
                    const errorMsg = gridErrors.get(params.data.Id);
                    if (errorMsg) {
                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                }}
                            >
                                <Tooltip
                                    title={errorMsg}
                                    arrow
                                    slotProps={{
                                        tooltip: {
                                            sx: {
                                                fontSize: '15px',
                                                padding: '4px',
                                            },
                                        },
                                    }}
                                >
                                    <ErrorOutlineIcon
                                        style={{
                                            color: 'red',
                                            fontSize: '20px',
                                        }}
                                    />
                                </Tooltip>
                            </div>
                        );
                    }
                    return null;
                },
                valueGetter: (params) => {
                    const store = zustandRef.current.getState();
                    const id = params?.data?.Id;
                    const gridErrors = isSubgrid ? store.subgridErrors : store.gridErrors;
                    return id ? (gridErrors.get(id) || '') : '';
                },
                filter: 'agTextColumnFilter',
                filterParams: {
                    filterOptions: ['contains'],
                    suppressAndOrCondition: true,
                    buttons: ['clear'],
                },
                suppressFillHandle: true,
                chartDataType: 'excluded',
                width: 50,
                sortable: false,
                hide: true,
            },
            {
                headerName: '',
                colId: 'editAction',
                width: 50,
                minWidth: 50,
                maxWidth: 50,
                sortable: false,
                filter: false,
                resizable: false,
                suppressFillHandle: true,
                suppressHeaderMenuButton: true,
                suppressColumnsToolPanel: true,
                chartDataType: 'excluded',
                pinned: 'left',
                lockPosition: 'left',
                cellRenderer: (params: ICellRendererParams) => {
                    const recordId = params.data?.Id;
                    if (!recordId) return null;
                    return (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                            }}
                        >
                            <Tooltip title="Edit" arrow>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        emitEditRecord({
                                            context: isSubgrid ? 'subgrid' : 'main',
                                            gridId,
                                            recordId,
                                        });
                                    }}
                                    sx={{
                                        padding: '4px',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                        },
                                    }}
                                >
                                    <EditOutlinedIcon
                                        sx={{
                                            fontSize: '18px',
                                            color: 'inherit',
                                        }}
                                    />
                                </IconButton>
                            </Tooltip>
                        </div>
                    );
                },
            },
        ];

        const objMetadataFields = selectedObjMetadata!.fields;
        objMetadataFields.forEach((f) => {
            const newGridCol: ColDef = {
                field: f.name,
                headerName: f.label,
                editable: f.isUpdateable,
                chartDataType: getChartDataType(f),
                enablePivot: enableColumnPivot(),
                enableRowGroup: enableColumnRowGroup(f),
                enableValue: enableColumnAggregration(f),
                filter: true,
                valueFormatter: ({ value }) => {
                    switch (f.type) {
                        case 'CURRENCY':
                            return value ? currencyFormatter.format(value) : null;
                        case 'DATE':
                        case 'DATETIME':
                            return value ? dateFormatter.format(value) : value;
                        case 'DECIMAL':
                        case 'DOUBLE':
                        case 'INTEGER':
                        case 'LONG':
                            return value ? numberFormatter.format(value) : null;
                        case 'PERCENTAGE':
                            return value ? percentageFormatter.format(value) : null;
                        case 'PICKLIST':
                        case 'COMBOBOX': {
                            try {
                                const opts = (f.picklistValues || []) as any[];
                                const hit = opts.find((o) => o.value === value);
                                return hit?.label ?? value;
                            } catch {
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
                            } catch {
                                return value;
                            }
                        }
                        default:
                            return value;
                    }
                },
                cellStyle: (params) => {
                    const { objColumnStyles } = zustandRef.current.getState();
                    const field = params?.colDef?.field as string | undefined;
                    const node = params?.node as any;
                    const matchedStyle = findFirstMatchingColumnStyle(
                        objColumnStyles,
                        params?.data,
                        node,
                        field,
                        f.type as any
                    );
                    return matchedStyle ? buildCellStyleCss(matchedStyle) : ({} as CellStyle);
                },
                suppressFillHandle: !f.isUpdateable,
            };

            // ---- REFERENCE FIELD: editor + async/cached renderer ----
            if (f.type === 'REFERENCE') {
                newGridCol.cellEditor = MuiAutocompleteEditor;
                newGridCol.cellEditorParams = {
                    apiClient,
                    fieldMetadata: f,
                    objMetadataMap,
                };

                // Safely capture relationshipName and referenceTo (if your SObjectFieldMetadata exposes it)
                const relationName: string | undefined =
                    typeof f.relationshipName === 'string' ? f.relationshipName : undefined;
                const referenceTo: string[] | undefined = (f as any).referenceTo;

                const formatReference = (value: any, node: any, data: any) => {
                    if (node?.group) {
                        const sampleData = node.allLeafChildren?.find((child: any) => child?.data)?.data;
                        return resolveReferenceLabel(value, sampleData, relationName, referenceTo);
                    }
                    return resolveReferenceLabel(value, data, relationName, referenceTo);
                };

                newGridCol.cellRendererSelector = (params) => {
                    if (params?.node?.group) {
                        return {
                            component: 'agGroupCellRenderer',
                            params: {
                                suppressCount: false,
                                innerRenderer: (innerParams: ICellRendererParams) => {
                                    const display = formatReference(innerParams.value, innerParams.node, innerParams.data);
                                    return display ?? innerParams.value ?? '';
                                },
                            },
                        };
                    }
                    return {
                        component: ReferenceCellRenderer,
                        params: {
                            relationName,
                            referenceTo,
                        },
                    };
                };

                newGridCol.valueFormatter = (params) => formatReference(params.value, params.node, params.data) ?? params.value;

                newGridCol.keyCreator = (params: any) => {
                    const label = resolveReferenceLabel(params.value, params.data, relationName, referenceTo);
                    if (label === null || typeof label === 'undefined') return params.value ?? '';
                    return String(label);
                };

                newGridCol.comparator = (valueA, valueB, nodeA, nodeB) => {
                    const labelA = formatReference(valueA, nodeA, nodeA?.data) ?? valueA;
                    const labelB = formatReference(valueB, nodeB, nodeB?.data) ?? valueB;
                    if (labelA == null && labelB == null) return 0;
                    if (labelA == null) return -1;
                    if (labelB == null) return 1;
                    return String(labelA).localeCompare(String(labelB));
                };
            }

            if (f.type === 'MULTIPICKLIST') {
                newGridCol.cellEditor = MuiMultiSelectEditor;
                newGridCol.cellEditorParams = {
                    apiClient,
                    fieldMetadata: f,
                    options: f.picklistValues,
                };
            } else if (f.type === 'COMBOBOX' || f.type === 'PICKLIST') {
                newGridCol.cellEditor = MuiSelectEditor;
                newGridCol.cellEditorParams = {
                    apiClient,
                    fieldMetadata: f,
                    options: f.picklistValues,
                };
            }

            // Keep your filter fine-tuning
            if (
                f.type === 'CURRENCY' ||
                f.type === 'DECIMAL' ||
                f.type === 'DOUBLE' ||
                f.type === 'INTEGER' ||
                f.type === 'LONG' ||
                f.type === 'PERCENTAGE'
            ) {
                newGridCol.filter = 'agNumberColumnFilter';
                newGridCol.filterParams = {
                    buttons: ['apply', 'clear', 'cancel'],
                    closeOnApply: true,
                };
            } else if (f.type === 'DATE' || f.type === 'DATETIME') {
                newGridCol.filter = 'agDateColumnFilter';
                newGridCol.filterParams = {
                    buttons: ['apply', 'clear', 'cancel'],
                    closeOnApply: true,
                    suppressAndOrCondition: true,
                    browserDatePicker: true,
                };
            } else if (f.type === 'COMBOBOX' || f.type === 'PICKLIST' || f.type === 'MULTIPICKLIST') {
                newGridCol.filter = 'agSetColumnFilter';
                newGridCol.filterParams = {
                    excelMode: 'mac',
                    buttons: ['apply', 'clear', 'cancel'],
                    closeOnApply: true,
                };
            } else {
                newGridCol.filter = 'agTextColumnFilter';
                newGridCol.filterParams = {
                    buttons: ['apply', 'clear', 'cancel'],
                    closeOnApply: true,
                };
            }

            const columnType = getAgGridColumnType2(f);
            if (columnType) {
                newGridCol.type = columnType;
            }

            gridCols.push(newGridCol);
        });

        // ---- Parent Field Columns ----
        if (selectedView?.parentFields) {
            try {
                const parentFieldsConfig = JSON.parse(selectedView.parentFields);

                // parentFieldsConfig format: { "User": { "relationshipName": "CreatedBy", "fields": ["FirstName", "LastName"] } }
                // Keys are parent object names, values contain the relationship to use and the fields
                for (const [parentObjectName, config] of Object.entries(parentFieldsConfig)) {
                    if (!config || typeof config !== 'object') {
                        continue;
                    }

                    const { relationshipName, fields } = config as { relationshipName: string; fields: string[] };
                    if (!relationshipName || !Array.isArray(fields)) {
                        continue;
                    }

                    // Validate that this relationship exists in current object's metadata
                    const referenceField = selectedObjMetadata?.fields.find(
                        (f: any) => f.type?.toUpperCase() === 'REFERENCE' && f.relationshipName === relationshipName
                    );

                    if (!referenceField) {
                        continue;
                    }

                    for (const parentFieldName of fields) {
                        // Column field uses the relationship name for SOQL/data access
                        const columnField = `${relationshipName}.${parentFieldName}`;
                        // Column header shows parent object name (more user-friendly)
                        const columnHeader = `[${parentObjectName}] ${parentFieldName}`;

                        const parentFieldCol: ColDef = {
                            field: columnField,
                            colId: columnField,
                            headerName: columnHeader,
                            editable: false,
                            filter: 'agTextColumnFilter',
                            filterParams: {
                                buttons: ['apply', 'clear', 'cancel'],
                                closeOnApply: true,
                            },
                            valueGetter: (params) => {
                                // Extract value from nested object using relationship name
                                const data = params.data;
                                if (!data || !relationshipName) return null;
                                const parentObj = data[relationshipName];
                                return parentObj?.[parentFieldName] ?? null;
                            },
                            // No cellStyle - inherit theme's cellTextColor and defaultColDef styling
                            chartDataType: 'category',
                            suppressFillHandle: true,
                        };

                        gridCols.push(parentFieldCol);
                    }
                }
            } catch (error: any) {
                enqueueSnackbar(`Unexpected error processing parent fields - ${error.message}`, { variant: 'error', autoHideDuration: 0 });
            }
        }

        if (selectedView) {
            const objCalcColsStr = selectedView.calculatedColumns;
            if (objCalcColsStr) {
                const objCalcCols = JSON.parse(decode(objCalcColsStr));
                const calculatedColumns = objCalcCols
                    .filter((f: AgCalculatedColumn) => f.active)
                    .map((f: AgCalculatedColumn) => {
                        const ast = parseExpression(f.rule!);
                        const exprType = getExpressionType(ast, fieldMap);
                        const formatType = f.formatType || mapExprTypeToFormatType(exprType);
                        return {
                            headerName: f.name,
                            editable: false,
                            valueGetter: createValueGetter(f.rule!, fieldMap),
                            valueFormatter: (params: any) => formatValue(params.value, formatType),
                        };
                    });
                gridCols.push(...calculatedColumns);
            }
            gridCols = applySavedColumnStateAndOrder(gridCols, colState);
        }

        const nameColIndex = gridCols.findIndex((col) => col.field === nameField);
        if (nameColIndex > -1) {
            const [nameCol] = gridCols.splice(nameColIndex, 1);
            // Only render group expander for master grid, never for subgrid
            if (!isSubgrid) {
                nameCol.cellRenderer = 'agGroupCellRenderer';
            }
            gridCols.splice(1, 0, nameCol);
        }

        return gridCols;
    };

    try {
        const nameField = getNameField(selectedObjMetadata!);
        let colState: ColumnState[] = [];
        if (selectedView) {
            const colStateStr = selectedView.columnState;
            colState = JSON.parse(decode(colStateStr));
        }
        return createGridColumns(nameField, selectedView!, colState);
    } catch (error: any) {
        throw new Error(error.message);
    }
}
