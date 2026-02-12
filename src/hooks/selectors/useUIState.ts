import { useShallow } from 'zustand/react/shallow';
import useStore from '../../zustandStore';

// ============================================================
// STABLE SELECTORS (no conditionals inside)
// ============================================================

const uiStateSelector = (state: any) => ({
  loading: state.loading,
  setLoading: state.setLoading,
  loadingIndicatorText: state.loadingIndicatorText,
  setLoadingIndicatorText: state.setLoadingIndicatorText,
  initialDataLoaded: state.initialDataLoaded,
  setInitialDataLoaded: state.setInitialDataLoaded,
});

const themeStateSelector = (state: any) => ({
  selectedTheme: state.selectedTheme,
  setSelectedTheme: state.setSelectedTheme,
  selectedAccentColor: state.selectedAccentColor,
  setSelectedAccentColor: state.setSelectedAccentColor,
  selectedGridColorTheme: state.selectedGridColorTheme,
  setSelectedGridColorTheme: state.setSelectedGridColorTheme,
  muiColor: state.muiColor,
  setMuiColor: state.setMuiColor,
  muiBackgroundColor: state.muiBackgroundColor,
  setMuiBackgroundColor: state.setMuiBackgroundColor,
});

const mainGridTypeSelector = (state: any) => ({
  selectedGridType: state.selectedGridType,
  setSelectedGridType: state.setSelectedGridType,
  gridViewTypes: state.gridViewTypes,
  setGridViewTypes: state.setGridViewTypes,
  showGridViewTypes: state.showGridViewTypes,
  setShowGridViewTypes: state.setShowGridViewTypes,
});

const subgridGridTypeSelector = (state: any) => ({
  selectedGridType: state.selectedSubgridType,
  setSelectedGridType: state.setSelectedSubgridType,
  gridViewTypes: state.gridViewTypes,
  setGridViewTypes: state.setGridViewTypes,
  showGridViewTypes: state.showGridViewTypes,
  setShowGridViewTypes: state.setShowGridViewTypes,
});

const queryStateSelector = (state: any) => ({
  selectedQuery: state.selectedQuery,
  setSelectedQuery: state.setSelectedQuery,
  queryOptions: state.queryOptions,
  setQueryOptions: state.setQueryOptions,
  currentQueryRule: state.currentQueryRule,
  setCurrentQueryRule: state.setCurrentQueryRule,
  queryRuleModified: state.queryRuleModified,
  setQueryRuleModified: state.setQueryRuleModified,
  isQueryActive: state.isQueryActive,
  setIsQueryActive: state.setIsQueryActive,
  runQuery: state.runQuery,
  setRunQuery: state.setRunQuery,
  showQueryPanel: state.showQueryPanel,
  setShowQueryPanel: state.setShowQueryPanel,
  showQueryDeleteDialog: state.showQueryDeleteDialog,
  setShowQueryDeleteDialog: state.setShowQueryDeleteDialog,
  showQueryMetricsPanel: state.showQueryMetricsPanel,
  setShowQueryMetricsPanel: state.setShowQueryMetricsPanel,
});

const gridPermissionsSelector = (state: any) => ({
  gridPermissions: state.gridPermissions,
  setGridPermissions: state.setGridPermissions,
  gridPermissionsRecId: state.gridPermissionsRecId,
  setGridPermissionsRecId: state.setGridPermissionsRecId,
  updateGridPermissions: state.updateGridPermissions,
});

const gridPreferenceSelector = (state: any) => ({
  objGridPreference: state.objGridPreference,
  setObjGridPreference: state.setObjGridPreference,
  resetObjGridPreference: state.resetObjGridPreference,
  setLastViewId: state.setLastViewId,
  setLastQueryId: state.setLastQueryId,
  setGridPreferenceRecId: state.setGridPreferenceRecId,
});

const mainDialogSelector = (state: any) => ({
  showDeleteRecordDialog: state.showDeleteRecordDialog,
  setShowDeleteRecordDialog: state.setShowDeleteRecordDialog,
  showEditDialog: state.showGridEditDialog,
  setShowEditDialog: state.setShowGridEditDialog,
  showCreateFilterDialog: state.showCreateFilterDialog,
  setShowCreateFilterDialog: state.setShowCreateFilterDialog,
  showDeleteFilterDialog: state.showDeleteFilterDialog,
  setShowDeleteFilterDialog: state.setShowDeleteFilterDialog,
  showCreateTemplateDialog: state.showCreateTemplateDialog,
  setShowCreateTemplateDialog: state.setShowCreateTemplateDialog,
  showDeleteTemplateDialog: state.showDeleteTemplateDialog,
  setShowDeleteTemplateDialog: state.setShowDeleteTemplateDialog,
});

