import { useCallback } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { SObjectView, SObjectMetadata, SObjectFieldMetadata } from '../sObjectMetadataTypes';
import useStore from '../zustandStore';
import useGridAssets from '../hooks/grid/useGridAssets';
import { prettyPrint } from '../utilities/prettyPrint';

export interface UseViewUpsertsParams {
  getGridApi: () => GridApi | null | undefined;
  sObjectApiName: string; // Qualified API name
  isSubgrid: boolean;
  // Normalized upsert that returns success + id
  upsert: (payload: any) => Promise<{ success: boolean; id: string; errorMessage?: string }>;
  // Component-specific view fetcher
  fetchViews: () => Promise<SObjectView[]>;
  // Apply view lists and optionally select a view
  setViewOptions: (views: SObjectView[]) => void;
  setSelectedView?: (view: SObjectView) => void;
  onError?: (msg: string) => void;
  getParentFields?: () => string; // Optional: Get parent fields JSON for saving
  // Optional: Get metadata for building default column state when grid is empty
  getMetadata?: () => SObjectMetadata | null;
}

/**
 * Build a default column state from metadata when grid has no data columns.
 * This ensures the default view includes ALL data columns from the object metadata,
 * matching how the main grid creates its default view.
 *
 * The column state controls visibility and ordering - creating AgGrid columns
 * is done separately by createAgGridColumns based on metadata.
 */
function buildDefaultColumnStateFromMetadata(metadata: SObjectMetadata): any[] {
  const fields = metadata.fields || [];

  // Find the name field to put it first (after system columns)
  const nameField = fields.find((f: SObjectFieldMetadata) => f.isNameField)?.name || 'Name';

  // Build column state for ALL fields from metadata (like the main grid does)
  // The order is: selection column, error column, name field, then all other fields, Id last
  const otherFields = fields
    .filter((f: SObjectFieldMetadata) => f.name !== nameField && f.name !== 'Id')
    .map((f: SObjectFieldMetadata) => f.name);

  // Build ordered list: name field first, then other fields, Id last
  const orderedFields: string[] = [];

  // Add name field if it exists
  if (fields.some((f: SObjectFieldMetadata) => f.name === nameField)) {
    orderedFields.push(nameField);
  }

  // Add all other fields
  orderedFields.push(...otherFields);

  // Add Id at the end
  if (!orderedFields.includes('Id')) {
    orderedFields.push('Id');
  }

  // Build the column state array with ALL fields visible
  const columnState = [
    // Selection column
    { colId: 'ag-Grid-SelectionColumn', width: 50, hide: false, pinned: null, sort: null, sortIndex: null, aggFunc: null, rowGroup: false, rowGroupIndex: null, pivot: false, pivotIndex: null, flex: null },
    // Error column (hidden by default)
    { colId: 'error', width: 150, hide: true, pinned: null, sort: null, sortIndex: null, aggFunc: null, rowGroup: false, rowGroupIndex: null, pivot: false, pivotIndex: null, flex: 1 },
    // ALL data columns from metadata
    ...orderedFields.map((field, idx) => ({
      colId: field,
      width: 200,
      hide: false,
      pinned: null,
      sort: idx === 0 ? 'asc' : null,  // Sort by name field
      sortIndex: idx === 0 ? 0 : null,
      aggFunc: null,
      rowGroup: false,
      rowGroupIndex: null,
      pivot: false,
      pivotIndex: null,
      flex: 1,
    })),
  ];

  prettyPrint('[useViewUpserts] Built default column state from metadata with ALL fields', orderedFields.length, 'green');
  return columnState;
}

