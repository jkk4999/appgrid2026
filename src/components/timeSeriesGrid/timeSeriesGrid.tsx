/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TimeSeriesGrid
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * Specialized grid view for displaying and editing Salesforce data in a
 * transposed (pivoted) format. Transforms columnar data into a row-based
 * view where each row represents a field and columns represent individual
 * records, enabling side-by-side comparison and bulk editing of records.
 *
 * ARCHITECTURE:
 * - Parent: Rendered by grid type router (AppGrid or SubgridCore via tab navigation)
 * - State: Zustand store for grid state, local state for transpose-specific data
 * - API: Uses apiClient for Salesforce Apex communication (CRUD operations)
 * - Grid: AG Grid Enterprise with custom cell editors and transpose logic
 *
 * KEY DEPENDENCIES:
 * - AG Grid Enterprise for grid rendering with cell selection and fill handle
 * - Zustand store for shared state (selectedObject, filters, views)
 * - Custom hooks (useTimeSeriesFormatters, useTimeSeriesCellEditing)
 * - Transpose utilities for data transformation
 * - Custom cell editors for type-specific editing (date, picklist, reference)
 *
 * USAGE:
 * Rendered when user selects "Time Series" grid type from grid type selector.
 * Can be used as main grid or subgrid (isSubgrid prop determines context).
 * <TimeSeriesGrid apiClient={apiClient} isSubgrid={false} ... />
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/*==========================================
** IMPORTS
==========================================*/

// React
import React, {
   useState,
   useEffect,
   useCallback,
   useMemo,
   useRef
} from 'react';

// Zustand
import useStore from '../../zustandStore';
import { useShallow } from 'zustand/react/shallow';

// Domain-specific selector hooks - unified context-based hooks
import {
   useGridViewState,
   useGridDialogState,
   type GridContext,
} from '../../hooks/selectors';

// Lodash
import * as _ from 'lodash-es';

// HTML Encode/Decode

// PubSubJS
import PubSub from 'pubsub-js';

// PubSub emit helpers
import { emitEditRecord } from '../../events/topics';

import { prettyPrint } from '../../utilities/prettyPrint';

// components
import RecordTypeDialog from '../recordTypeDialog/RecordTypeDialog';

import DeleteFilterDialog from '../deleteFilterDialog/DeleteFilterDialog';

import DeleteRecordDialog from '../deleteRecordDialog/DeleteRecordDialog';

import { CustomHeader } from './gridEditors/customHeader';

import { AppToolbarResponsive } from '../appGridAuraComponent/toolbar/AppToolbarResposive';

import LoadingIndicator from '../loadingIndicator/LoadingIndicator';

import { SubgridViewSelector } from '../subGrid/subgridViewSelector';

// editor components
import { TimeSeriesAutocompleteEditor } from './gridEditors/timeSeriesAutocompleteEditor';

import { TimeSeriesDateEditor } from './gridEditors/TimeSeriesDateEditor';

import { TimeSeriesSelectEditor } from './gridEditors/timeSeriesSelectEditor';

import { TimeSeriesMultiSelectEditor } from './gridEditors/TimeSeriesMultiSelectEditor';

// MUI
import { Box } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

// MUI icons

// notifications
import { useSnackbarAction } from '../../hooks/useSnackbarAction';

// utilities
import createDummyApexId from '../../utilities/createDummyApexId';

// time series utilities and hooks
import { formatByFieldType } from '../../utilities/formatByFieldType';
import { useTimeSeriesFormatters } from './hooks/useTimeSeriesFormatters';
import { useTimeSeriesCellEditing } from './hooks/useTimeSeriesCellEditing';
import {
   reverseTranspose as reverseTransposeUtil,
   transformDataForTranspose,
   createTransposedGridRecords,
   moveColumnToFront,
   buildIdToFieldKeyMap,
   findFieldKeyByValue
} from './utils/transposeUtils';

// interfaces
import {
   CurrentCellInfo,
   CurrentState,
   FilterOption,
   PicklistItem,
   RelationPreference,
   TimeSeriesFilterOption
} from '../../appInterfaces/grid/gridInterfaces';

import {
   SObjectFieldMetadata,
   SObjectMetadata,
   SObjectPermission,
   SObject,
   SObjectFieldPermission,
   OrgObject
} from '../../sObjectMetadataTypes';

// Ag-Grid
import { AgGridReact } from 'ag-grid-react';

// editor components
import { GridEditDialog } from '../gridEditDialog/gridEditDialog';

import { FilterBuilder } from '../filterBuilder/filterBuilder';

import type {
   ColumnState,
   ColDef,
   FilterModifiedEvent,
   ProcessDataFromClipboardParams,
   CellSelectionOptions,
   FillOperationParams,
   FillStartEvent,
   GetMainMenuItemsParams,
   GetContextMenuItemsParams,
   MenuItemDef,
   DefaultMenuItem,
   CellMouseDownEvent
} from 'ag-grid-community';

import { themeQuartz } from 'ag-grid-community';

import {
   APIClient,
   QueryServiceParams,
   UpsertServiceParams
} from '../../brideDesignPattern/apiInterface';

import TimeSeriesGridMenu from './menu/TimeSeriesGridMenu';

import ImportWizardDialog from './importWizard/ImportWizardDialog';

import { useGridId } from '../../hooks/useGridId';

import { useAgGridApi } from '../../hooks/grid/useAgGridApi';

import { useGridContainer } from '../../hooks/useGridContainer';

import { useGridStatePersistence } from '../../hooks/useGridStatePersistence';

import { useGridEvents } from '../../hooks/useGridEvents';

import { useGridToolbarEvents } from '../../hooks/useGridToolbarEvents';

import { useObjectPermissions } from '../../hooks/useObjectPermissions';

import { useDeleteRecords } from '../../hooks/useDeleteRecords';

import { RuleModel } from '@syncfusion/ej2-querybuilder';

import { buildFieldTypeMap, decodeAndConvertRecords } from '../../utilities/decodeAndConvert';

import { decode } from 'he';

import { displayReference } from '../../utilities/referenceDisplay';

/*==========================================
** TYPES & INTERFACES
==========================================*/

interface ColumnHeaderChecked {
   column: string;
   value: boolean;
}

interface SelectedRow {
   column: string;
   row: SObject;
}

export interface CurrentTimeSeriesGridState {
   selectedTimeSeriesFilter: TimeSeriesFilterOption;
   timeSeriesFilterOptions: TimeSeriesFilterOption[];
   transposedColumn: string;
}

interface Size { width: number; height: number }

interface TimeSeriesGridProps {
   apiClient: APIClient;
   isSubgrid: boolean;
   objFieldPermissionsMap: React.RefObject<Map<string, SObjectFieldPermission>>;
   objMetadataMap: React.RefObject<Map<string, SObjectMetadata>>;
   relation?: RelationPreference;
   selectedParentRow?: SObject; // for subgrid mode
   parentObjectApiName?: string; // for subgrid lookup resolution
   size?: Size; // container size passed from router
   active?: boolean; // only the active tab should notify/build prompts
}

interface DynamicUpdateRow {
   property: string | undefined;
   [key: string]: any; // This index signature allows any string as a key
}

/*==========================================
** CONSTANTS
==========================================*/

const baseThemes = [
   { id: "themeQuartz", value: themeQuartz },
];

/*==========================================
** COMPONENT
==========================================*/