const subgridDialogSelector = (state: any) => ({
  showDeleteRecordDialog: state.showSubgridDeleteRecordDialog,
  setShowDeleteRecordDialog: state.setShowSubgridDeleteRecordDialog,
  showEditDialog: state.showSubgridEditDialog,
  setShowEditDialog: state.setShowSubgridEditDialog,
  showCreateFilterDialog: state.showSubgridCreateFilterDialog,
  setShowCreateFilterDialog: state.setShowSubgridCreateFilterDialog,
  showDeleteFilterDialog: state.showSubgridDeleteFilterDialog,
  setShowDeleteFilterDialog: state.setShowSubgridDeleteFilterDialog,
  showCreateTemplateDialog: state.showSubgridCreateTemplateDialog,
  setShowCreateTemplateDialog: state.setShowSubgridCreateTemplateDialog,
  showDeleteTemplateDialog: state.showSubgridDeleteTemplateDialog,
  setShowDeleteTemplateDialog: state.setShowSubgridDeleteTemplateDialog,
});

const debugStateSelector = (state: any) => ({
  showDebugStatements: state.showDebugStatements,
  setShowDebugStatements: state.setShowDebugStatements,
});

const recordTypeSelector = (state: any) => ({
  recordTypes: state.recordTypes,
  setRecordTypes: state.setRecordTypes,
  selectedRecordType: state.selectedRecordType,
  setSelectedRecordType: state.setSelectedRecordType,
  showRecordTypeDialog: state.showRecordTypeDialog,
  setShowRecordTypeDialog: state.setShowRecordTypeDialog,
});

const chartDisplaySelector = (state: any) => ({
  chartInfo: state.chartInfo,
  setChartInfo: state.setChartInfo,
  showCharts: state.showCharts,
  setShowCharts: state.setShowCharts,
  showChartDialog: state.showChartDialog,
  setShowChartDialog: state.setShowChartDialog,
  showChartSettings: state.showChartSettings,
  setShowChartSettings: state.setShowChartSettings,
});

const flowConfigSelector = (state: any) => ({
  showFlowConfigPanel: state.showFlowConfigPanel,
  setShowFlowConfigPanel: state.setShowFlowConfigPanel,
});

// ============================================================
// HOOK EXPORTS
// ============================================================

/**
 * Selector hook for general UI state (loading, theming, etc).
 */
export function useUIState() {
  return useStore(useShallow(uiStateSelector));
}

/**
 * Selector hook for theme-related state.
 */
export function useThemeState() {
  return useStore(useShallow(themeStateSelector));
}

/**
 * Selector hook for grid type selection.
 */
export function useGridTypeState(isSubgrid: boolean = false) {
  const mainResult = useStore(useShallow(mainGridTypeSelector));
  const subgridResult = useStore(useShallow(subgridGridTypeSelector));
  return isSubgrid ? subgridResult : mainResult;
}

/**
 * Dedicated hook for subgrid grid type state - preferred for subgrid components.
 */
export function useSubgridGridTypeState() {
  return useStore(useShallow(subgridGridTypeSelector));
}

/**
 * Dedicated hook for main grid grid type state - preferred for main grid components.
 */
export function useMainGridTypeState() {
  return useStore(useShallow(mainGridTypeSelector));
}

/**
 * Selector hook for query state.
 */
export function useQueryState() {
  return useStore(useShallow(queryStateSelector));
}

/**
 * Selector hook for grid permissions.
 */
export function useGridPermissions() {
  return useStore(useShallow(gridPermissionsSelector));
}

/**
 * Selector hook for grid preference state.
 */
export function useGridPreferenceState() {
  return useStore(useShallow(gridPreferenceSelector));
}

/**
 * Selector hook for delete/edit dialog state.
 */
export function useDialogState(isSubgrid: boolean = false) {
  const mainResult = useStore(useShallow(mainDialogSelector));
  const subgridResult = useStore(useShallow(subgridDialogSelector));
  return isSubgrid ? subgridResult : mainResult;
}

/**
 * Dedicated hook for subgrid dialog state - preferred for subgrid components.
 */
export function useSubgridDialogState() {
  return useStore(useShallow(subgridDialogSelector));
}

/**
 * Dedicated hook for main grid dialog state - preferred for main grid components.
 */
export function useMainDialogState() {
  return useStore(useShallow(mainDialogSelector));
}

/**
 * Selector hook for debug state.
 */
export function useDebugState() {
  return useStore(useShallow(debugStateSelector));
}

/**
 * Selector hook for record type state.
 */
export function useRecordTypeState() {
  return useStore(useShallow(recordTypeSelector));
}

/**
 * Selector hook for chart display state (shared across main/subgrid).
 */
export function useChartDisplay() {
  return useStore(useShallow(chartDisplaySelector));
}

/**
 * Selector hook for flow config state (shared).
 */
export function useFlowConfig() {
  return useStore(useShallow(flowConfigSelector));
}

export default useUIState;