export function useViewUpserts({
  getGridApi,
  sObjectApiName,
  isSubgrid,
  upsert,
  fetchViews,
  setViewOptions,
  setSelectedView,
  onError,
  getParentFields,
  getMetadata
}: UseViewUpsertsParams) {
  const { getStyles, getCalculatedColumns } = useGridAssets({ isSubgrid });
  // Centralize extras hydration inside the hook
  const hydrateExtras = useCallback(() => {
    const styles = getStyles();
    const calcCols = getCalculatedColumns();
    const state = useStore.getState();
    const filterOptions = isSubgrid
      ? state.subgridFilterOptions
      : state.filterOptions;
    const pivotMode = state.pivotMode;
    const showAdvancedFilter = isSubgrid
      ? state.showSubgridAdvancedFilter
      : state.showAdvancedFilter;
    const parentFields = getParentFields?.() || '';
    return {
      calculatedColumns: calcCols,
      columnStyles: styles.columns,
      rowStyles: styles.rows,
      filterOptions,
      pivotMode,
      showAdvancedFilter,
      parentFields
    };
  }, [getCalculatedColumns, getStyles, isSubgrid, getParentFields]);

  const createDefaultView = useCallback(async (): Promise<string> => {
    const api = getGridApi?.();
    if (!api) throw new Error('Grid API not ready');

    const gridState = (api as any).getState?.();
    let columnState = api.getColumnState?.();
    const extras = hydrateExtras();

    // Check if the grid has actual data columns or just system columns (selection, error)
    // If no data columns, build a proper default column state from metadata
    const hasDataColumns = columnState?.some((col: any) =>
      col.colId && !['ag-Grid-SelectionColumn', 'error', 'ag-Grid-AutoColumn'].includes(col.colId)
    );

    if (!hasDataColumns) {
      prettyPrint('[useViewUpserts] Grid has no data columns, checking for metadata...', null, 'orange');
      const metadata = getMetadata?.();
      if (metadata) {
        columnState = buildDefaultColumnStateFromMetadata(metadata);
        prettyPrint('[useViewUpserts] Built column state from metadata', columnState?.length, 'green');
      } else {
        prettyPrint('[useViewUpserts] No metadata available, using grid column state as-is', null, 'orange');
      }
    }

    const payload = {
      Name: 'Default View',
      AppGridAg__SObjectApiName__c: sObjectApiName,
      AppGridAg__Grid_State__c: JSON.stringify(gridState),
      AppGridAg__Column_State__c: JSON.stringify(columnState),
      AppGridAg__Calculated_Columns__c: JSON.stringify(
        extras.calculatedColumns
      ),
      AppGridAg__Column_Styles__c: JSON.stringify(extras.columnStyles),
      AppGridAg__Row_Styles__c: JSON.stringify(extras.rowStyles),
      AppGridAg__IsSubgridView__c: isSubgrid,
      AppGridAg__Pivot_Mode__c: extras.pivotMode,
      AppGridAg__FilterOptions__c: JSON.stringify(extras.filterOptions),
      AppGridAg__ShowAdvancedFilter__c: extras.showAdvancedFilter,
      AppGridAg__Parent_Fields__c: extras.parentFields || ''
    };

    prettyPrint('[useViewUpserts] Default view payload', payload, 'blue');
    const result = await upsert(payload);
    prettyPrint('[useViewUpserts] Default view upsert result', result, 'blue');
    if (!result.success) {
      const details = result.errorMessage ? `: ${result.errorMessage}` : '';
      throw new Error(`Upsert failed creating default view${details}`);
    }
    return result.id;
  }, [getGridApi, getMetadata, hydrateExtras, isSubgrid, sObjectApiName, upsert]);

  const saveViewByName = useCallback(
    async (name: string): Promise<SObjectView | null> => {
      if (!name) {
        return null;
      }

      const api = getGridApi?.();
      if (!api) {
        throw new Error('Grid API not ready');
      }

      prettyPrint('Creating new view with name', name, 'green');

      const gridState = (api as any).getState?.();
      const columnState = api.getColumnState?.();
      const extras = hydrateExtras();

      const payload = {
        Name: name,
        AppGridAg__SObjectApiName__c: sObjectApiName,
        AppGridAg__Grid_State__c: JSON.stringify(gridState),
        AppGridAg__Column_State__c: JSON.stringify(columnState),
        AppGridAg__Calculated_Columns__c: JSON.stringify(
          extras.calculatedColumns
        ),
        AppGridAg__Column_Styles__c: JSON.stringify(extras.columnStyles),
        AppGridAg__Row_Styles__c: JSON.stringify(extras.rowStyles),
        AppGridAg__IsSubgridView__c: isSubgrid,
        AppGridAg__Pivot_Mode__c: extras.pivotMode,
        AppGridAg__FilterOptions__c: JSON.stringify(extras.filterOptions),
        AppGridAg__ShowAdvancedFilter__c: extras.showAdvancedFilter,
        AppGridAg__Parent_Fields__c: extras.parentFields || ''
      };

      prettyPrint('[useViewUpserts] Save view payload', payload, 'blue');
      const result = await upsert(payload);
      prettyPrint('[useViewUpserts] Save view upsert result', result, 'blue');
      if (!result.success) {
        const details = result.errorMessage ? `: ${result.errorMessage}` : '';
        throw new Error(`Upsert failed${details}`);
      }

      // update the view options
      const views = await fetchViews();
      if (!Array.isArray(views) || views.length === 0) {
        throw new Error('No views returned after save');
      }

      setViewOptions(views);

      // set selected view to the new view
      const view =
        views.find((v: any) => v.name === name || v.Name === name) || null;

      if (view && setSelectedView) {
        setSelectedView(view);
      }

      return view;
    },
    [
      fetchViews,
      hydrateExtras,
      getGridApi,
      isSubgrid,
      sObjectApiName,
      setSelectedView,
      setViewOptions,
      upsert
    ]
  );

  const reloadViews = useCallback(async (): Promise<SObjectView[]> => {
    try {
      const views = await fetchViews();
      setViewOptions(views);
      prettyPrint('Reloaded views', null, 'green');
      return views;
    } catch (e: any) {
      onError?.(e?.message ?? 'Error loading views');
      return [] as SObjectView[];
    }
  }, [fetchViews, onError, setViewOptions]);

  return { createDefaultView, saveViewByName, reloadViews };
}