const TimeSeriesGrid = ({
   apiClient,
   isSubgrid,
   objFieldPermissionsMap,
   objMetadataMap,
   relation,
   selectedParentRow,
   parentObjectApiName,
   size,
   active,
}: TimeSeriesGridProps) => {
   /*==========================================
   ** CONTEXT
   ==========================================*/
   const theme = useTheme();

   /*==========================================
   ** CUSTOM HOOKS
   ==========================================*/
   const [baseTheme] = useState(baseThemes[0]);

   // Use memoized formatters to prevent unnecessary re-renders
   const formatters = useTimeSeriesFormatters();
   const { dateFormatter, numberFormatter, currencyFormatter, percentageFormatter } = formatters;

   // notifications
   const { enqueueSnackbar, action } = useSnackbarAction();

   // Ag-Grid API via shared hook
   const { gridApi, gridApiRef, onGridReady } = useAgGridApi();

   const [showImportDialog, setShowImportDialog] = useState(false);

   // Compute grid context for unified hooks
   const gridContext: GridContext = isSubgrid ? 'subgrid' : 'main';

   // View state - unified hook handles main/subgrid automatically
   const {
      selectedView: contextSelectedView,
      setSelectedView: contextSetSelectedView,
      setViewOptions: contextSetViewOptions,
   } = useGridViewState(gridContext);

   // Dialog state - unified hook handles main/subgrid automatically
   const {
      showDeleteRecordDialog,
      setShowDeleteRecordDialog,
      showDeleteFilterDialog,
      setShowDeleteFilterDialog,
   } = useGridDialogState(gridContext);

   // Alias view state for backward compatibility with existing code patterns
   // Main grid uses unified hook, subgrid uses per-relation state for consistency with SubgridCore
   const selectedView = isSubgrid ? null : contextSelectedView;

   // Memoize conditional setters to prevent useEffect dependency changes on every render
   const noopFn = useMemo(() => () => { }, []);
   const setSelectedView = useMemo(
      () => (isSubgrid ? noopFn : contextSetSelectedView),
      [isSubgrid, noopFn, contextSetSelectedView]
   );
   const setViewOptions = useMemo(
      () => (isSubgrid ? noopFn : contextSetViewOptions),
      [isSubgrid, noopFn, contextSetViewOptions]
   );

   /*==========================================
   ** GLOBAL STATE (Zustand)
   ==========================================*/
   // Time-series-specific state that doesn't fit unified hooks
   // Note: selectedView, selectedSubgridView, showDeleteFilterDialog, showDeleteRecordDialog
   // are now from unified hooks above (contextSelectedView, contextShowDeleteFilterDialog, etc.)
   const {
      // Time-series specific getters
      currentTimeSeriesFilterRule,
      loading,
      gridEditDialogState,
      objectPermissions,
      selectedGridColorTheme,
      selectedObject,
      selectedObjMetadata,
      selectedQuery,
      selectedRecordType,
      selectedTimeSeriesFilter,
      selectedTransposedColumn,
      showFilterBuilder,
      showRecordTypeDialog,
      timeSeriesFilterOptions,
      transposedColumnOptions,
      transposedRowData,
      userInfo,

      // Setters
      setFilterOptions,
      setIsMainTimeSeriesFilterActive,
      setIsSubgridTimeSeriesFilterActive,
      setIsQueryActive,
      setGridEditDialogState,
      setLoading,
      setQueryRuleModified,
      setRecordTypes,
      setSelectedObject,
      setSelectedRecordType,
      setSelectedSubgridType,
      setSelectedViewRecordId,
      setLastViewId,
      setSelectedTimeSeriesFilter,
      setSelectedTransposedColumn,
      setShowRecordTypeDialog,
      setTimeSeriesFilterOptions,
      setTransposedColumnOptions,
      setTransposedRowData,
      setSelectedGridType,

      // Per-relation subgrid view state (for subgrid mode)
      subgridViewByRelation,
      setSubgridViewForRelation,
   } = useStore(
      useShallow((state) => ({
         // Time-series specific getters
         currentTimeSeriesFilterRule: state.currentTimeSeriesFilterRule,
         loading: state.loading,
         gridEditDialogState: state.gridEditDialogState,
         objectPermissions: state.objectPermissions,
         selectedGridColorTheme: state.selectedGridColorTheme,
         selectedObject: state.selectedObject,
         selectedObjMetadata: state.selectedObjMetadata,
         selectedQuery: state.selectedQuery,
         selectedRecordType: state.selectedRecordType,
         selectedTimeSeriesFilter: state.selectedTimeSeriesFilter,
         selectedTransposedColumn: state.selectedTransposedColumn,
         setSelectedObject: state.setSelectedObject,
         setSelectedSubgridType: state.setSelectedSubgridType,
         showFilterBuilder: state.showFilterBuilder,
         showRecordTypeDialog: state.showRecordTypeDialog,
         timeSeriesFilterOptions: state.timeSeriesFilterOptions,
         transposedColumnOptions: state.transposedColumnOptions,
         transposedRowData: state.transposedRowData,
         userInfo: state.userInfo,

         // Setters
         setIsQueryActive: state.setIsQueryActive,
         setGridEditDialogState: state.setGridEditDialogState,
         setLoading: state.setLoading,
         setFilterOptions: state.setFilterOptions,
         setQueryRuleModified: state.setQueryRuleModified,
         setRecordTypes: state.setRecordTypes,
         setSelectedRecordType: state.setSelectedRecordType,
         setSelectedViewRecordId: state.setSelectedViewRecordId,
         setLastViewId: state.setLastViewId,
         setSelectedTimeSeriesFilter: state.setSelectedTimeSeriesFilter,
         setSelectedTransposedColumn: state.setSelectedTransposedColumn,
         setShowCreateTimeSeriesRecordDialog: state.setShowCreateTimeSeriesRecordDialog,
         setShowRecordTypeDialog: state.setShowRecordTypeDialog,
         setTimeSeriesFilterOptions: state.setTimeSeriesFilterOptions,
         setTransposedColumnOptions: state.setTransposedColumnOptions,
         setTransposedRowData: state.setTransposedRowData,
         setIsMainTimeSeriesFilterActive: state.setIsMainTimeSeriesFilterActive,
         setIsSubgridTimeSeriesFilterActive: state.setIsSubgridTimeSeriesFilterActive,
         // Routing setters
         gridViewTypes: state.gridViewTypes,
         setSelectedGridType: state.setSelectedGridType,

         // Per-relation subgrid view state (for subgrid mode)
         subgridViewByRelation: state.subgridViewByRelation,
         setSubgridViewForRelation: state.setSubgridViewForRelation,
      })))

   /*==========================================
   ** DERIVED STATE / MEMOIZED VALUES
   ==========================================*/

   const agGridTheme = useMemo(() => {
      let theme = baseTheme.value;

      if (selectedGridColorTheme.value) {
         theme = theme.withPart(selectedGridColorTheme.value as Parameters<typeof theme.withPart>[0]);
      }

      return theme;
   }, [baseTheme, selectedGridColorTheme]);

   const sObjectName = isSubgrid ? relation?.name : selectedObject?.qualifiedApiName

   // Derive subgrid view from per-relation state (consistent with SubgridCore pattern)
   const sObjectApiName = String(sObjectName || '');
   const selectedSubgridView = isSubgrid ? (subgridViewByRelation[sObjectApiName] ?? null) : null;

   // Memoized setters for subgrid views that use per-relation storage
   const setSelectedSubgridView = useMemo(
      () => isSubgrid
         ? (view: any) => setSubgridViewForRelation(sObjectApiName, view)
         : noopFn,
      [isSubgrid, sObjectApiName, setSubgridViewForRelation, noopFn]
   );
   const gridId = useGridId();

   /*==========================================
   ** LOCAL STATE
   ==========================================*/
   const [resolvedObjMetadata, setResolvedObjMetadata] = useState<SObjectMetadata | null>(null);

   /*==========================================
   ** EFFECTS
   ==========================================*/

   useEffect(() => {
      if (!isSubgrid) {
         setSelectedGridType({
            name: 'timeSeriesView',
            label: 'Time Series'
         });
      }
   }, [isSubgrid, setSelectedGridType]);

   // Resolve correct metadata (child object when used as a subgrid)
   useEffect(() => {
      let alive = true;

      (async () => {
         try {
            if (!sObjectName) {
               if (alive) setResolvedObjMetadata(null);
               return;
            }
            let meta: SObjectMetadata | null = null;

            if (isSubgrid) {
               meta = (objMetadataMap.current?.get(String(sObjectName)) as SObjectMetadata) || null;

               if (!meta) {
                  meta = await apiClient.getMetadata({ sObjectName: String(sObjectName) });

                  objMetadataMap.current?.set(String(sObjectName), meta);
               }
            } else {
               meta = (selectedObjMetadata as SObjectMetadata) || null;
            }
            if (alive) setResolvedObjMetadata(meta);
         } catch {
            if (alive) setResolvedObjMetadata(null);

            enqueueSnackbar(`Error loading metadata for ${String(sObjectName)}`, { action, variant: 'error' });
         }
      })();
      return () => { alive = false; };
   }, [action, apiClient, enqueueSnackbar, isSubgrid, objMetadataMap, sObjectName, selectedObjMetadata]);

   const [changedRows, setChangedRows] = useState<Set<string>>(
      new Set<string>()
   );
   const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

   const currentCellInfo = useRef<CurrentCellInfo>(null)

   const fillHandleFocusedColumn = useRef<string>('');

   const [currentState, setCurrentState] = useState<CurrentState>();

   const enableStateSaving = useRef(false);

   const [filteredColumnDefs, setFilteredColumnDefs] = useState<ColDef[]>([]);

   // object ref
   const gridRef = useRef<AgGridReact<unknown>>(null);

   const isInitialDataLoaded = useRef(false);

   const [initialDataLoaded, setInitialDataLoaded] = useState(false);

   const [selectedRows, setSelectedRows] = useState<SelectedRow[]>([]);

   const timeSeriesGridPreferenceRecId = useRef<string>(null);

   const gridPrefRecIdRef = useRef<string>('');

   const [timeSeriesGridCreated, setTimeSeriesGridCreated] = useState(false);

   const saveFromTransposeRef = useRef(false);

   const [selectedRow, setSelectedRow] = useState<SelectedRow | null>(null);

   const [showErrorRecs, setShowErrorRecs] = useState(false);

   const prevColumnDefs = useRef<ColDef[]>([]);

   const prevRowDataCopy = useRef<any[]>([]);

   const prevSelectedTransposedColumn = useRef<PicklistItem>(null);

   const transposedRowDataRef = useRef(transposedRowData);

   const [rowDataCopy, setRowDataCopy] = useState<SObject[]>([]);

   // Cell editing hook - handles data synchronization when cells are edited
   const { onCellValueChanged, clearChangedRows: clearChangedRowsHook } = useTimeSeriesCellEditing({
      transposedRowData,
      setTransposedRowData,
      setChangedRows
   });

   // Sync transposedRowDataRef whenever transposedRowData changes (critical for formatters and save operations)
   useEffect(() => {
      transposedRowDataRef.current = transposedRowData;
   }, [transposedRowData]);

   // Reset transpose selection when switching subgrid relation (child sObject)
   const prevSubgridObjectRef = useRef<string | null>(null);

   useEffect(() => {
      if (!isSubgrid) {
         return;
      };

      const current = typeof sObjectName === 'string' ? sObjectName : null;

      if (prevSubgridObjectRef.current && current && prevSubgridObjectRef.current !== current) {
         // Clear selection/options so the new relation doesn’t inherit the previous one
         prevSelectedTransposedColumn.current = null as any;

         setSelectedTransposedColumn(null as any);

         setTransposedColumnOptions([]);
         // Reset preference tracking so the new relation can load/create its own pref record
         timeSeriesGridPreferenceRecId.current = null as any;

         prevSelectedTransposedColumnName.current = null;

         saveInFlightRef.current = false;
         // Force re-initialization sequence for new relation
         isInitialDataLoaded.current = false;

         setInitialDataLoaded(false);
      }
      prevSubgridObjectRef.current = current;
   }, [isSubgrid, sObjectName, setSelectedTransposedColumn, setTransposedColumnOptions]);

   // Track previous view to detect view changes
   const prevSelectedViewRef = useRef<string | null>(null);

   // Reset initialization when selected view changes - allows grid to rebuild with new view columns
   useEffect(() => {
      // Get the current view ID based on grid context
      const currentViewId = (contextSelectedView as any)?.Id || contextSelectedView?.id || null;

      // Skip if no previous view was set (initial mount) or view hasn't actually changed
      if (!prevSelectedViewRef.current || currentViewId === prevSelectedViewRef.current) {
         prevSelectedViewRef.current = currentViewId;
         return;
      }

      prettyPrint('[TS] View changed - resetting initialization to rebuild grid', {
         previousView: prevSelectedViewRef.current,
         newView: currentViewId,
         isSubgrid,
      }, 'purple');

      // Reset the initialization flag so initializeView will run again
      isInitialDataLoaded.current = false;
      setInitialDataLoaded(false);

      // Clear transposed options so they rebuild based on new view columns
      setTransposedColumnOptions([]);
      prevSelectedTransposedColumn.current = null as any;

      // Update the previous view ref
      prevSelectedViewRef.current = currentViewId;
   }, [contextSelectedView, isSubgrid, setTransposedColumnOptions]);

   // load main grid when the selected object changes (skip on initial mount)
   useEffect(() => {
      const objectChangedHandler = async (msg: any, data: OrgObject) => {
         try {
            setLoading(true);

            setInitialDataLoaded(false);

            setTimeSeriesGridCreated(false);

            setSelectedObject(data);

            // Clear previous object-specific artifacts
            setTransposedRowData([]);

            setColumnDefs([]);

            setFilteredColumnDefs([]);

            prevColumnDefs.current = [];

            (transposedRowDataRef as any).current = [] as any;

            // Clear selectors so user/prefs can re-drive the grid for the new object
            setSelectedTransposedColumn(null as any);

            setTransposedColumnOptions([]);

            setSelectedTimeSeriesFilter(null as any);

            setTimeSeriesFilterOptions([]);

            // Reset preference tracking
            timeSeriesGridPreferenceRecId.current = null;

            prevSelectedTransposedColumn.current = null as any;

            if (!isSubgrid) {
               setSelectedGridType({
                  name: 'timeSeriesView',
                  label: 'Time Series'
               });
            }


            setSelectedTimeSeriesFilter(null);

            setFilterOptions([]);

            // Note: queryOptions are managed by AppGrid, don't clear them here

            setSelectedSubgridType({
               name: 'gridView',
               label: 'Grid'
            });
         } catch (error: any) {
            const errorMessage = error?.message || 'An unknown error occurred';

            enqueueSnackbar(errorMessage, {
               action: action,
               variant: 'error'
            });
         } finally {
            setLoading(false);
         }
      };

      const objectChangedToken = PubSub.subscribe(
         'ObjectSelectionChanged',
         objectChangedHandler
      );

      return () => {
         PubSub.unsubscribe(objectChangedToken);
      };
   }, [action, enqueueSnackbar, isSubgrid, setFilterOptions, setLoading, setSelectedGridType, setSelectedObject, setSelectedSubgridType, setSelectedTimeSeriesFilter, setSelectedTransposedColumn, setTimeSeriesFilterOptions, setTransposedColumnOptions, setTransposedRowData]);

   // load views
   useEffect(() => {
      if (isSubgrid) {
         prettyPrint('[timeSeriesGrid] - load views exiting. view is subgrid', null, 'red')
         return;
      }

      const objName = selectedObject?.qualifiedApiName || selectedObjMetadata?.apiName;

      if (!objName) {
         prettyPrint('[timeSeriesGrid] - load views exiting. objName not found', null, 'red')
         return;
      };

      let alive = true;

      const normalizeId = (val: any) => {
         if (!val) return '';

         const str = String(val);

         return str.length > 15 ? str.substring(0, 15) : str;
      };

      const loadViews = async () => {
         try {
            prettyPrint('[timeSeriesGrid] - loading views', null, 'red')

            const viewsPromise = apiClient.getObjViews({ sObjectName: String(objName), isSubgridView: false });

            const prefsPromise = typeof apiClient.getObjGridPrefs === 'function'
               ? apiClient.getObjGridPrefs({ sObjectName: String(objName), isSubgridView: isSubgrid })
               : Promise.resolve([]);

            const [viewsResult, prefsResult] = await Promise.all([viewsPromise, prefsPromise]);

            const normalizedViews = Array.isArray(viewsResult) ? viewsResult : [];

            // prettyPrint('[timeSeriesGrid] - setting viewOptions to', normalizedViews, 'blue')

            setViewOptions(normalizedViews);

            if (normalizedViews.length === 0) {
               setSelectedView(null);

               setSelectedViewRecordId('');
               return;
            }

            const currentView = useStore.getState().selectedView as any;

            const matchExisting = currentView
               ? normalizedViews.find((view: any) => {
                  const vid = normalizeId(view.id || view.Id);

                  const currId = normalizeId(currentView.id || currentView.Id);
                  if (vid && currId && vid === currId) return true;

                  return view.name && currentView.name && view.name === currentView.name;
               }) || null
               : null;

            let nextView: any = matchExisting;

            if (!nextView) {
               const prefRec = Array.isArray(prefsResult) && prefsResult.length === 1 ? prefsResult[0] : null;

               if (prefRec) {
                  const lastViewUsed = (prefRec as any)?.lastViewUsed || (prefRec as any)?.AppGridAg__LastViewUsed__c || (prefRec as any)?.lastViewId;

                  if (lastViewUsed) {
                     const normLast = normalizeId(lastViewUsed);

                     nextView =
                        normalizedViews.find((view: any) => normalizeId(view.id || view.Id) === normLast) ||
                        normalizedViews.find((view: any) => view.name === lastViewUsed) ||
                        null;
                  }
               }
            }

            if (!nextView) {
               nextView = normalizedViews[0] || null;
            }

            if (nextView) {
               const currentState = useStore.getState().selectedView as any;

               const currentId = normalizeId(currentState?.id || currentState?.Id);

               const nextId = normalizeId(nextView.id || nextView.Id);

               if (nextId !== currentId) {
                  setSelectedView(nextView as any);
               }

               const recordId = nextView.id || nextView.Id || '';

               if (recordId) {
                  const recordIdStr = String(recordId);

                  setSelectedViewRecordId(recordIdStr);
                  setLastViewId(recordIdStr);
               }
            } else {
               setSelectedView(null);

               setSelectedViewRecordId('');
            }
         } catch (error: any) {
            if (!alive) {
               return;
            };
            const message = error?.message || 'Error loading views';

            enqueueSnackbar(message, { action, variant: 'error' });
            setViewOptions([]);
         }
      };

      loadViews();

      return () => {
         alive = false;
      };
   }, [active, apiClient, enqueueSnackbar, isSubgrid, selectedObject?.qualifiedApiName, selectedObjMetadata?.apiName, action, setLastViewId, setSelectedView, setSelectedViewRecordId, setViewOptions]);

   // Load base records for the selected object/query
   const fetchTimeSeriesData = useCallback(async () => {
      try {
         if (!sObjectName) {
            return;
         }

         // Ensure metadata for the target sObject (subgrid may differ from main grid)
         let metaToUse: SObjectMetadata | null = null;

         if (isSubgrid) {
            metaToUse = objMetadataMap.current?.get(String(sObjectName)) || null;

            if (!metaToUse) {
               try {
                  metaToUse = await apiClient.getMetadata({ sObjectName: String(sObjectName) });

                  objMetadataMap.current?.set(String(sObjectName), metaToUse as SObjectMetadata);
               } catch (e) {
                  prettyPrint('[TimeSeriesGrid] Failed fetching metadata for subgrid sObject', String(sObjectName), 'red');

                  throw e;
               }
            }
         } else {
            metaToUse = selectedObjMetadata as SObjectMetadata | null;
         }

         if (!metaToUse) {
            return;
         }

         let apiResult: any = null;

         if (!isSubgrid) {
            if (!selectedQuery || !selectedQuery.queryRule) {
               return;
            }

            const ruleStr = selectedQuery.queryRule as string;

            const ruleObj = JSON.parse(decode(ruleStr));

            let subRuleObj: any = null;

            if (selectedQuery.relationQueryRule) {
               subRuleObj = JSON.parse(decode(selectedQuery.relationQueryRule as string));
            }

            // Resolve the relationship name from metadata if not explicitly saved on the query
            const resolveRelationName = (childApi?: string | null): string | null => {
               if (!childApi) return null;
               const metadataRelation = (selectedObjMetadata as any)?.childRelationships?.find(
                  (rel: any) => rel?.childSObject === childApi
               );
               return metadataRelation?.relationshipName || childApi;
            };

            const relationApiName = selectedQuery.relationSObjectApiName as string | undefined;
            const relationRelationshipName: string | undefined =
               (selectedQuery.relationRelationshipName as string) || resolveRelationName(relationApiName) || undefined;

            // Get parentFields from selected view if available
            const viewToUse = isSubgrid ? selectedSubgridView : selectedView;
            const parentFieldsParam = viewToUse?.parentFields || null;

            const paramsObj: QueryServiceParams = {
               sObjectName: sObjectName,
               queryRule: JSON.stringify(ruleObj),
               subQueryRule: subRuleObj ? JSON.stringify(subRuleObj) : null,
               subQueryRelation: subRuleObj && relationRelationshipName ? relationRelationshipName : null,
               parentFields: parentFieldsParam,
            };

            apiResult = await apiClient.executeDynamicSOQL(paramsObj);
         } else {
            // Subgrid path: require parent row
            if (!selectedParentRow?.Id) {
               return;
            }

            // Determine the parent object API name
            const parentApi = parentObjectApiName || undefined;

            // Derive lookup field on child referencing parent using resolved metadata
            const relField = metaToUse!.fields.find((f: any) => f.type === 'REFERENCE' && (f.referenceTo || []).includes(parentApi!));

            if (!relField) {
               return;
            }

            const rule = {
               condition: 'and',
               rules: [
                  { label: relField.name, field: relField.name, operator: 'equal', type: 'string', value: selectedParentRow.Id }
               ],
               not: false
            };

            const paramsObj: QueryServiceParams = {
               sObjectName: sObjectName,
               queryRule: JSON.stringify(rule),
               subQueryRule: null,
               subQueryRelation: null,
            };

            apiResult = await apiClient.executeDynamicSOQL(paramsObj);
         }

         if (apiResult.status !== 'success') {
            throw new Error(apiResult.errorMessage || 'TimeSeriesGrid query failed');
         }

         // Decode and convert using resolved metadata
         const fieldTypeMap = buildFieldTypeMap(metaToUse!.fields);

         const normalized = decodeAndConvertRecords(apiResult.records, fieldTypeMap);

         setRowDataCopy(normalized);
      } catch (error: any) {
         enqueueSnackbar(error?.message || 'Error loading time series data', {
            action,
            variant: 'error'
         });
      }
   }, [action, apiClient, enqueueSnackbar, isSubgrid, objMetadataMap, parentObjectApiName, selectedParentRow?.Id, selectedQuery, sObjectName, selectedObjMetadata, selectedSubgridView, selectedView]);

   // Ensure subgrid view is selected from existing views (loaded by SubgridCore or SubgridViewSelector)
   // NOTE: TimeSeriesGrid does NOT load or create views - it relies on SubgridCore or the view selector to have
   // already loaded views into subgridViewOptionsByRelation. This prevents duplicate "Default View" creation
   // and ensures TimeSeriesGrid shares the same views as SubgridCore (Grid type).
   useEffect(() => {
      if (!isSubgrid || !sObjectName || !sObjectApiName) {
         return;
      }

      // If a view is already selected, nothing to do
      if (selectedSubgridView) {
         prettyPrint('[TimeSeriesGrid:ViewSelector] View already selected:', (selectedSubgridView as any)?.Name || (selectedSubgridView as any)?.name, 'green');
         return;
      }

      // Read existing view options from per-relation state (populated by SubgridCore or SubgridViewSelector)
      const existingViewOptions = useStore.getState().subgridViewOptionsByRelation[sObjectApiName] || [];

      if (existingViewOptions.length > 0) {
         // Views exist in state - select the appropriate one
         prettyPrint('[TimeSeriesGrid:ViewSelector] Found existing views in state:', existingViewOptions.length, 'green');

         // Try to get the last used view from grid prefs
         (async () => {
            try {
               const prefs = typeof apiClient.getObjGridPrefs === 'function'
                  ? await apiClient.getObjGridPrefs({ sObjectName: String(sObjectName), isSubgridView: true })
                  : [];

               const pref = Array.isArray(prefs) && prefs.length === 1 ? prefs[0] : null;
               const lastViewId = (pref as any)?.AppGridAg__LastViewUsed__c;

               let viewToUse: any = existingViewOptions[0];

               if (lastViewId) {
                  const found = existingViewOptions.find((v: any) => (v.Id || v.id) === lastViewId);
                  if (found) viewToUse = found;
               }

               prettyPrint('[TimeSeriesGrid:ViewSelector] Selecting view:', (viewToUse as any)?.Name || (viewToUse as any)?.name, 'green');
               setSelectedSubgridView(viewToUse);
            } catch (e) {
               prettyPrint('[TimeSeriesGrid:ViewSelector] Error getting prefs, using first view', e, 'orange');
               setSelectedSubgridView(existingViewOptions[0]);
            }
         })();
      } else {
         // No views in state yet - this means SubgridCore hasn't loaded them
         // Just log and wait - SubgridViewSelector will trigger a load when rendered
         prettyPrint('[TimeSeriesGrid:ViewSelector] No views in state yet, waiting for SubgridViewSelector to load views...', null, 'orange');
      }
   }, [apiClient, isSubgrid, sObjectApiName, sObjectName, selectedSubgridView, setSelectedSubgridView]);

   // Persist LastViewUsed when the subgrid view changes (like SubgridCore)
   useEffect(() => {
      if (!isSubgrid) {
         return;
      }

      if (!selectedSubgridView) {
         return;
      };

      const lastViewId = (selectedSubgridView as any)?.id || (selectedSubgridView as any)?.Id;

      if (!lastViewId || !sObjectName) {
         return;
      };

      (async () => {
         try {
            const payload: any = {
               AppGridAg__SObjectApiName__c: String(sObjectName),
               AppGridAg__IsSubgridView__c: true,
               AppGridAg__LastViewUsed__c: String(lastViewId),
            };
            if (gridPrefRecIdRef.current) payload.Id = gridPrefRecIdRef.current;

            const res = await apiClient.upsertRecs(
               {
                  sObjectName: 'AppGridAg__AG_Grid_Prefs__c', jsonRecs: JSON.stringify([payload]),
               });

            if (res.status === 'success' && res.results.length === 1 && res.results[0]?.isSuccess) {
               const rid = res.results[0].recordId;

               if (rid) gridPrefRecIdRef.current = String(rid);
            }
         } catch (e) {
            prettyPrint('[TimeSeriesGrid] error saving LastViewUsed', (e as any)?.message || String(e), 'orange');
         }
      })();
   }, [apiClient, isSubgrid, selectedSubgridView, sObjectName]);

   // Respond to external RunQuery events for parity with existing publishes
   useEffect(() => {
      const token = PubSub.subscribe('RunQuery', () => {
         fetchTimeSeriesData();
      });
      return () => {
         PubSub.unsubscribe(token);
      }
   }, [fetchTimeSeriesData]);

   // Respond to RefreshSubgridQuery events (for subgrid mode refresh after add/edit)
   useEffect(() => {
      if (!isSubgrid) return;
      const token = PubSub.subscribe('RefreshSubgridQuery', () => {
         fetchTimeSeriesData();
      });
      return () => {
         PubSub.unsubscribe(token);
      }
   }, [fetchTimeSeriesData, isSubgrid]);

   // Fast metadata lookup map
   const fieldMetadataMap = useMemo(() => {
      const map = new Map<string, SObjectFieldMetadata>();

      const fields = resolvedObjMetadata?.fields || [];

      for (const f of fields) map.set(f.name, f);
      return map;
   }, [resolvedObjMetadata?.fields]);

   // Format transposed header labels consistently
   const formatTransposedHeaderLabel = useCallback((val: any): string => {
      const transposeFieldName = selectedTransposedColumn?.name;

      const transposeMeta = transposeFieldName ? fieldMetadataMap.get(transposeFieldName) : undefined;

      const ft = transposeMeta?.type;

      if (ft === 'DATE' || ft === 'DATETIME') {
         if (!val) return '';

         const d = typeof val === 'string' || typeof val === 'number' ? new Date(val) : val;

         return isNaN(d?.getTime?.()) ? String(val ?? '') : dateFormatter.format(d);
      }
      if (ft === 'CURRENCY') return val != null ? currencyFormatter.format(val) : '';

      if (ft === 'DECIMAL' || ft === 'DOUBLE' || ft === 'INTEGER' || ft === 'LONG') {
         return val != null && !isNaN(Number(val)) ? numberFormatter.format(val) : '';
      }

      if (ft === 'PERCENTAGE') return val != null ? percentageFormatter.format(val) : '';

      return val == null ? '' : String(val);
   }, [currencyFormatter, dateFormatter, fieldMetadataMap, numberFormatter, percentageFormatter, selectedTransposedColumn?.name]);

   // Cache: Id -> fieldKey (e.g., 'field3') for quick error mapping - use utility function
   const idToFieldKeyMapRef = useRef<Map<string, string>>(new Map());

   useEffect(() => {
      try {
         const map = buildIdToFieldKeyMap(transposedRowData);
         idToFieldKeyMapRef.current = map;
      } catch {
         idToFieldKeyMapRef.current = new Map();
      }
   }, [transposedRowData]);

   // Persist grid state/preferences using shared hook
   const {
      saveAgGridState,
      handleGridStateChange,
   } = useGridStatePersistence({
      getGridApi: () => gridApiRef.current || gridApi,
      canSaveNow: () => {
         const so = selectedObject as any;

         const storeApiName: string | undefined = isSubgrid
            ? String(sObjectName || '')
            : (typeof so === 'string' ? so : (so?.QualifiedApiName || so?.qualifiedApiName || so?.apiName));
         const metaApiName = resolvedObjMetadata?.apiName || (sObjectName ? String(sObjectName) : undefined);

         return (
            enableStateSaving.current === true &&
            timeSeriesGridCreated === true &&
            !!metaApiName &&
            (storeApiName ? storeApiName === metaApiName : true)
         );
      },
      setCurrentState: (state) => setCurrentState(state as unknown as CurrentState),
      buildUpsertPayload: (gridState, colState) => {
         const payload: Record<string, any> = {
            AppGridAg__SObjectApiName__c: sObjectName || '',
            AppGridAg__User__c: userInfo!.userId,
            AppGridAg__GridState__c: JSON.stringify(colState ?? []),
            AppGridAg__IsSubgridView__c: isSubgrid
         };

         if (selectedTransposedColumn?.name) {
            payload['AppGridAg__TransposedColumn__c'] = selectedTransposedColumn?.name;
            prettyPrint('[saveAgGridState] - setting transposedColumn to', selectedTransposedColumn?.name, 'purple')
         }

         if (selectedTimeSeriesFilter) {
            payload['AppGridAg__SelectedFilter__c'] = selectedTimeSeriesFilter.name;
         }
         if (timeSeriesFilterOptions) {
            payload['AppGridAg__SavedFilters__c'] = JSON.stringify(timeSeriesFilterOptions);
         }
         if (timeSeriesGridPreferenceRecId.current) {
            payload['Id'] = timeSeriesGridPreferenceRecId.current as string;
         }
         return payload;
      },
      doUpsert: async (payload) => {
         const param: UpsertServiceParams = {
            sObjectName: 'AppGridAg__AG_TimeSeriesGrid_Pref__c',
            jsonRecs: JSON.stringify([payload]),
         };

         const result = await apiClient.upsertRecs(param);

         const ok = result.status === 'success' && result.results.length === 1 && result.results[0]?.isSuccess === true;
         const id = result.results?.[0]?.recordId || '';

         return { success: !!ok, id };
      },
      onAfterSuccess: (id) => {
         if (id && !timeSeriesGridPreferenceRecId.current) {
            timeSeriesGridPreferenceRecId.current = id;
         }
         // reset the flag after any save completes
         saveFromTransposeRef.current = false;
      },
      setIsQueryActive: (v: boolean) => setIsQueryActive(v),
      enqueueSnackbar: (msg, opts) => enqueueSnackbar(msg, opts),
      action,
      getExtras: () => ({
         columnStyles: null,
         rowStyles: null,
         calculatedColumns: null,
         filterOptions: timeSeriesFilterOptions,
      }),
   });

   // Permissions helper
   const objPerms = useObjectPermissions(isSubgrid ? String(sObjectName || '') : selectedObject, { metadata: resolvedObjMetadata });

   // Toolbar handlers mapped to shared events
   const handleDeleteToolbar = useCallback(async () => {
      try {
         const g = objPerms.guard('delete');

         if (!g.allowed) throw new Error(g.message);

         if (selectedRows.length === 0) {
            enqueueSnackbar('Please select a record to delete.', { action, variant: 'error' });
            return;
         }
         setShowDeleteRecordDialog(true);
      } catch (e: any) {
         enqueueSnackbar(e?.message || 'Delete not allowed', { action, variant: 'error' });
      }
   }, [action, enqueueSnackbar, objPerms, selectedRows, setShowDeleteRecordDialog]);

   const handleEditToolbar = useCallback(async (recordId?: string | null) => {
      try {
         const g = objPerms.guard('edit');

         if (!g.allowed) throw new Error(g.message);

         // If a specific recordId is provided (from column header edit), use it to find the record
         if (recordId) {
            const rec = rowDataCopy.find((r: any) => r.Id === recordId);

            if (!rec) throw new Error('Record not found.');

            setSelectedRow({
               column: '',
               row: rec
            });
         } else {
            // Otherwise use the selected rows (original behavior)
            if (selectedRows.length > 1) throw new Error('Please select a single record.');

            if (selectedRows.length === 0) throw new Error('Please select a record to edit.');

            setSelectedRow(selectedRows[0]);
         }

         setGridEditDialogState({
            show: true,
            gridId: gridId,
            isSubgrid: isSubgrid,
            selectedView: isSubgrid ? selectedSubgridView! : selectedView!
         });
      } catch (e: any) {
         enqueueSnackbar(e?.message || 'Edit not allowed', { action, variant: 'error' });
      }
   }, [action, enqueueSnackbar, gridId, isSubgrid, objPerms, rowDataCopy, selectedRows, selectedSubgridView, selectedView, setGridEditDialogState]);

   const handleSaveToolbar = useCallback(async () => {
      // Reuse existing save flow by publishing the time series save topic
      PubSub.publish('SaveTimeSeriesRecords');
   }, []);

   useGridToolbarEvents({
      context: isSubgrid ? 'subgrid' : 'main',
      gridId,
      onEdit: handleEditToolbar,
      onSave: handleSaveToolbar,
      onDelete: handleDeleteToolbar,
   });

   const cellSelection: CellSelectionOptions = useMemo(() => {
      return {
         handle: {
            mode: 'fill',
            direction: 'x', // Fill Handle can only be dragged horizontally
            setFillValue({
               column,
               rowNode,
            }: FillOperationParams) {
               // get the field name from the transposed row data
               const fieldName = rowNode.data.property;

               // get the field metadata
               const fieldMetadata = fieldMetadataMap.get(String(fieldName));

               if (!fieldMetadata?.isUpdateable) {
                  return false;
               }

               if (fieldMetadata && fieldMetadata.type === 'REFERENCE' && fieldMetadata.relationshipName) {
                  const relationName = fieldMetadata.relationshipName as string;

                  // get the transposed Id row
                  const idRow = transposedRowData.find(
                     (f: any) => f.property === 'Id'
                  );

                  if (idRow) {
                     // get the column index
                     const colName = currentCellInfo.current!.column.getColId();

                     // get the record Id value of the source column
                     const idVal = idRow[colName];

                     // Find the record in rowDataCopy
                     const rowIndex = rowDataCopy.findIndex(
                        (f: SObject) => f.Id === idVal
                     );

                     // get the rowDataCopy record for this Id
                     const normalizedRow = rowDataCopy.find(
                        (f: SObject) => f.Id === idVal
                     );

                     // get the relation object from the currentCellInfo
                     const relationObj = (normalizedRow as any)?.[relationName];

                     // now we need to update the relation in the current row being processed
                     const currentColName = column.getColId();


                     // get the record Id for this column
                     const currentRecId = idRow[currentColName];

                     // get the rowDataCopy record for this Id
                     const currentNormalizedRow = rowDataCopy.find(
                        (f: SObject) => f.Id === currentRecId
                     );

                     currentNormalizedRow![relationName] = relationObj;

                     // Update rowData
                     const newRowData = [...rowDataCopy];
                     newRowData[rowIndex] = currentNormalizedRow!;

                     setRowDataCopy(newRowData);

                     return false
                  }
               } else {
                  return false;
               }
            }
         }
      };
   }, [fieldMetadataMap, rowDataCopy, transposedRowData]);

   // error map key is the column name
   const [rowErrors, setRowErrors] = React.useState(new Map<string, string>());

   // Method to add an error to the Map
   const addError = (columnId: string, errorMessage: string) => {
      setRowErrors((prevErrors) => {
         // Create a new Map from the previous one to avoid mutating state directly
         const newErrors = new Map(prevErrors);

         newErrors.set(columnId, errorMessage);

         return newErrors;
      });
   };

   // Use shared container helpers for sidebar/status bar
   const { statusBar } = useGridContainer({
      isSubgrid: !!isSubgrid,
      setPivotMode: () => { },
      handleGridStateChange: () => { },
      includeStatusBar: true,
   });

   const objectsWithoutNameFieldMap = useMemo(() => {
      return new Map([
         ['02i', 'Asset'], // Asset (Prefix '02x', uses AssetNumber)
         ['500', 'Case'], // Case (Prefix '003', uses CaseNumber)
         ['800', 'Contract'], // Contract (Prefix '00T', uses ContractNumber)
         ['3tt', 'Invoice'], // Invoice (Prefix '03x', uses InvoiceNumber)
         ['801', 'Order'], // Order (Prefix '801', uses OrderNumber)
         ['01t', 'Product2'], // Product2 (Prefix '01P', uses ProductCode)
         ['0Q0', 'Quote'], // Quote (Prefix '0Q0', uses QuoteNumber)
         ['501', 'Solution'] // Solution (Prefix '500', uses SolutionName)
         // Add more SObjects here if needed
      ]);
   }, []);

   const nameFieldMap = useMemo(() => {
      return new Map([
         ['Asset', 'AssetNumber'],
         ['Case', 'CaseNumber'],
         ['Contract', 'ContractNumber'],
         ['Invoice', 'InvoiceNumber'],
         ['Order', 'OrderNumber'],
         ['Product2', 'ProductCode'],
         ['Quote', 'QuoteNumber'],
         ['Solution', 'SolutionNumber']
         // Add more mappings here if needed
      ]);
   }, []);

   // Default column definition — avoid flex when using autoSizeStrategy (memoized to prevent unnecessary re-renders)
   const defaultColDef = useMemo(() => ({
      minWidth: 150,
      resizable: true,
      editable: true,
      cellDataType: false,
   }), []);

   const getSelectedViewColumns = useMemo(() => {
      try {
         let columnStateStr = '' as string;

         if (isSubgrid) {
            prettyPrint('[getSelectedViewColumns] isSubgrid, selectedSubgridView:', selectedSubgridView, 'blue');
            prettyPrint('[getSelectedViewColumns] selectedSubgridView?.columnState:', (selectedSubgridView as any)?.columnState, 'blue');
            prettyPrint('[getSelectedViewColumns] selectedSubgridView?.AppGridAg__Column_State__c:', (selectedSubgridView as any)?.AppGridAg__Column_State__c, 'blue');
            columnStateStr = (selectedSubgridView as any)?.columnState || (selectedSubgridView as any)?.AppGridAg__Column_State__c || '';
         } else {
            columnStateStr = (selectedView as any)?.columnState || (selectedView as any)?.AppGridAg__Column_State__c || '';
         }

         prettyPrint('[getSelectedViewColumns] columnStateStr length:', columnStateStr?.length, 'blue');

         if (!columnStateStr) return [] as ColumnState[];

         let savedColumnState: ColumnState[] | null = null;

         try {
            savedColumnState = JSON.parse(decode(columnStateStr)) as ColumnState[];
         } catch {
            savedColumnState = JSON.parse(columnStateStr) as ColumnState[];
         }

         prettyPrint('[getSelectedViewColumns] parsed savedColumnState count:', savedColumnState?.length, 'blue');

         if (!Array.isArray(savedColumnState)) return [] as ColumnState[];

         const columns = savedColumnState.filter(
            (f: ColumnState) =>
               !f.hide &&
               f.colId !== 'error' &&
               f.colId !== 'ag-Grid-SelectionColumn' &&
               !String(f.colId || '').includes('AutoColumn') &&
               !f.rowGroup
         );

         prettyPrint('[getSelectedViewColumns] filtered columns count:', columns.length, 'blue');

         return columns;
      } catch (e) {
         prettyPrint('[getSelectedViewColumns] ERROR:', (e as any)?.message, 'red');
         return [] as ColumnState[];
      }
   }, [isSubgrid, selectedSubgridView, selectedView]);

   const autosizeColumns = useCallback(
      (skipHeader: boolean) => {
         const api = gridApiRef.current || gridApi;
         if (!api || (api as any).isDestroyed?.()) return;

         const allColumnIds: string[] = [];

         api.getColumns()?.forEach((c) => allColumnIds.push(c.getId()));

         api.autoSizeColumns(allColumnIds, skipHeader);
      },
      [gridApi, gridApiRef]
   );

   const setTimeSeriesFilterActive = useCallback(
      (active: boolean) => {
         if (isSubgrid) {
            setIsSubgridTimeSeriesFilterActive(active);
         } else {
            setIsMainTimeSeriesFilterActive(active);
         }
      },
      [isSubgrid, setIsMainTimeSeriesFilterActive, setIsSubgridTimeSeriesFilterActive]
   );

   // onGridReady provided by useAgGridApi

   const { deleteRecords: performDelete } = useDeleteRecords({
      getGridApi: () => gridApiRef.current || gridApi,
      guardDelete: () => objPerms.guard('delete'),
      apiDelete: async (ids, sObjectName) => {
         return await apiClient.deleteRecs({
            recordIds: ids,
            sObjectName: sObjectName!,
         });
      },
      enqueue: (msg, opts) => enqueueSnackbar(msg, { ...opts, action }),
   });

   // Use clearChangedRows from the hook instead
   const clearChangedRows = clearChangedRowsHook;

   const clearSelectedRows = useCallback(() => {
      setSelectedRows([]);
   }, []);

   const addSelectedRow = (newRow: SelectedRow) => {
      setSelectedRows((prevSelectedRows) => {
         // Check if the row already exists to avoid duplicates
         const rowExists = prevSelectedRows.some(
            (row) => row.column === newRow.column
         );

         if (!rowExists) {
            return [...prevSelectedRows, newRow];
         }

         return prevSelectedRows; // If the row already exists, return the previous state unchanged
      });
   };

   const removeSelectedRow = (column: string) => {
      setSelectedRows((prevSelectedRows) => {
         return prevSelectedRows.filter(
            (selectedRow) => !(selectedRow.column === column)
         );
      });
   };

   // event handlers
   const gridEvents = useGridEvents({ handleGridStateChange });

   const onFillStart = useCallback((event: FillStartEvent) => {
      const focusedColumn = event.api.getFocusedCell()?.column.getColId();

      fillHandleFocusedColumn.current = focusedColumn!;
   }, []);

   // callback function when delete filter is confirmed
   const onFilterDeleteConfirmation = useCallback(
      async (confirmed: boolean) => {
         if (!confirmed) {
            return;
         }

         try {
            const filterOptionsCopy = _.cloneDeep(timeSeriesFilterOptions);

            const newFilterOptions = filterOptionsCopy.filter(
               (o: TimeSeriesFilterOption) =>
                  o.name !== selectedTimeSeriesFilter!.name
            );

            setTimeSeriesFilterOptions(newFilterOptions);

            setSelectedTimeSeriesFilter(null);

            saveAgGridState();

            PubSub.publish('ClearTimeSeriesFilter', null);
         } catch {
            enqueueSnackbar('Error deleting filter', {
               action: action,
               variant: 'error'
            });
         }
      },
      [
         timeSeriesFilterOptions,
         setTimeSeriesFilterOptions,
         setSelectedTimeSeriesFilter,
         saveAgGridState,
         selectedTimeSeriesFilter,
         enqueueSnackbar,
         action
      ]
   );

   const onFilterModified = (event: FilterModifiedEvent) => {
      const { api, column, context, filterInstance } = event;
      prettyPrint('[TimeSeriesGrid] onFilterModified', { api, column, context, filterInstance }, 'blue');
   };

   // Use utility function for finding field keys by value

   // callback function when delete records is confirmed
   const onRecordDeleteConfirmation = useCallback(
      async (confirmed: boolean) => {
         if (!confirmed) {
            return;
         }

         try {
            // Get the selected rows' IDs, filtering out undefined/null/invalid
            const recIdsToDelete = selectedRows
               .map((item: SelectedRow) => item.row.Id)
               .filter((id): id is string => id != null && !id.startsWith('0000')); // Type guard

            if (recIdsToDelete.length === 0) {
               enqueueSnackbar('No valid record IDs selected for deletion', {
                  action,
                  variant: 'warning',
               });
               return;
            }

            // prettyPrint('[TimeSeriesGrid] onRecordDeleteConfirmation - record Ids to delete are', recIdsToDelete, 'blue')


            const deleteResult = await performDelete(
               recIdsToDelete,
               sObjectName as string
            );

            let hasErrors = false;

            // prettyPrint('[TimeSeriesGrid] onRecordDeleteConfirmation - delete result is', deleteResult, 'blue')

            // Inspect each record for errors
            for (const res of deleteResult) {
               if (!res.isSuccess) {
                  hasErrors = true;

                  // find the column with this Id
                  const idRow = transposedRowData.find(
                     (rec: any) => rec.property === 'Id'
                  );

                  if (!idRow) {
                     enqueueSnackbar('TimeSeriesGrid Error - did not find Id row', {
                        action: action,
                        variant: 'error'
                     });
                     break;
                  }

                  // get the column
                  if (idRow) {
                     // Use cached id->fieldKey mapping for fast lookup
                     const idColumn = idToFieldKeyMapRef.current.get(res.id) || findFieldKeyByValue(idRow, res.id);

                     if (!idColumn) {
                        enqueueSnackbar(
                           'TimeSeriesGrid Error - did not find Id column',
                           {
                              action: action,
                              variant: 'error'
                           }
                        );
                        break;
                     }

                     if (idColumn) {
                        addError(idColumn, `ERROR - ${res.errors[0]}`);
                     }
                  }
               }
            }

            if (hasErrors) {
               // Notify user of success
               enqueueSnackbar('Error deleting records!', {
                  autoHideDuration: 3000,
                  variant: 'warning'
               });

               // Show the error column
               setShowErrorRecs(true);
            }

            if (!hasErrors) {
               // Notify user of success
               enqueueSnackbar('Records deleted!', {
                  autoHideDuration: 3000,
                  variant: 'success'
               });

               // Reload the query - pass empty object to trigger refresh
               setQueryRuleModified({});

               // send event to AppViewRouter
               PubSub.publish('RunQuery')

               // clear changed rows
               clearChangedRows();

               setLoading(false);
            }
         } catch (error: any) {
            enqueueSnackbar(`Error deleting records - ${error.message}`, {
               action: action,
               variant: 'error'
            });
         }
      },
      [action, clearChangedRows, performDelete, enqueueSnackbar, selectedRows, setLoading, setQueryRuleModified, transposedRowData, sObjectName]
   );

   // Use the utility function for reverse transpose
   const reverseTranspose = useCallback((transposedData: Record<string, any>[]): SObject[] => {
      return reverseTransposeUtil(transposedData as any);
   }, []);

   // load initial data
   useEffect(() => {
      fetchTimeSeriesData();
   }, [fetchTimeSeriesData]);


   // allows users to create Salesforce records from Excel data
   const processDataFromClipboard = useCallback(
      (params: ProcessDataFromClipboardParams): string[][] | null => {
         const createGridCols = async (
            numColsToCreate: number,
            startColIndex: number
         ) => {
            const colDefs: ColDef[] = [];

            // Start the column index from the current column index or 1 if not defined
            let currentColumnIndex = startColIndex;

            for (let i = 0; i < numColsToCreate; i++) {
               const lookupProps = {
                  transposedColName: `field${currentColumnIndex}`,
                  objMetadataFields: resolvedObjMetadata?.fields || [],
                  rowData: rowDataCopy,
                  changedRows: changedRows
               };

               // Compute a header label using the transposed column value when available
               const transposedRow = transposedRowDataRef.current?.find((r: any) => r?.property === selectedTransposedColumn?.name);

               const rawHeaderVal = transposedRow ? transposedRow[`field${currentColumnIndex}`] : null;

               const computedHeaderLabel = formatTransposedHeaderLabel(rawHeaderVal) || '';

               const newColumnDef: ColDef = {
                  field: `field${currentColumnIndex}`,
                  headerName: `field${currentColumnIndex}`,
                  headerTooltip: computedHeaderLabel,
                  editable: (params) => {
                     const fn = params?.data?.property;

                     const meta = fieldMetadataMap.get(String(fn));

                     return !!meta?.isUpdateable;
                  },
                  sortable: false,
                  hide: false,
                  width: 200,
                  minWidth: 200,
                  valueFormatter: ({ value, data, column }) => {
                     if (!value) return value; // Handle empty values gracefully

                     // get the property name
                     const fieldName = data['property'];

                     // determine type from metadata
                     const objMetadataField = fieldMetadataMap.get(String(fieldName));

                     const fieldType = objMetadataField!.type;

                     // Render MULTIPICKLIST as labels joined by '; '
                     if (fieldType === 'MULTIPICKLIST') {
                        try {
                           const opts = (objMetadataField?.picklistValues || []) as any[];
                           const tokens = String(value)
                              .split(';')
                              .map((s) => s.trim())
                              .filter((s) => s.length > 0);

                           const labels = tokens.map((v) => opts.find((o) => o.value === v)?.label || v);

                           return labels.join('; ');
                        } catch { return value; }
                     }

                     // Render PICKLIST/COMBOBOX as label
                     if (fieldType === 'PICKLIST' || fieldType === 'COMBOBOX') {
                        try {
                           const opts = (objMetadataField?.picklistValues || []) as any[];

                           const hit = opts.find((o) => o.value === value);

                           return hit?.label ?? value;
                        } catch { return value; }
                     }

                     if (fieldType === 'REFERENCE') {
                        const relationName = objMetadataField!.relationshipName as string;

                        return displayReference(value, {
                           relationName,
                           columnId: column.getColId(),
                           transposedRowData: transposedRowData || [],
                           rowDataCopy: rowDataCopy || [],
                           objectsWithoutNameFieldMap,
                           nameFieldMap,
                        });
                     }

                     return formatByFieldType(value, fieldType, {
                        dateFormatter,
                        numberFormatter,
                        currencyFormatter,
                        percentageFormatter,
                     });
                  },
                  headerComponent: CustomHeader,
                  headerComponentParams: {
                     rowErrors: rowErrors,
                     showErrorRecs: showErrorRecs
                  },
                  cellEditorSelector: (params) => {
                     const { data } = params;

                     const fieldName = data.property;

                     const objMetadataField = fieldMetadataMap.get(String(fieldName));

                     const fieldType = objMetadataField!.type;

                     switch (fieldType) {
                        case 'BOOLEAN': {
                           return {
                              component: 'agCheckboxCellEditor'
                              // params: { ...lookupProps }
                           };
                        }
                        case 'CURRENCY':
                        case 'DECIMAL':
                        case 'DOUBLE':
                        case 'INTEGER':
                        case 'LONG': {
                           return {
                              component: 'agNumberCellEditor'
                           };
                        }
                        case 'DATE':
                        case 'DATETIME': {
                           return {
                              component: TimeSeriesDateEditor
                           };
                        }
                        case 'COMBOBOX':
                        case 'PICKLIST': {
                           return {
                              component: TimeSeriesSelectEditor
                           };
                        }
                        case 'MULTIPICKLIST': {
                           return {
                              component: TimeSeriesMultiSelectEditor
                           };
                        }
                        case 'REFERENCE': {
                           return {
                              component: TimeSeriesAutocompleteEditor
                           };
                        }
                        default: {
                           return {
                              component: 'agTextCellEditor'
                           };
                        }
                     }
                  },
                  cellEditorParams: { ...lookupProps }
               };

               colDefs.push(newColumnDef);
               currentColumnIndex++;
            }

            // Update columnDefs state with the new column definition
            const updatedColDefs = [...columnDefs, ...colDefs];

            if (gridApi && !(gridApi as any).isDestroyed?.()) {
               gridApi.setGridOption('columnDefs', updatedColDefs);
            }

            setColumnDefs(updatedColDefs);
         };

         const processData = async () => {
            try {
               const data = [...params.data];

               // Remove the last empty row if it exists
               const emptyLastRow =
                  data[data.length - 1][0] === '' && data[data.length - 1].length === 1;
               if (emptyLastRow) {
                  data.splice(data.length - 1, 1);
               }

               const focusedCell = params.api.getFocusedCell();
               if (!focusedCell) {
                  enqueueSnackbar('Please select a cell before pasting', {
                     action: action,
                     variant: 'warning'
                  });
                  return null;
               }

               // calculate number of columns to create
               const maxColumns = Math.max(...data.map((row) => row.length));

               // create the columns
               // note: we already have a dummy column created to support the paste operation
               await createGridCols(maxColumns - 1, 1);

               const updates: DynamicUpdateRow[] = []; // Array to collect all updates

               let currentCol: any = focusedCell!.column;

               // Check if focusedColumn exists before proceeding
               if (!currentCol) {
                  return null;
               }

               data.forEach((row, rowIndex) => {
                  let currentColumn: any = focusedCell!.column;

                  // Get property name from the 'property' column
                  const gridNode: any = gridApi!.getDisplayedRowAtIndex(rowIndex);

                  const gridRow = gridNode.data;

                  const fieldName = gridRow!.property;

                  let updateRow: DynamicUpdateRow = { property: fieldName };

                  row.forEach((item, columnIndex) => {
                     if (!currentColumn) {
                        return;
                     }

                     const fieldMetadata = fieldMetadataMap.get(String(fieldName));

                     if (!fieldMetadata) {
                        throw new Error(`Unexpected error timeSeriesGrid processData() - fieldMetadata not found for field ${fieldName}`);
                     }

                     let convertedValue;

                     switch (fieldMetadata!.type) {
                        case 'BOOLEAN':
                           // Convert various representations of boolean to actual boolean
                           if (item.toLowerCase() === 'true' || item === '1') {
                              convertedValue = true;
                              updateRow[`field${columnIndex}`] = convertedValue;
                           } else if (item.toLowerCase() === 'false' || item === '0') {
                              convertedValue = false;

                              updateRow[`field${columnIndex}`] = convertedValue;
                           } else {
                              // If the input doesn't match expected boolean representations, you might want to log a warning or handle it as you see fit
                              prettyPrint('[TimeSeriesGrid] Invalid boolean value; defaulting to false', item, 'orange');
                              convertedValue = false; // Default to false, adjust as needed
                              updateRow[`field${columnIndex}`] = convertedValue;
                           }
                           break;
                        case 'DATE':
                        case 'DATETIME': {
                           if (item === null || item === undefined || item === '') {
                              return null;
                           }

                           // Regular expression to check for YYYY-MM-DD format
                           const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

                           if (dateRegex.test(item)) {
                              convertedValue = new Date(item);

                              updateRow[`field${columnIndex}`] = convertedValue;
                           } else {
                              throw new Error(`Unexpected error - valueGetter Invalid date string: ${item}`)
                           }
                           break;
                        }
                        case 'ID': {
                           // if item is blank, create dummy Id
                           if (item === '') {
                              const dummyId = createDummyApexId();

                              convertedValue = dummyId;
                           } else {
                              convertedValue = item;
                           }
                           updateRow[`field${columnIndex}`] = convertedValue;

                           break;
                        }
                        case 'CURRENCY':
                        case 'DECIMAL':
                        case 'DOUBLE':
                        case 'INTEGER':
                        case 'LONG':
                        case 'PERCENTAGE':
                           if (item === '') {
                              convertedValue = null;
                           } else {
                              convertedValue = Number(item);
                           }
                           updateRow[`field${columnIndex}`] = convertedValue;
                           break;
                        // Add more cases for other types as needed
                        default:
                           convertedValue = item;
                           updateRow[`field${columnIndex}`] = convertedValue;
                           break;
                     }
                  });

                  updates.push(updateRow); // Add the row to the updates array after processing
               });

               // Apply all collected updates in one transaction
               if (updates.length > 0) {
                  const newRecs = reverseTranspose(updates);
                  setRowDataCopy(newRecs);
               }
            } catch (error: any) {
               enqueueSnackbar(error.message, {
                  action: action,
                  variant: 'error'
               });
            }
         };

         processData();

         return params.data;
      },
      [action, changedRows, columnDefs, currencyFormatter, dateFormatter, enqueueSnackbar, fieldMetadataMap, formatTransposedHeaderLabel, gridApi, nameFieldMap, numberFormatter, objectsWithoutNameFieldMap, percentageFormatter, reverseTranspose, rowDataCopy, rowErrors, resolvedObjMetadata, selectedTransposedColumn?.name, showErrorRecs, transposedRowData]
   );

   // initializeView will run when rowDataCopy loads (handled elsewhere)

   // get initial view data
   useEffect(() => {
      const buildTransposedGridOptions = () => {
         const cols = getSelectedViewColumns;

         const objMetadataFields = resolvedObjMetadata?.fields;

         // Map and filter fieldOptions based on hide property from selectedViewColumns
         const fieldOptions = objMetadataFields
            ?.map((item: SObjectFieldMetadata) => {
               const newOption: PicklistItem = {
                  name: item.name,
                  label: item.label
               };
               return newOption;
            })
            .filter((option: PicklistItem) => {
               // Find the corresponding column in selectedViewColumns
               // Use case-insensitive comparison since DTO may return lowercase colIds
               const column = cols.find((col: any) => col.colId?.toLowerCase() === option.name?.toLowerCase());
               // Only include if column exists and hide is false (exclude if hide is true or undefined)
               return column && column.hide === false;
            })
            // Sort by label for a friendlier UX
            .sort((a: PicklistItem, b: PicklistItem) => (a.label || '').localeCompare(b.label || ''));

         return fieldOptions;
      };

      const getTimeSeriesGridPrefs = async () => {
         const objName = sObjectName;

         const [timeSeriesGridPrefsResult] = await Promise.all([
            apiClient.getObjTimeSeriesGridPreferences({ sObjectName: objName!, isSubgridView: isSubgrid })
         ]);

         if (timeSeriesGridPrefsResult.length > 1) {
            throw new Error(
               'More than 1 timeSeries grid preference record found.  Please contact your administrator'
            );
         }

         if (timeSeriesGridPrefsResult.length === 0) {
            return null;
         }

         return timeSeriesGridPrefsResult[0];
      };

      const initializeView = async () => {
         try {
            if (rowDataCopy.length === 0 || isInitialDataLoaded.current) {
               return;
            }

            // For subgrid mode, wait for view to be loaded before initializing
            // This prevents race condition where initializeView runs before views are fetched
            if (isSubgrid && !selectedSubgridView) {
               prettyPrint('[initializeView] Waiting for subgrid view to load...', null, 'orange');
               return;
            }

            isInitialDataLoaded.current = true;

            setInitialDataLoaded(false);

            enableStateSaving.current = false;

            setFilteredColumnDefs([]);

            setTransposedRowData([]);

            let options = buildTransposedGridOptions() || [];

            setTransposedColumnOptions(options)

            const timeSeriesGridPrefResult = await getTimeSeriesGridPrefs();

            if (!timeSeriesGridPrefResult) {
               // No saved TimeSeries preference: strictly prefer DATE/DATETIME
               const findOptionByName = (n: string) => options.find((o: PicklistItem) => o.name === n) || null;

               let defaultOption: PicklistItem | null = findOptionByName('CreatedDate') || findOptionByName('LastModifiedDate');

               if (!defaultOption && Array.isArray(options) && resolvedObjMetadata?.fields) {
                  // Choose first DATE/DATETIME visible field only
                  const fieldMap = new Map((resolvedObjMetadata?.fields || []).map((f: any) => [f.name, f]));

                  defaultOption = options.find((o: PicklistItem) => {
                     const f = fieldMap.get(o.name);
                     return f && (f.type === 'DATE' || f.type === 'DATETIME');
                  }) || null;
               }

               if (defaultOption) {
                  setSelectedTransposedColumn(defaultOption);
               } else {
                  // No options at all: inform user; build will wait until options exist
                  if (!isSubgrid || active) {
                     enqueueSnackbar('Please select a DATE/DATETIME column to transpose', { action, variant: 'info', autoHideDuration: null });
                  }
               }

               // Allow UI to proceed; if defaultOption set, canBuild will become true and build the grid
               setInitialDataLoaded(true);
               return;
            }

            // store prefRec Id for future upserts
            timeSeriesGridPreferenceRecId.current = timeSeriesGridPrefResult.id as string;

            const prefColName: string | undefined =
               (timeSeriesGridPrefResult as any).transposedColumn;

            if (prefColName) {
               // find option with the prefColName
               const option = options.find((f: PicklistItem) => f.name === prefColName);

               if (option) {
                  prettyPrint('[TS initializeView] - setting selectedTransposedColumn to', option, 'purple')
                  setSelectedTransposedColumn(option)
               }
            }

            // restore saved filters
            if (timeSeriesGridPrefResult.savedFilters) {
               const savedFilters = JSON.parse(
                  decode(timeSeriesGridPrefResult.savedFilters)
               );

               setTimeSeriesFilterOptions(savedFilters);

               // restore the selected filter
               if (timeSeriesGridPrefResult.selectedFilter) {
                  const filterOption = savedFilters.find(
                     (s: FilterOption) =>
                        s.name === timeSeriesGridPrefResult.selectedFilter
                  );

                  if (filterOption) {
                     setSelectedTimeSeriesFilter(filterOption);
                  }
               }
            }

            // Mark initial data as loaded even if there are no saved filters
            setInitialDataLoaded(true);
         } catch (error: any) {
            enqueueSnackbar(error.message, {
               action: action,
               variant: 'error'
            });
         }
      };

      initializeView();
   }, [action, apiClient, enqueueSnackbar, getSelectedViewColumns, isSubgrid, rowDataCopy, sObjectName, resolvedObjMetadata?.fields, selectedObject, selectedSubgridView, setSelectedTimeSeriesFilter, setSelectedTransposedColumn, setTimeSeriesFilterOptions, setTransposedColumnOptions, setTransposedRowData, active]);

   // build grid view when prerequisites are ready
   const canBuild = useMemo(() => {
      prettyPrint('[canBuild] Checking prerequisites...', null, 'magenta');
      prettyPrint('[canBuild] - selectedTransposedColumn:', selectedTransposedColumn, 'magenta');
      prettyPrint('[canBuild] - isInitialDataLoaded.current:', isInitialDataLoaded.current, 'magenta');
      prettyPrint('[canBuild] - initialDataLoaded:', initialDataLoaded, 'magenta');
      prettyPrint('[canBuild] - resolvedObjMetadata:', !!resolvedObjMetadata, 'magenta');
      prettyPrint('[canBuild] - sObjectName:', sObjectName, 'magenta');
      prettyPrint('[canBuild] - resolvedObjMetadata?.apiName:', resolvedObjMetadata?.apiName, 'magenta');
      prettyPrint('[canBuild] - rowDataCopy?.length:', rowDataCopy?.length, 'magenta');
      prettyPrint('[canBuild] - isSubgrid:', isSubgrid, 'magenta');
      prettyPrint('[canBuild] - active:', active, 'magenta');
      prettyPrint('[canBuild] - selectedSubgridView:', selectedSubgridView ? 'loaded' : 'NOT loaded', 'magenta');

      if (!selectedTransposedColumn) {
         prettyPrint('[canBuild] FAILED: no selectedTransposedColumn', null, 'red');
         return false;
      }

      if (!isInitialDataLoaded.current || !initialDataLoaded) {
         prettyPrint('[canBuild] FAILED: initialDataLoaded not ready', null, 'red');
         return false;
      }

      if (!resolvedObjMetadata) {
         prettyPrint('[canBuild] FAILED: no resolvedObjMetadata', null, 'red');
         return false;
      }

      if (sObjectName !== resolvedObjMetadata.apiName) {
         prettyPrint('[canBuild] FAILED: sObjectName mismatch', null, 'red');
         return false;
      }

      if (!rowDataCopy || rowDataCopy.length === 0) {
         prettyPrint('[canBuild] FAILED: no rowDataCopy', null, 'red');
         return false;
      }

      if (isSubgrid && active === false) {
         prettyPrint('[canBuild] FAILED: subgrid not active', null, 'red');
         return false;
      }

      // Wait for subgrid view to be loaded before building - prevents race condition
      // where initializeGrid runs before views are loaded into per-relation state
      if (isSubgrid && !selectedSubgridView) {
         prettyPrint('[canBuild] FAILED: subgrid view not loaded yet', null, 'red');
         return false;
      }

      prettyPrint('[canBuild] SUCCESS: all checks passed', null, 'green');
      return true;
   }, [active, isSubgrid, selectedTransposedColumn, initialDataLoaded, resolvedObjMetadata, sObjectName, rowDataCopy, selectedSubgridView]);

   // Late-build transposed column options when a view becomes available after mount
   useEffect(() => {
      prettyPrint('[late-build effect] ENTRY', null, 'cyan');
      prettyPrint('[late-build effect] isSubgrid:', isSubgrid, 'cyan');
      prettyPrint('[late-build effect] resolvedObjMetadata:', !!resolvedObjMetadata, 'cyan');
      prettyPrint('[late-build effect] selectedTransposedColumn:', selectedTransposedColumn, 'cyan');

      if (!isSubgrid) {
         prettyPrint('[late-build effect] EXIT: not subgrid', null, 'cyan');
         return;
      }; // This issue only affects subgrid

      if (!resolvedObjMetadata) {
         prettyPrint('[late-build effect] EXIT: no resolvedObjMetadata', null, 'cyan');
         return;
      };

      const cols = getSelectedViewColumns;
      prettyPrint('[late-build effect] getSelectedViewColumns:', cols, 'cyan');

      if (!Array.isArray(cols) || cols.length === 0) {
         prettyPrint('[late-build effect] EXIT: no cols from view', null, 'cyan');
         return;
      };

      // Use case-insensitive comparison since DTO may return lowercase colIds
      // First, get fields that match visible columns in the view
      let fieldOptions = (resolvedObjMetadata?.fields || [])
         ?.map((item: SObjectFieldMetadata) => ({ name: item.name, label: item.label }))
         .filter((option: any) => cols.some((c: any) => c.colId?.toLowerCase() === option.name?.toLowerCase() && c.hide === false))
         .sort((a: any, b: any) => (a.label || '').localeCompare(b.label || '')) || [];

      prettyPrint('[late-build effect] fieldOptions from visible cols:', fieldOptions.length, 'cyan');

      // For TimeSeriesGrid to work, we MUST have at least one DATE/DATETIME column in the options.
      // If none of the visible columns are DATE/DATETIME, add ALL DATE/DATETIME fields from metadata
      // so the user can select one as the transpose column.
      const fieldMap = new Map((resolvedObjMetadata?.fields || []).map((f: any) => [f.name, f]));
      const hasDateTimeOption = fieldOptions.some((o: any) => {
         const f = fieldMap.get(o.name);
         return f && (f.type === 'DATE' || f.type === 'DATETIME');
      });

      if (!hasDateTimeOption) {
         prettyPrint('[late-build effect] No DATE/DATETIME in visible cols, adding all DATE/DATETIME fields', null, 'orange');

         // Add all DATE/DATETIME fields from metadata
         const dateTimeFields = (resolvedObjMetadata?.fields || [])
            .filter((f: SObjectFieldMetadata) => f.type === 'DATE' || f.type === 'DATETIME')
            .map((f: SObjectFieldMetadata) => ({ name: f.name, label: f.label }))
            .sort((a: any, b: any) => (a.label || '').localeCompare(b.label || ''));

         // Merge with existing options (add DATE/DATETIME fields that aren't already in the list)
         const existingNames = new Set(fieldOptions.map((o: any) => o.name));
         for (const dtField of dateTimeFields) {
            if (!existingNames.has(dtField.name)) {
               fieldOptions.push(dtField);
            }
         }

         // Re-sort after adding
         fieldOptions = fieldOptions.sort((a: any, b: any) => (a.label || '').localeCompare(b.label || ''));
         prettyPrint('[late-build effect] fieldOptions after adding DATE/DATETIME:', fieldOptions.length, 'cyan');
      }

      // Only overwrite if options are empty or clearly differ in length
      if (!Array.isArray(transposedColumnOptions) || transposedColumnOptions.length !== fieldOptions.length) {
         prettyPrint('[late-build effect] Setting transposedColumnOptions:', fieldOptions, 'cyan');
         setTransposedColumnOptions(fieldOptions);
      }

      // If we still don't have a transposed column and no pref record yet, pick a DATE/DATETIME default now
      if (!selectedTransposedColumn && (!timeSeriesGridPreferenceRecId.current || timeSeriesGridPreferenceRecId.current === null)) {
         prettyPrint('[late-build effect] No selectedTransposedColumn, picking default...', null, 'cyan');

         const byName = (n: string) => fieldOptions.find((o: any) => o.name === n) || null;

         let pick = byName('CreatedDate') || byName('LastModifiedDate');
         if (!pick) {
            pick = fieldOptions.find((o: any) => {
               const f = fieldMap.get(o.name);

               return f && (f.type === 'DATE' || f.type === 'DATETIME');
            }) || null;
         }
         if (pick) {
            prettyPrint('[late-build effect] Picked default transposed column:', pick, 'green');
            setSelectedTransposedColumn(pick as any);

            // When late-build effect picks a column, also mark initialization as complete
            // This handles the case where initializeView couldn't find a valid column due to
            // the view's column state not including DATE/DATETIME fields
            if (!initialDataLoaded) {
               prettyPrint('[late-build effect] Setting initialDataLoaded to true', null, 'green');
               setInitialDataLoaded(true);
               isInitialDataLoaded.current = true;
            }
         } else {
            prettyPrint('[late-build effect] FAILED: No DATE/DATETIME column found in options!', null, 'red');
         }
      }

   }, [getSelectedViewColumns, initialDataLoaded, isSubgrid, resolvedObjMetadata, selectedTransposedColumn, setSelectedTransposedColumn, setTransposedColumnOptions, transposedColumnOptions]);

   useEffect(() => {
      // Use utility function for data transformation
      const transformDataFn = transformDataForTranspose;

      const createTransposedColumns = (
         columnToTranspose: string,
         transformedData: Record<string, any>[]
      ) => {
         try {
            // Use case-insensitive comparison since DTO may return lowercase colIds
            const columnToTransposeLower = columnToTranspose?.toLowerCase();

            prettyPrint('[createTransposedColumns] columnToTranspose:', columnToTranspose, 'blue');
            prettyPrint('[createTransposedColumns] columnToTransposeLower:', columnToTransposeLower, 'blue');
            prettyPrint('[createTransposedColumns] transformedData length:', transformedData?.length, 'blue');
            prettyPrint('[createTransposedColumns] transformedData names:', transformedData?.map(f => f.name), 'blue');

            const transposedColumnObj = transformedData.find(
               (f) => f.name?.toLowerCase() === columnToTransposeLower
            );

            prettyPrint('[createTransposedColumns] transposedColumnObj found:', !!transposedColumnObj, 'blue');

            if (!transposedColumnObj) {
               throw new Error(
                  'createTransposedColumns - did not find columnToTranspose'
               );
            }

            const columnValues = transposedColumnObj!.values;

            // create the columnDefs
            const gridCols: ColDef[] = [];

            const propertyCol: ColDef = {
               field: 'property',
               headerName: 'Property',
               editable: false,
               sortable: false,
               width: 200,
               minWidth: 200,
               valueFormatter: ({ value }) => {
                  // determine type from metadata
                  const objMetadataField = fieldMetadataMap.get(String(value));
                  if (objMetadataField) {
                     return objMetadataField.label;
                  }

                  return value;
               },
               suppressHeaderMenuButton: true,
               suppressHeaderFilterButton: true,
               suppressHeaderContextMenu: true,
               suppressFillHandle: true,
               pinned: 'left'
            };

            gridCols.push(propertyCol);

            const objMetadataFields = resolvedObjMetadata?.fields || [];

            // Helper to format header labels using the transposed column type
            const transposeFieldMeta = fieldMetadataMap.get(columnToTranspose);

            const formatHeaderValue = (val: any) => {
               const ft = transposeFieldMeta?.type;
               if (ft === 'DATE' || ft === 'DATETIME') {
                  if (!val) {
                     return '';
                  }

                  const d = typeof val === 'string' || typeof val === 'number' ? new Date(val) : val;

                  return isNaN(d?.getTime?.()) ? String(val) : dateFormatter.format(d);
               }

               if (ft === 'CURRENCY') return val != null ? currencyFormatter.format(val) : '';

               if (ft === 'DECIMAL' || ft === 'DOUBLE' || ft === 'INTEGER' || ft === 'LONG') {
                  return val != null && !isNaN(Number(val)) ? numberFormatter.format(val) : '';
               }

               if (ft === 'PERCENTAGE') return val != null ? percentageFormatter.format(val) : '';
               return val == null ? '' : String(val);
            };

            for (let i = 0; i < columnValues.length; i++) {
               const colName = `field${i}`;

               const headerTooltip = formatHeaderValue(columnValues[i]);

               const newCol: ColDef = {
                  field: colName,
                  headerName: colName, // keep generic labels like 'field0', 'field1'
                  headerTooltip,
                  editable: (params) => {
                     const fn = params?.data?.property;

                     const meta = fieldMetadataMap.get(String(fn));

                     return !!meta?.isUpdateable;
                  },
                  sortable: false,
                  hide: false,
                  width: 200,
                  minWidth: 200,
                  valueFormatter: ({ value, data, column }) => {
                     // get the property name and field metadata
                     const fieldName = data['property'];

                     const objMetadataField = fieldMetadataMap.get(String(fieldName));

                     if (!objMetadataField) return value;

                     const fieldType = objMetadataField.type;

                     // Render MULTIPICKLIST as labels joined by '; '
                     if (fieldType === 'MULTIPICKLIST') {
                        if (value == null || value === '') return value;
                        try {
                           const opts = (objMetadataField.picklistValues || []) as any[];

                           const tokens = String(value)
                              .split(';')
                              .map((s) => s.trim())
                              .filter((s) => s.length > 0);

                           const labels = tokens.map((v) => opts.find((o) => o.value === v)?.label || v);

                           return labels.join('; ');
                        } catch { return value; }
                     }

                     // Render PICKLIST/COMBOBOX as label
                     if (fieldType === 'PICKLIST' || fieldType === 'COMBOBOX') {
                        try {
                           const opts = (objMetadataField.picklistValues || []) as any[];

                           const hit = opts.find((o) => o.value === value);

                           return hit?.label ?? value;
                        } catch { return value; }
                     }

                     if (fieldType === 'REFERENCE') {
                        const relationName = objMetadataField!.relationshipName as string;

                        return displayReference(value, {
                           relationName,
                           columnId: column.getColId(),
                           transposedRowData: transposedRowDataRef.current || [],
                           rowDataCopy: rowDataCopy || [],
                           objectsWithoutNameFieldMap,
                           nameFieldMap,
                        });
                     }

                     return formatByFieldType(value, fieldType, {
                        dateFormatter,
                        numberFormatter,
                        currencyFormatter,
                        percentageFormatter,
                     });
                  },
                  headerComponent: CustomHeader,
                  headerComponentParams: {
                     rowErrors: rowErrors,
                     showErrorRecs: showErrorRecs
                  },
                  cellEditorSelector: (params) => {
                     const { data } = params;

                     const fieldName = data.property;

                     const objMetadataField = fieldMetadataMap.get(String(fieldName));

                     if (!objMetadataField) {
                        prettyPrint('[TimeSeriesGrid] No metadata found for field', fieldName, 'orange');
                        return undefined; // Prevent editing if no metadata
                     }

                     const fieldType = objMetadataField!.type;

                     const lookupProps = {
                        apiClient: apiClient,
                        changedRows: changedRows,
                        objMetadataFields: objMetadataFields,
                        objMetadataMap: objMetadataMap,
                        rowDataCopy: rowDataCopy,
                        setRowDataCopy: setRowDataCopy,
                        transposedColName: 'field' + i
                     };

                     switch (fieldType) {
                        case 'BOOLEAN': {
                           return {
                              component: 'agCheckboxCellEditor'
                              // params: { ...lookupProps }
                           };
                        }
                        case 'CURRENCY':
                        case 'DECIMAL':
                        case 'DOUBLE':
                        case 'INTEGER':
                        case 'LONG': {
                           return {
                              component: 'agNumberCellEditor',
                              params: { ...lookupProps }
                           };
                        }
                        case 'DATE':
                        case 'DATETIME': {
                           return {
                              component: TimeSeriesDateEditor,
                              params: { ...lookupProps }
                           };
                        }
                        case 'COMBOBOX':
                        case 'PICKLIST': {
                           return {
                              component: TimeSeriesSelectEditor,
                              params: { ...lookupProps }
                           };
                        }
                        case 'MULTIPICKLIST': {
                           return {
                              component: TimeSeriesMultiSelectEditor,
                              params: { ...lookupProps }
                           };
                        }
                        case 'REFERENCE': {
                           return {
                              component: TimeSeriesAutocompleteEditor,
                              params: lookupProps
                           };
                        }
                        default: {
                           return {
                              component: 'agTextCellEditor'
                           };
                        }
                     }
                  }
               };
               gridCols.push(newCol);
            }

            return gridCols;
         } catch (error: any) {
            enqueueSnackbar(error?.message || 'Paste failed', { action, variant: 'error' });
            return null;
         }
      };

      // Use utility function for creating transposed grid records
      const createTransformedGridRecs = createTransposedGridRecords;

      // moveTransposedColumn removed - functionality now handled in createTransposedGridRecords utility

      // Use utility function for moving column to front
      const moveColumnStateToFront = moveColumnToFront;

      const initializeGrid = () => {
         try {
            prettyPrint('[initializeGrid] ENTRY - canBuild:', canBuild, 'cyan');
            prettyPrint('[initializeGrid] ENTRY - selectedTransposedColumn:', selectedTransposedColumn, 'cyan');
            prettyPrint('[initializeGrid] ENTRY - isSubgrid:', isSubgrid, 'cyan');
            prettyPrint('[initializeGrid] ENTRY - rowDataCopy length:', rowDataCopy?.length, 'cyan');
            prettyPrint('[initializeGrid] ENTRY - getSelectedViewColumns:', getSelectedViewColumns, 'cyan');

            if (!canBuild || !selectedTransposedColumn) {
               prettyPrint('[initializeGrid] EXITING EARLY - canBuild or selectedTransposedColumn missing', null, 'red');
               return;
            }

            // Gate on transposed column equality AND data equality to avoid redundant rebuilds
            // Must rebuild if either the transposed column changed OR the underlying data changed
            const sameTransposedColumn =
               prevSelectedTransposedColumn.current?.name &&
               selectedTransposedColumn?.name &&
               prevSelectedTransposedColumn.current.name === selectedTransposedColumn.name;

            const sameData = prevRowDataCopy.current === rowDataCopy;

            if (sameTransposedColumn && sameData) {
               prettyPrint('[initializeGrid] EXITING - same transposed column and same data', null, 'yellow');
               return;
            }

            prettyPrint('>>> BUILDING TRANSPOSED GRID DATA', null, 'green')

            enableStateSaving.current = false;

            prevSelectedTransposedColumn.current = selectedTransposedColumn;


            // sort the rowDataCopy by the transposedColumn
            rowDataCopy!.sort((a: any, b: any) => {
               const valueA = a[selectedTransposedColumn.name];

               const valueB = b[selectedTransposedColumn.name];

               if (valueA instanceof Date && valueB instanceof Date) {
                  // Sorting for Date
                  return valueA.getTime() - valueB.getTime();
               } else if (typeof valueA === 'string' && typeof valueB === 'string') {
                  // Sorting for String (case insensitive)
                  return valueA.toLowerCase().localeCompare(valueB.toLowerCase());
               } else if (typeof valueA === 'number' && typeof valueB === 'number') {
                  // Sorting for Number
                  return valueA - valueB;
               } else if (
                  typeof valueA === 'boolean' &&
                  typeof valueB === 'boolean'
               ) {
                  // Sorting for Boolean (false before true)
                  return valueA === valueB ? 0 : valueA ? 1 : -1;
               } else {
                  // Default case: treat as string if types are mixed or unknown
                  return String(valueA).localeCompare(String(valueB));
               }
            });

            prevRowDataCopy.current = rowDataCopy;

            const cols = getSelectedViewColumns;

            // Case-insensitive check since DTO may return lowercase colIds
            const hasIdColumn = cols.some((col) => col.colId?.toLowerCase() === 'id');
            if (!hasIdColumn) {
               cols.push({
                  aggFunc: null,
                  colId: 'Id',
                  flex: null,
                  hide: false, // Hide Id column to avoid displaying it
                  pinned: null,
                  pivotIndex: null,
                  rowGroup: false,
                  rowGroupIndex: null,
                  sort: 'asc',
                  sortIndex: 0,
                  width: 200
               });
            }

            prettyPrint('[initializeGrid] cols before moveColumnStateToFront:', cols?.map(c => c.colId), 'orange');
            prettyPrint('[initializeGrid] selectedTransposedColumn.name:', selectedTransposedColumn.name, 'orange');

            // move the transposed column to the front
            const reorderedCols = moveColumnStateToFront(
               cols,
               selectedTransposedColumn.name
            );

            prettyPrint('[initializeGrid] reorderedCols after moveColumnStateToFront:', reorderedCols?.map(c => c.colId), 'orange');

            // transform the data
            const transformedData = transformDataFn(rowDataCopy, reorderedCols);

            prettyPrint('[initializeGrid] transformedData length:', transformedData?.length, 'orange');
            prettyPrint('[initializeGrid] transformedData names:', transformedData?.map(d => d.name), 'orange');

            // create tranposed columns
            const colDefs = createTransposedColumns(
               selectedTransposedColumn.name,
               transformedData
            );
            setColumnDefs(colDefs!);

            setFilteredColumnDefs(colDefs!);

            prevColumnDefs.current = colDefs!; // save for filterting

            // build the grid recs
            const convertedGridRecs = createTransformedGridRecs(
               selectedTransposedColumn.name,
               transformedData,
               cols
            );

            setTransposedRowData([...convertedGridRecs!]);

            // need this for the valueFormatter to work
            transposedRowDataRef.current = convertedGridRecs!;

            if (gridApi && !(gridApi as any).isDestroyed?.()) {
               gridApi.refreshHeader();
            }

            enableStateSaving.current = true;

            setTimeSeriesGridCreated(true);
         } catch (error: any) {
            enqueueSnackbar(error.message, {
               action: action,
               variant: 'error'
            });
         } finally {
            setIsQueryActive(false)
         }
      };

      initializeGrid();
   }, [action, apiClient, canBuild, changedRows, currencyFormatter, dateFormatter, enqueueSnackbar, fieldMetadataMap, getSelectedViewColumns, gridApi, initialDataLoaded, nameFieldMap, numberFormatter, objMetadataMap, objectsWithoutNameFieldMap, percentageFormatter, rowDataCopy, rowErrors, sObjectName, saveAgGridState, resolvedObjMetadata, selectedObject, selectedTransposedColumn, setIsQueryActive, setTransposedRowData, showErrorRecs, isSubgrid]);

   // save state after timeSeriesGrid created and user selected the transposedColumn
   const saveInFlightRef = useRef(false);

   const prevSelectedTransposedColumnName = useRef<string | null>(null);

   useEffect(() => {
      const savePref = async () => {
         const currentName = selectedTransposedColumn?.name || null;

         // Guard: no change by name, or not created yet, or already saving
         if (
            prevSelectedTransposedColumnName.current === currentName ||
            !currentName ||
            !timeSeriesGridCreated ||
            saveInFlightRef.current
         ) {
            return;
         }

         // CRITICAL: Only save transposed column changes if we already have a preference record ID.
         // This prevents duplicate records from being created when both this effect and
         // useGridStatePersistence try to save at the same time.
         // The initial preference record is created by useGridStatePersistence.handleGridStateChange
         // when the grid is first built. This effect only UPDATES existing records.
         if (!timeSeriesGridPreferenceRecId.current) {
            prettyPrint('[selectedTransposedColumn changed] Skipping save - no preference record ID yet (waiting for initial save)', currentName, 'orange');
            return;
         }

         saveInFlightRef.current = true;
         prevSelectedTransposedColumnName.current = currentName;

         prettyPrint('[selectedTransposedColumn changed] Updating existing preference record', currentName, 'purple')

         const upsertRec: Record<string, any> = {
            Id: timeSeriesGridPreferenceRecId.current as string,
            AppGridAg__TransposedColumn__c: currentName,
            AppGridAg__SObjectApiName__c: sObjectName,
            AppGridAg__IsSubgridView__c: isSubgrid
         };

         const upsertRecs = [upsertRec];

         const params: UpsertServiceParams = {
            sObjectName: 'AppGridAg__AG_TimeSeriesGrid_Pref__c', jsonRecs: JSON.stringify(upsertRecs),
         };

         try {
            const result = await apiClient.upsertRecs(params);

            if (result.status !== 'success' || result.results.length !== 1) {
               enqueueSnackbar(result.errorMessage || 'Unexpected error saving time series preferences', { action: action, variant: 'error' })

               return;
            }

            const apiResult = result.results[0];

            if (!apiResult.isSuccess) {
               enqueueSnackbar(`Unexpected error saving time series preferences - ${apiResult.errorMessages?.[0] || apiResult.errors?.[0]}`, { action: action, variant: 'error' })

               return;
            }
         } finally {
            saveInFlightRef.current = false;
         }
      };

      savePref();
   }, [action, apiClient, enqueueSnackbar, isSubgrid, sObjectName, selectedTransposedColumn?.name, timeSeriesGridCreated]);

   // execute filter when selectedTimeSeriesFilter changes
   useEffect(() => {
      // Mapping from Syncfusion QueryBuilder operators to JavaScript comparison operators
      // Operator map for Syncfusion QueryBuilder operators to JavaScript operators/methods
      const operatorMap: { [key: string]: string } = {
         equal: '===',
         notequal: '!==',
         greaterthan: '>',
         greaterthanorequal: '>=',
         lessthan: '<',
         lessthanorequal: '<=',
         startswith: '.startsWith()',
         endswith: '.endsWith()',
         contains: '.includes()'
         // Add more mappings as needed
      };

      // Helper to convert Syncfusion operators to JS functions where needed
      function getOperatorFunction(
         operator: string
      ): (a: any, b: any) => boolean {
         switch (operator) {
            case '===':
               return (a, b) => a === b;
            case '!==':
               return (a, b) => a !== b;
            case '>':
               return (a, b) => a > b;
            case '>=':
               return (a, b) => a >= b;
            case '<':
               return (a, b) => a < b;
            case '<=':
               return (a, b) => a <= b;
            case '.startsWith()':
               return (a, b) => String(a).startsWith(String(b));
            case '.endsWith()':
               return (a, b) => String(a).endsWith(String(b));
            case '.includes()':
               return (a, b) => String(a).includes(String(b)); // Corrected to not use replace
            default:
               return () => false; // Fallback for unknown operators
         }
      }

      // Function to transform Syncfusion QueryBuilder rules into a Map
      function transformRulesToMap(
         rule: RuleModel
      ): Map<string, { operator: string; value: any }> {
         const ruleMap = new Map<string, { operator: string; value: any }>();

         rule.rules!.forEach((rule) => {
            let jsOperator = operatorMap[rule.operator!.toLowerCase()];
            if (!jsOperator) {
               jsOperator = rule.operator!;
            }

            ruleMap.set(rule.field!, {
               operator: jsOperator,
               value: rule.value
            });
         });

         return ruleMap;
      }

      function columnsToShow(operator: string, ...arrays: string[][]): string[] {
         // If no arrays are provided or if the first array is empty, return an empty array
         if (arrays.length === 0 || arrays[0].length === 0) {
            return [];
         }

         if (operator === 'and') {
            // For AND operation, start with the first array's elements
            let common = new Set(arrays[0]);

            // Iterate through each subsequent array
            for (let i = 1; i < arrays.length; i++) {
               // Convert the current array to a Set for O(1) lookup
               const currentSet = new Set(arrays[i]);
               // Keep only the elements that are in both `common` and `currentSet`
               common = new Set(Array.from(common).filter((x) => currentSet.has(x)));
            }

            // Convert Set back to an array for return
            return Array.from(common);
         } else if (operator === 'or') {
            // For OR operation, union all sets
            const allElements = new Set<string>();
            for (let array of arrays) {
               array.forEach((item) => allElements.add(item));
            }
            // Convert Set back to an array for return
            return Array.from(allElements);
         } else {
            throw new Error('Invalid operator. Use "and" or "or".');
         }
      }

      // Function to evaluate a single object against rules and return passing keys
      function getPassingKeysForSingleObject<T extends Record<string, any>>(
         object: T,
         rulesMap: Map<string, { operator: string; value: any }>
      ): string[] {
         const passingKeys: string[] = [];

         // process each rule against all fields in the object
         rulesMap.forEach(({ operator, value }) => {
            const comparator = getOperatorFunction(operator);

            // Check each property in the object against this rule
            for (let prop in object) {
               if (prop === 'rowIndex' || prop === 'property') {
                  continue;
               }

               const objectValue = object[prop];

               if (Array.isArray(value)) {
                  if (
                     value.some((val) => {
                        return comparator(objectValue, val);
                     })
                  ) {
                     passingKeys.push(prop);
                  }
               } else {
                  if (comparator(objectValue, value)) {
                     passingKeys.push(prop);
                  }
               }
            }
         });

         return passingKeys;
      }

      if (
         !selectedTimeSeriesFilter ||
         !timeSeriesGridCreated ||
         !transposedRowData ||
         transposedRowData.length === 0
      ) {
         // reset column filters
         setTimeSeriesFilterActive(false);
         return;
      }

      // get the rule
      const filterRule = selectedTimeSeriesFilter?.filterRule;

      if (!filterRule) {
         // reset column filters
         setTimeSeriesFilterActive(false);
         return;
      }

      setTimeSeriesFilterActive(true);

      const filterMap = transformRulesToMap(filterRule);

      // Get the keys from the map
      const keys = Array.from(filterMap.keys());

      // filter the transposedRowData
      const filteredTransposedRowData = transposedRowData.filter((r: any) =>
         keys.includes(r.property)
      );

      // Get keys for each object in data array that pass conditions
      // TBD: add logic to AND/OR the results for the final filter
      const rowArray: string[][] = [];
      filteredTransposedRowData.forEach((obj) => {
         const rowColumns = getPassingKeysForSingleObject(obj, filterMap);

         rowArray.push(rowColumns);
      });

      const showColumns = columnsToShow(filterRule.condition!, ...rowArray);

      // convert to set
      const colNamesSet = new Set(showColumns);

      const filteredColDefs = columnDefs.filter(
         (f: ColDef) => f.field === 'property' || colNamesSet.has(f.field!)
      );

      setFilteredColumnDefs(filteredColDefs);
   }, [
      columnDefs,
      currentTimeSeriesFilterRule,
      selectedTimeSeriesFilter,
      setTimeSeriesFilterActive,
      timeSeriesGridCreated,
      transposedRowData
   ]);

   // resize columns when transposed data changes
   useEffect(() => {
      autosizeColumns(true);
   }, [autosizeColumns, selectedTransposedColumn]);

   // add timeseries record event
   useEffect(() => {
      const addRecord = async () => {
         try {
            // check for create permission
            if (sObjectName === 'Task' || sObjectName === 'Event') {
               // get the permission from the SObject metadata
               const hasPerm =
                  resolvedObjMetadata?.isAccessible &&
                  resolvedObjMetadata?.isCreateable;
               if (!hasPerm) {
                  throw new Error(
                     `Create Permission assignment for ${sObjectName} was not found`
                  );
               }
            } else {
               const perm: SObjectPermission | undefined = objectPermissions.find(
                  (f: SObjectPermission) => f.sObjectType === sObjectName
               );

               if (!perm) {
                  throw new Error(
                     `Permissions record for ${sObjectName} was not found`
                  );
               }

               if (!perm.permissionsCreate) {
                  throw new Error(
                     `Create Permission assignment for ${sObjectName} was not found`
                  );
               }
            }

            // Check for record types
            // Filter record types based on availability
            const recordTypesList = resolvedObjMetadata?.recordTypes || [];

            const availableRecordTypes = recordTypesList.filter(
               (rt: any) => rt?.isAvailable
            );

            // don't set selectedRecordType if no custom record types have been defined
            if (
               availableRecordTypes &&
               availableRecordTypes.length === 1 &&
               !availableRecordTypes[0].isMaster
            ) {
               setSelectedRecordType(availableRecordTypes[0].recordTypeId);
            }

            if (availableRecordTypes && availableRecordTypes.length > 1) {
               // get default record type for this user
               const defaultRecordType = availableRecordTypes.find(
                  (rt: any) => rt.isDefaultRecordTypeMapping
               );

               if (defaultRecordType) {
                  setSelectedRecordType(defaultRecordType.recordTypeId);
               } else {
                  // Prompt user to select a record type
                  // Open the dialog to prompt user for record type
                  setRecordTypes(availableRecordTypes);
                  setShowRecordTypeDialog(true);
                  return; // Exit early until user makes a selection
               }
            }

            const dummyId: string = createDummyApexId();

            const displayedColumns = getSelectedViewColumns;

            // Case-insensitive check since DTO may return lowercase colIds
            if (!displayedColumns.some((col) => col.colId?.toLowerCase() === 'id')) {
               displayedColumns.push({ colId: 'Id', hide: false }); // Assuming default state for new column
            }

            const rec: any = { Id: dummyId };
            if (selectedRecordType) {
               rec['RecordTypeId'] = selectedRecordType;
            }

            // iterate through the displayed columns and create new row data object
            // only create properties for accessible and createable fields
            for (const c of displayedColumns) {
               // get the field metadata
               const objMetadataField = fieldMetadataMap.get(String(c.colId));

               if (
                  objMetadataField &&
                  objMetadataField.isAccessible &&
                  objMetadataField.isCreateable
               ) {
                  // create the data property
                  const fieldName = objMetadataField.name;

                  // initialize the field
                  rec[fieldName] = null;

                  // defaultValue has been serialized
                  const defaultValue = objMetadataField.defaultValue;
                  const fieldType = objMetadataField.type
                     ? objMetadataField.type
                     : null;

                  if (defaultValue !== 'null' && fieldType === 'BOOLEAN') {
                     rec[fieldName] = defaultValue
                        ? JSON.parse(decode(defaultValue))
                        : false;
                     continue;
                  }

                  // defaultValue comes across as a string, so convert it if necessary
                  if (
                     defaultValue !== 'null' &&
                     (fieldType === 'CURRENCY' ||
                        fieldType === 'DECIMAL' ||
                        fieldType === 'DOUBLE' ||
                        fieldType === 'INTEGER' ||
                        fieldType === 'LONG')
                  ) {
                     const convertedValue = Number(JSON.parse(decode(defaultValue!)));
                     rec[fieldName] = convertedValue;
                     continue;
                  }

                  if (
                     objMetadataField.type === 'REFERENCE' &&
                     objMetadataField.name === 'OwnerId'
                  ) {
                     rec['OwnerId'] = userInfo!.userId;
                     rec['Owner'] = {
                        Id: userInfo!.userId,
                        Name: userInfo!.name
                     };
                     continue;
                  }
               }
            }

            setSelectedRow({
               column: '',
               row: rec
            });

            setGridEditDialogState({
               show: true,
               gridId: gridId,
               isSubgrid: isSubgrid,
               selectedView: isSubgrid ? selectedSubgridView! : selectedView!
            });
         } catch (error: any) {
            enqueueSnackbar(error.message, {
               action: action,
               variant: 'error'
            });
         }
      };

      const addRecordHandler = (msg: any) => {
         switch (msg) {
            case 'AddTimeSeriesRecord':
               addRecord();
               break;
            default:
               break;
         }
      };

      const addRecordToken = PubSub.subscribe(
         'AddTimeSeriesRecord',
         addRecordHandler
      );

      return () => {
         PubSub.unsubscribe(addRecordToken);
      };
   }, [action, columnDefs, enqueueSnackbar, fieldMetadataMap, getSelectedViewColumns, gridApi, gridId, isSubgrid, objectPermissions, sObjectName, resolvedObjMetadata, selectedObject, selectedRecordType, selectedSubgridView, selectedView, setGridEditDialogState, setRecordTypes, setSelectedRecordType, setSelectedTimeSeriesFilter, setShowRecordTypeDialog, transposedRowData, userInfo]);

   // ClearTimeSeriesFilter event
   useEffect(() => {
      const clearTimeSeriesFilter = async () => {
         try {
            setFilteredColumnDefs([...columnDefs]);

            setSelectedTimeSeriesFilter(null);

            setTimeSeriesFilterActive(false);
         } catch (error: any) {
            enqueueSnackbar(error.message, {
               action: action,
               variant: 'error'
            });
         }
      };

      const clearTimeSeriesFilterHandler = (msg: any) => {
         switch (msg) {
            case 'ClearTimeSeriesFilters':
               clearTimeSeriesFilter();
               break;
            default:
               break;
         }
      };

      const clearTimeSeriesFilterToken = PubSub.subscribe(
         'ClearTimeSeriesFilters',
         clearTimeSeriesFilterHandler
      );

      return () => {
         PubSub.unsubscribe(clearTimeSeriesFilterToken);
      };
   }, [
      action,
      columnDefs,
      enqueueSnackbar,
      gridApi,
      setTimeSeriesFilterActive,
      setSelectedTimeSeriesFilter
   ]);

   // column header clicked event
   useEffect(() => {
      function getReferenceFields(
         fieldNames: string[],
         fieldMetadataList: SObjectFieldMetadata[]
      ) {
         let referenceFieldsMap = new Map<string, string>();

         // Loop through each field name
         fieldNames.forEach((fieldName) => {
            // Find corresponding metadata for the field name
            const fieldMetadata = fieldMetadataList.find(
               (metadata) => metadata.name === fieldName
            );

            // If metadata exists and its type is 'REFERENCE', add to the map
            if (fieldMetadata && fieldMetadata.type === 'REFERENCE') {
               referenceFieldsMap.set(fieldName, fieldMetadata.relationshipName!);
            }
         });

         return referenceFieldsMap;
      }

      const createColumnRecord = (columnName: string) => {
         // iterate through every node in the grid
         const rec: Record<string, any> = {};

         transposedRowData.forEach((row: any) => {
            const fieldName = row['property'] as string;

            const fieldValue = row[columnName];
            rec[fieldName] = fieldValue;
         });

         // get the fields
         const fields = transposedRowData.map((item: any) => item.property); // get the fields in the data

         // get the reference fields
         const refFieldsMap = getReferenceFields(
            fields,
            (resolvedObjMetadata?.fields || [])
         );

         // find the relation in the normalized data
         // get the Id value
         const recId = rec.Id;

         // find this record in the normalized data and get the relation
         const normalizedRow = rowDataCopy.find((row: any) => row.Id === recId);

         if (normalizedRow) {
            refFieldsMap.forEach((value) => {
               const relationObj = normalizedRow[value];

               // add relation to selectedRow
               rec[value] = relationObj;
            });
         }

         return rec;
      };

      const columnHeaderChecked = async ({
         column,
         value
      }: ColumnHeaderChecked) => {
         if (value) {
            // create the record and add it to selected rows
            const columnRec = createColumnRecord(column);

            const newSelectedRow: SelectedRow = {
               column: column,
               row: columnRec as SObject
            };

            addSelectedRow(newSelectedRow);
         } else {
            removeSelectedRow(column);
         }
      };

      const columnHeaderCheckedHandler = (
         msg: string,
         data: ColumnHeaderChecked
      ) => {
         switch (msg) {
            case 'TimeSeriesColumnClicked':
               columnHeaderChecked(data);
               break;
            default:
               break;
         }
      };

      const columnHeaderCheckedToken = PubSub.subscribe(
         'TimeSeriesColumnClicked',
         columnHeaderCheckedHandler
      );

      return () => {
         PubSub.unsubscribe(columnHeaderCheckedToken);
      };
   }, [
      action,
      columnDefs,
      enqueueSnackbar,
      gridApi,
      rowDataCopy,
      resolvedObjMetadata,
      setSelectedTimeSeriesFilter,
      transposedRowData
   ]);

   // TimeSeriesColumnEdit event - handles edit button click from column header
   useEffect(() => {
      const columnEditHandler = (
         _msg: string,
         data: { column: string }
      ) => {
         try {
            // Find the Id row in transposed data
            const idRow = transposedRowData.find((rec: any) => rec.property === 'Id');

            if (!idRow) {
               prettyPrint('[TimeSeriesGrid] columnEditHandler - Id row not found', null, 'red');
               return;
            }

            // Get the record ID from the column (e.g., field0, field1, etc.)
            const recordId = idRow[data.column];

            if (!recordId) {
               prettyPrint('[TimeSeriesGrid] columnEditHandler - recordId not found for column', data.column, 'red');
               return;
            }

            // Emit the edit record event with the recordId
            emitEditRecord({ context: isSubgrid ? 'subgrid' : 'main', gridId, recordId: String(recordId) });
         } catch (error: any) {
            prettyPrint('[TimeSeriesGrid] columnEditHandler error', error.message, 'red');
         }
      };

      const columnEditToken = PubSub.subscribe(
         'TimeSeriesColumnEdit',
         columnEditHandler
      );

      return () => {
         PubSub.unsubscribe(columnEditToken);
      };
   }, [gridId, isSubgrid, transposedRowData]);


   // DeleteTimeSeriesFilter event
   useEffect(() => {
      const deleteTimeSeriesFilter = async () => {
         try {
            setShowDeleteFilterDialog(true);
         } catch (error: any) {
            enqueueSnackbar(error.message, {
               action: action,
               variant: 'error'
            });
         }
      };

      const deleteTimeSeriesFilterHandler = (msg: any) => {
         switch (msg) {
            case 'DeleteTimeSeriesFilter':
               deleteTimeSeriesFilter();
               break;
            default:
               break;
         }
      };

      const deleteTimeSeriesFilterToken = PubSub.subscribe(
         'DeleteTimeSeriesFilter',
         deleteTimeSeriesFilterHandler
      );

      return () => {
         PubSub.unsubscribe(deleteTimeSeriesFilterToken);
      };
   }, [action, enqueueSnackbar, gridApi, setShowDeleteFilterDialog]);

   // RunTimeSeriesFilter event
   useEffect(() => {
      const runTimeSeriesFilter = async () => {
         try {
            prettyPrint('RunTimeSeriesFilter executing', null, 'blue');
         } catch (error: any) {
            enqueueSnackbar(error.message, {
               action: action,
               variant: 'error'
            });
         }
      };

      const runTimeSeriesFilterHandler = (msg: any) => {
         switch (msg) {
            case 'RunTimeSeriesFilter':
               runTimeSeriesFilter();
               break;
            default:
               break;
         }
      };

      const runTimeSeriesFilterToken = PubSub.subscribe(
         'RunTimeSeriesFilter',
         runTimeSeriesFilterHandler
      );

      return () => {
         PubSub.unsubscribe(runTimeSeriesFilterToken);
      };
   }, [action, enqueueSnackbar, gridApi]);

   // SaveTimeSeriesFilter event
   useEffect(() => {
      const saveTimeSeriesFilter = async () => {
         try {
            // update the gridPreferences
            saveAgGridState();
         } catch (error: any) {
            enqueueSnackbar(error.message, {
               action: action,
               variant: 'error'
            });
         }
      };

      const saveTimeSeriesFilterHandler = (msg: any) => {
         switch (msg) {
            case 'SaveTimeSeriesFilter':
               saveTimeSeriesFilter();
               break;
            default:
               break;
         }
      };

      const runTimeSeriesFilterToken = PubSub.subscribe(
         'SaveTimeSeriesFilter',
         saveTimeSeriesFilterHandler
      );

      return () => {
         PubSub.unsubscribe(runTimeSeriesFilterToken);
      };
   }, [action, enqueueSnackbar, gridApi, saveAgGridState]);

   // SaveAsTimeSeriesFilter event
   useEffect(() => {
      const saveAsTimeSeriesFilter = async () => {
         try {
            // update the gridPreferences
            saveAgGridState();
         } catch (error: any) {
            enqueueSnackbar(error.message, {
               action: action,
               variant: 'error'
            });
         }
      };

      const saveAsTimeSeriesFilterHandler = (msg: any) => {
         switch (msg) {
            case 'SaveAsTimeSeriesFilter':
               saveAsTimeSeriesFilter();
               break;
            default:
               break;
         }
      };

      const saveAsTimeSeriesFilterToken = PubSub.subscribe(
         'SaveAsTimeSeriesFilter',
         saveAsTimeSeriesFilterHandler
      );

      return () => {
         PubSub.unsubscribe(saveAsTimeSeriesFilterToken);
      };
   }, [
      action,
      currentTimeSeriesFilterRule,
      enqueueSnackbar,
      gridApi,
      saveAgGridState
   ]);

   // save timeseries records
   useEffect(() => {
      // Use utility function for finding property by value

      const upsertRecords = async (normalizedData: SObject[]) => {
         if (!resolvedObjMetadata || !sObjectName) {
            return;
         }

         // Check for permission to create
         const perms = objectPermissions.find(
            (p: SObjectPermission) => p.sObjectType === sObjectName
         );

         if (!perms) {
            enqueueSnackbar(`Unexpected error: permission not found for ${sObjectName}`, {
               action,
               variant: 'error',
            });
            return;
         }

         if (!perms.permissionsCreate) {
            enqueueSnackbar(`Create permission not found for ${sObjectName}`, {
               action,
               variant: 'error',
            });
            return;
         }

         try {
            // Validate required fields
            for (const row of normalizedData) {
               const missingRequired = Object.entries(row).some(([key, value]) => {
                  const fieldMetadata = (resolvedObjMetadata?.fields || []).find(
                     (f: { name: string }) => f.name === key
                  );

                  if (
                     !fieldMetadata ||
                     !fieldMetadata.isCreateable ||
                     fieldMetadata.isNillable
                  )
                     return false;
                  return value === undefined || value === null;
               });

               if (missingRequired) {
                  enqueueSnackbar(
                     'Record is missing required value for at least one field',
                     {
                        action: action,
                        variant: 'error'
                     }
                  );

                  setLoading(false);

                  return;
               }
            }

            // Prepare records for upsert
            const recsToUpsert = normalizedData.map(row => {
               const newRow: Partial<SObject> = { ...row };

               const recId = newRow.Id as string;

               // Remove temporary IDs for new records
               if (recId?.substring(0, 6) === '000000') {
                  delete newRow.Id;
               }

               // Filter fields to include only valid, updatable, and non-calculated fields
               for (const key of Object.keys(newRow)) {
                  if (key === 'Id') continue; // Preserve Id for upsert

                  const fieldMetadata = (resolvedObjMetadata?.fields || []).find(f => f.name === key);
                  // Remove unknown fields
                  if (!fieldMetadata) {
                     delete newRow[key];
                     continue;
                  }

                  // Remove calculated fields (e.g., formula fields, auto-number fields)
                  if (fieldMetadata.isCalculated) {
                     delete newRow[key];
                     continue;
                  }

                  // Remove fields that are not createable or updatable
                  if (!fieldMetadata.isCreateable || !fieldMetadata.isUpdateable) {
                     delete newRow[key];
                     continue;
                  }

                  // Handle DATE and DATETIME fields
                  const value = newRow[key];
                  if (fieldMetadata.type === 'DATE' && value != null) {
                     if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
                        const dateValue = value instanceof Date ? value : new Date(value);

                        if (isNaN(dateValue.getTime())) {
                           delete newRow[key];
                        } else {
                           newRow[key] = dateValue.toISOString().split('T')[0]; // "2025-04-30"
                        }
                     } else {
                        delete newRow[key];
                     }
                  } else if (fieldMetadata.type === 'DATETIME' && value != null) {
                     if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
                        const dateValue = value instanceof Date ? value : new Date(value);

                        if (isNaN(dateValue.getTime())) {
                           delete newRow[key];
                        } else {
                           newRow[key] = dateValue.toISOString(); // "2025-04-30T04:00:00.000Z"
                        }
                     } else {
                        delete newRow[key];
                     }
                  }
               }
               return newRow;
            });

            if (recsToUpsert.length === 0) {
               enqueueSnackbar('No changes to save!', {
                  autoHideDuration: 3000,
                  variant: 'info'
               });

               setLoading(false);

               return;
            }

            const upsertRecStr = JSON.stringify(recsToUpsert);

            const paramObj = {
               sObjectName: sObjectName,
               jsonRecs: upsertRecStr,
            };

            const result = await apiClient.upsertRecs(paramObj);

            if (result.status !== 'success') {
               throw new Error(result.errorMessage || 'Upsert operation failed');
            }

            let hasErrors = false;

            for (let i = 0; i < result.results.length; i++) {
               const res = result.results[i];
               if (!res.isSuccess) {
                  hasErrors = true;
                  let originalId = res.recordId;

                  // If res.id is null, it's a new record that failed to upsert
                  if (!originalId) {
                     // Use the index 'i' to get back to the original record in filteredData
                     originalId = normalizedData[i].Id as string; // Use the original temporary ID from filteredData
                  }

                  // find the column with this Id (use ref to avoid stale closure)
                  const idRow = transposedRowDataRef.current.find(
                     (f: any) => f.property === 'Id'
                  );

                  const colName = idToFieldKeyMapRef.current.get(originalId) || findFieldKeyByValue(idRow!, originalId);

                  rowErrors.set(colName!, `ERROR - ${res.errorMessages?.[0] || res.errors?.[0]}`);
               }
            }

            if (hasErrors) {
               // const errorRecs = rowDataCopy.filter((f: any) => errorRowIndexes.includes(f.rowId));
               setLoading(false);

               // setRowDataCopy(errorRecs);
               setShowErrorRecs(true);

               enqueueSnackbar('Error saving changes', {
                  action: action,
                  variant: 'error'
               });
            } else {
               setShowErrorRecs(false);

               enqueueSnackbar('Changes saved!', {
                  autoHideDuration: 3000,
                  variant: 'success'
               });

               setLoading(false);

               // Trigger query refresh
               setQueryRuleModified({});

               // send event to AppViewRouter
               PubSub.publish('RunQuery')

               // clear changed rows
               changedRows.clear();
            }
         } catch {
            enqueueSnackbar('Error saving changes', {
               action: action,
               variant: 'error'
            });
            setLoading(false);
         }
      };

      const saveTimeSeriesRecords = async () => {
         try {
            // Use ref to get current transposed data (avoids stale closure)
            const currentTransposedData = transposedRowDataRef.current;
            const normalizedData = reverseTranspose(currentTransposedData);

            upsertRecords(normalizedData);
         } catch (error: any) {
            enqueueSnackbar(error.message, {
               action: action,
               variant: 'error'
            });
         }
      };

      const saveTimeSeriesRecordsHandler = (msg: any) => {
         switch (msg) {
            case 'SaveTimeSeriesRecords':
               saveTimeSeriesRecords();
               break;
            default:
               break;
         }
      };

      const saveTimeSeriesRecordsToken = PubSub.subscribe(
         'SaveTimeSeriesRecords',
         saveTimeSeriesRecordsHandler
      );

      return () => {
         PubSub.unsubscribe(saveTimeSeriesRecordsToken);
      };
   });

   const getRowId = useCallback(
      (params: any) => String(params.data.property),
      []
   );

   const getContextMenuItems = (
      params: GetContextMenuItemsParams
   ): (MenuItemDef | DefaultMenuItem)[] => {
      // Filter out specific menu items by their keys
      return params.defaultItems!.filter(
         (item) =>
            item !== 'cut' && // Removes 'Cut'
            item !== 'copyWithHeaders' && // Removes 'Copy with Headers'
            item !== 'copyWithGroupHeaders' && // Removes 'Copy with Group Headers'
            item !== 'export' // Removes 'Export'
      );
   };

   const getMainMenuItems = (params: GetMainMenuItemsParams) => {
      // Filter out specific menu items by their keys
      return params.defaultItems.filter(
         (item) =>
            item !== 'columnChooser' &&
            item !== 'resetColumns' &&
            item !== 'pinSubMenu'
      );
   };


   // Close dialog handler
   const handleCloseGridEditDialog = useCallback(() => {
      setGridEditDialogState({
         show: false,
         gridId: null,
         isSubgrid: false,
         selectedView: isSubgrid ? selectedSubgridView! : selectedView!
      });
      clearChangedRows();
      clearSelectedRows();
   }, [clearChangedRows, clearSelectedRows, isSubgrid, selectedSubgridView, selectedView, setGridEditDialogState]);

   /*==========================================
   ** RENDER
   ==========================================*/

   return (
      <Box
         sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            gridTemplateColumns: '1fr',
            width: size?.width != null ? `${size.width}px` : '100%',
            height: !isSubgrid && size?.height != null ? `${size.height}px` : '100%',
            boxSizing: 'border-box',
            overflow: 'auto',
            position: 'relative',
         }}
      >
         {/* Toolbar (full width across grid columns) */}
         <Box
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               gridColumn: '1 / -1'
            }}>
            {!isSubgrid && (
               <AppToolbarResponsive containerSize={size ?? null} />
            )}
            {isSubgrid && (
               <Box
                  sx={{
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary,
                     px: 2, pt: 1
                  }}>
                  <SubgridViewSelector
                     relationName={sObjectApiName}
                     onViewChange={setSelectedSubgridView}
                  />
               </Box>
            )}
            <TimeSeriesGridMenu
               apiClient={apiClient}
               gridApi={gridApi}
               gridId={gridId}
               context={isSubgrid ? 'subgrid' : 'main'}
               relationName={isSubgrid ? relation?.name : undefined}
               onOpenImport={() => {
                  (document.activeElement as HTMLElement | null)?.blur?.();
                  setShowImportDialog(true);
               }}
            />
         </Box>

         {/* Main Grid Section */}
         <Box
            data-name="TimeSeriesAgGrid"
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               gridRow: 2,
               gridColumn: 1,
               minWidth: 0,
               minHeight: 0,
               // Match SubgridCore sizing: grid section gets 500px height in subgrid mode
               height: isSubgrid ? 500 : undefined,
               overflow: 'auto',
               // overflow: 'hidden',
               display: 'flex',
               flexDirection: 'column'
            }}
         >
            {loading && <LoadingIndicator isLoading={loading} />}
            {/* gridEditDialog */}
            {gridEditDialogState.show && gridEditDialogState.gridId === gridId && resolvedObjMetadata && selectedRow?.row && (
               <GridEditDialog
                  apiClient={apiClient}
                  currentState={currentState!}
                  isTimeSeriesView={true}
                  isSubgrid={isSubgrid}
                  objFieldPermissionsMap={objFieldPermissionsMap}
                  objMetadata={resolvedObjMetadata}
                  objMetadataMap={objMetadataMap}
                  selectedRow={selectedRow.row}
                  onClose={handleCloseGridEditDialog}
               />
            )}

            {/* delete filter dialog */}
            {showDeleteFilterDialog && (
               <DeleteFilterDialog
                  onClose={onFilterDeleteConfirmation}
                  title="Delete Confirmation"
                  message="Are you sure?"
               />
            )}

            {/* import wizard dialog */}
            <ImportWizardDialog
               open={showImportDialog}
               onClose={() => setShowImportDialog(false)}
               apiClient={apiClient}
               defaultObjectApiName={String(isSubgrid ? (parentObjectApiName || '') : ((selectedObject as any)?.qualifiedApiName || ''))}
            />

            {/* create timeSeries records dialog */}
            {/* {showCreateTimeSeriesRecordDialog && <CreateTimeSeriesRecordDialog onSave={onCreateTimeSeriesRecords} title='Paste Time Series' message='Are you sure?' />} */}

            {showFilterBuilder && (
               <FilterBuilder apiClient={apiClient} rowData={rowDataCopy} />
            )}

            {/* record types dialog */}
            {showRecordTypeDialog && <RecordTypeDialog />}

            {/* delete record dialog */}
            {showDeleteRecordDialog && (
               <DeleteRecordDialog
                  onClose={onRecordDeleteConfirmation}
                  title="Delete Confirmation"
                  message="Are you sure?"
               />
            )}

            <Box
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  width: '100%',
                  height: '100%', display: 'flex'
               }}>
               <Box
                  sx={{
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary,
                     flex: 1,
                     minWidth: 0,
                     minHeight: 0
                  }}>
                  <AgGridReact
                     ref={gridRef}
                     cellSelection={cellSelection}
                     columnDefs={filteredColumnDefs}
                     defaultColDef={defaultColDef}
                     getMainMenuItems={getMainMenuItems} // column context menu
                     getContextMenuItems={getContextMenuItems} // cell context menu
                     getRowId={getRowId}
                     maintainColumnOrder={true}
                     onCellMouseDown={(event: CellMouseDownEvent) => {
                        currentCellInfo.current = {
                           column: event.column,
                           colDef: event.colDef,
                           value: event.value,
                           data: event.data,
                           node: event.node,
                           event: event.event as Event,
                           rowIndex: event.rowIndex as number
                        }
                     }}
                     onCellValueChanged={onCellValueChanged}
                     onColumnPinned={gridEvents.onColumnPinned}
                     onColumnResized={gridEvents.onColumnResized}
                     onColumnVisible={gridEvents.onColumnVisible}
                     onColumnPivotModeChanged={gridEvents.onColumnPivotModeChanged}
                     onColumnPivotChanged={gridEvents.onColumnPivotChanged}
                     onFilterChanged={gridEvents.onFilterChanged}
                     onSortChanged={gridEvents.onSortChanged}
                     onStateUpdated={gridEvents.onStateUpdated}
                     // onDragStarted={onDragStarted}
                     onFillStart={onFillStart}
                     // onFillEnd={onFillEnd}
                     onFilterModified={onFilterModified}
                     onGridReady={onGridReady}
                     processDataFromClipboard={processDataFromClipboard}
                     rowData={transposedRowData}
                     // suppressColumnVirtualisation={true}
                     suppressClipboardApi={true}
                     statusBar={statusBar}
                     theme={agGridTheme}
                     domLayout="normal"
                  />
               </Box>
            </Box>
         </Box>
      </Box>

   );
};

export default TimeSeriesGrid;
