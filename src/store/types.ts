/**
 * Zustand Store Types
 *
 * Uses WithFunctionalSetters<T> to auto-generate setter types from state definitions.
 * This reduces boilerplate by ~50% compared to manually defining both state and setters.
 */

/**
 WithFunctionalSetters<SubgridState> automatically generates all the normal setters like:

setSelectedSubgridView(updater: SObjectView | null | ((prev: SObjectView | null) => SObjectView | null))

setSubgridViewOptions(updater: SObjectView[] | ((prev: SObjectView[]) => SObjectView[]))

setSelectedSubgridFilter(...)

setIsSubgridFilterActive(...)
...


Per-relation setters (setSubgridViewForRelation and setSubgridViewOptionsForRelation) are manual, because each one depends on a relationName key.

This type now fully supports functional updates everywhere. You can do:

setSelectedSubgridView(prev => prev ? { ...prev, name: 'Updated' } : null);

setSubgridViewForRelation('Contacts', prev => prev ? { ...prev, name: 'New' } : null);

setSubgridViewOptions(prev => [...prev, importedView]);

setSubgridViewOptionsForRelation('Contacts', prev => [...prev, newView]);
 */

import type { StateCreator } from 'zustand';
import type { WithFunctionalSetters } from './typeUtils';

// Re-export types needed by slices and components
export type {
  AgCalculatedColumn,
  AgColumnStyle,
  AgRowStyle,
  CustomStylePanelProps,
  CustomCalculatedColumnPanelProps,
  FilterOption,
  GridEditDialogState,
  GridPermission,
  GridViewType,
  ObjectPreference,
  PicklistItem,
  RelationPreference,
  TimeSeriesFilterOption
} from '../appInterfaces/grid/gridInterfaces';

export type {
  OrgObject,
  SObjectChart,
  SObjectFlow,
  SObjectMetadata,
  SObjectPermission,
  SObjectProject,
  SObjectQuery,
  SObjectTreeGridPreference,
  SObjectView,
  SharedViewDTO,
  SharedQueryDTO,
  TreeGridPref,
  TreeGridState,
  UserInfo,
  UserProfile
} from '../sObjectMetadataTypes';

// Re-export TreeGridState for backwards compatibility
export type { TreeGridState as SObjectTreeGridState } from '../sObjectMetadataTypes';

export type { ChartInfo } from '../appInterfaces/chart/chartTypes';

export type { RuleModel } from '@syncfusion/ej2-react-querybuilder';

export type { ColDef } from 'ag-grid-community';

// Re-export utility types
export type { WithFunctionalSetters, GridContext } from './typeUtils';

// ============================================================
// SIMPLE TYPES
// ============================================================

export interface ThemeOption {
  label: string;
  value: string;
}

export interface GridPrefState {
  lastViewId: string | null;
  lastQueryId: string | null;
  gridPreferenceRecId?: string | null;
}

export interface SchedulerResourceConfig {
  objectApiName: string;
  idField: string;
  nameField: string;
  colorField: string;
  allowMultiple: boolean;
}

export type SchedulerResourceSettings = SchedulerResourceConfig[];
export type FlowEventSource = 'gridView' | 'subGrid';
export type FilterHierarchyMode = 'Parent' | 'Child' | 'Both' | 'None';
export type GanttViewType = 'Task View' | 'Resource View' | 'Utilization View';

export type PanelStateKey =
  | 'showCharts'
  | 'showChartSettings'
  | 'showCalculatedColumnPanel'
  | 'showColumnStylePanel'
  | 'showDeploymentPanel'
  | 'showFlowConfigPanel'
  | 'showGanttViewConfigPanel'
  | 'showGanttViewFilterPanel'
  | 'showHeatmapConfigPanel'
  | 'showMetadataPanel'
  | 'showObjectPrefsPanel'
  | 'showPermissionsPanel'
  | 'showQueryPanel'
  | 'showQueryMetricsPanel'
  | 'showSchedulerConfigPanel'
  | 'showSlackPanel'
  | 'showSlackConfigPanel'
  | 'showShareToSlackDialog'
  | 'showSubgridCalculatedColumnPanel'
  | 'showSubgridColumnStylePanel'
  | 'showTreegridConfigPanel';

export interface ExportTypeOption {
  name: 'exportToCSV' | 'exportToExcel';
  label: string;
}

export interface ConfirmationDialogConfig {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning';
  context?: unknown;
}

// ============================================================
// SLICE STATE INTERFACES (state-only, setters auto-generated)
// ============================================================

// Import types for state definitions
import type {
  AgCalculatedColumn,
  AgColumnStyle,
  AgRowStyle,
  CustomStylePanelProps,
  CustomCalculatedColumnPanelProps,
  FilterOption,
  GridEditDialogState,
  GridPermission,
  GridViewType,
  ObjectPreference,
  PicklistItem,
  RelationPreference,
  TimeSeriesFilterOption
} from '../appInterfaces/grid/gridInterfaces';

import type {
  OrgObject,
  SObjectChart,
  SObjectFlow,
  SObjectMetadata,
  SObjectPermission,
  SObjectQuery,
  SObjectTreeGridPreference,
  SObjectView,
  SharedViewDTO,
  SharedQueryDTO,
  TreeGridPref,
  TreeGridState as SObjectTreeGridState,
  UserInfo,
  UserProfile
} from '../sObjectMetadataTypes';

import type { ChartInfo } from '../appInterfaces/chart/chartTypes';

import type { RuleModel } from '@syncfusion/ej2-react-querybuilder';

import type { ColDef } from 'ag-grid-community';

// DialogState is defined locally to match dialogSlice.ts
// (not imported from hooks/selectors which has a different, limited DialogState)
interface DialogState {
  // Main grid dialogs
  showDeleteRecordDialog: boolean;
  showCreateFilterDialog: boolean;
  showDeleteFilterDialog: boolean;
  showCreateTemplateDialog: boolean;
  showDeleteTemplateDialog: boolean;
  showGridEditDialog: boolean;
  showRecordTypeDialog: boolean;
  showFilterBuilder: boolean;
  showFormatColumnDialog: boolean;
  showFormatRowDialog: boolean;
  showCalculatedColumnDialog: boolean;
  showAdvancedFilterBuilder: boolean;

  // Subgrid dialogs
  showSubgridDeleteRecordDialog: boolean;
  showSubgridCreateFilterDialog: boolean;
  showSubgridDeleteFilterDialog: boolean;
  showSubgridCreateTemplateDialog: boolean;
  showSubgridDeleteTemplateDialog: boolean;
  showSubgridEditDialog: boolean;
  showSubgridFormatColumnDialog: boolean;
  showSubgridFormatRowDialog: boolean;
  showSubgridCalculatedColumnDialog: boolean;
  showSubgridAdvancedFilterBuilder: boolean;

  // Other dialogs
  showCreateProjectDialog: boolean;
  showCreateTimeSeriesRecordDialog: boolean;
  showResourceReassignmentDialog: boolean;
}

/** Export slice */
export interface ExportSlice {
  selectedExportType: ExportTypeOption | null;
  setSelectedExportType: (exportType: ExportTypeOption | null) => void;
}

/** Theme color option for grid themes */
export interface GridColorThemeOption {
  id: string;
  value: unknown;
}

/** Theme slice state */
interface ThemeState {
  selectedTheme: ThemeOption;
  selectedAccentColor: string;
  selectedGridColorTheme: GridColorThemeOption;
  muiColor: string;
  muiBackgroundColor: string;
}
export interface ThemeSlice extends WithFunctionalSetters<ThemeState> {
  toggleGridColorTheme: () => void;
}

/** View slice state */
interface ViewState {
  selectedView: SObjectView | null;
  selectedViewProcessed: boolean;
  selectedViewRecordId: string;
  viewOptions: SObjectView[];
  objViewsRetrieved: boolean;
  filterOptions: FilterOption[];
  selectedFilter: FilterOption | null;
  isFilterActive: boolean;
  showAdvancedFilter: boolean;
  pivotMode: boolean;
}
export type ViewSlice = WithFunctionalSetters<ViewState>;

//** Subgrid slice */
export interface SubgridState {
  selectedSubgridView: SObjectView | null;
  subgridViewOptions: SObjectView[];
  subgridViewByRelation: Record<string, SObjectView | null>;
  subgridViewOptionsByRelation: Record<string, SObjectView[]>;
  selectedSubgridFilter: FilterOption | null;
  subgridFilterOptions: FilterOption[];
  isSubgridFilterActive: boolean;
  showSubgridAdvancedFilter: boolean;
  subgridPivotMode: boolean;
  selectedSubgridType: GridViewType;
  selectedSubgridObject: OrgObject | null;
  selectedSubgridObjMetadata: SObjectMetadata | null;
  activeRelationName?: string;
  subgridGridPrefIdByRelation: Record<string, string>;
  subgridPrefsLoadedByRelation: Record<string, boolean>;
}

/**
 * Subgrid slice type with:
 * - auto-generated functional setters for all state properties
 * - per-relation functional setters
 */
// ✅ SubgridSlice with functional setters + manual per-relation setters
export type SubgridSlice = Omit<
  WithFunctionalSetters<SubgridState>,
  | 'setSubgridViewByRelation'
  | 'setSubgridViewOptionsByRelation'
  | 'setSubgridGridPrefIdByRelation'
  | 'setSubgridPrefsLoadedByRelation'
> & {
  // manual per-relation setters
  setSubgridViewForRelation: (
    relationName: string,
    updater:
      | SObjectView
      | null
      | ((prev: SObjectView | null) => SObjectView | null)
  ) => void;

  setSubgridViewOptionsForRelation: (
    relationName: string,
    updater: SObjectView[] | ((prev: SObjectView[]) => SObjectView[])
  ) => void;

  setSubgridGridPrefIdByRelation: (
    relationName: string,
    updater: string | ((prev: string | undefined) => string)
  ) => void;

  setSubgridPrefsLoadedByRelation: (
    relationName: string,
    updater: boolean | ((prev: boolean | undefined) => boolean)
  ) => void;
};

export type DialogSlice = WithFunctionalSetters<DialogState>;

/** Metadata slice state */
interface MetadataState {
  orgObjects: OrgObject[];
  objectOptions: OrgObject[];
  objectPermissions: SObjectPermission[];
  objectPreferences: ObjectPreference[];
  objectPreferenceRecId: string;
  selectedObject: OrgObject | null;
  selectedObjMetadata: SObjectMetadata | null;
  userInfo: UserInfo | null;
  userProfile: UserProfile | null;
  recordTypes: unknown;
  selectedRecordType: string;
  relationPreferences: RelationPreference[];
  relationPreferenceRecId: string;
}
export type MetadataSlice = WithFunctionalSetters<MetadataState>;

/** Grid slice - complex slice with many custom actions, kept manual */
export interface GridSlice {
  // State
  columnDefs: ColDef[];
  gridErrors: Map<string, string>;
  subgridErrors: Map<string, string>;
  gridEditDialogState: GridEditDialogState;
  gridPermissions: GridPermission;
  gridPermissionsRecId: string | null;
  gridViewTypes: GridViewType[];
  selectedGridType: GridViewType;
  showGridViewTypes: boolean;
  objGridPreference: GridPrefState;
  objCalculatedColumns: AgCalculatedColumn[];
  objCalculatedSubgridColumns: AgCalculatedColumn[];
  selectedCalculatedColumn: AgCalculatedColumn | null;
  selectedSubgridCalculatedColumn: AgCalculatedColumn | null;
  showCalculatedColumnPanel: boolean;
  showSubgridCalculatedColumnPanel: boolean;
  objColumnStyles: AgColumnStyle[];
  objRowStyles: AgRowStyle[];
  objSubgridColumnStyles: AgColumnStyle[];
  objSubgridRowStyles: AgRowStyle[];
  selectedColumnStyle: AgColumnStyle | null;
  selectedRowStyle: AgRowStyle | null;
  selectedSubgridColumnStyle: AgColumnStyle | null;
  selectedSubgridRowStyle: AgRowStyle | null;
  showColumnStylePanel: boolean;
  showSubgridColumnStylePanel: boolean;
  customStylePanelProps: CustomStylePanelProps | null;
  customCalculatedColumnPanelProps: CustomCalculatedColumnPanelProps | null;
  // Setters
  setColumnDefs: (cols: ColDef[]) => void;
  setGridError: (rowId: string, errorMsg: string) => void;
  removeGridError: (rowId: string) => void;
  clearGridErrors: () => void;
  setSubgridError: (rowId: string, errorMsg: string) => void;
  removeSubgridError: (rowId: string) => void;
  clearSubgridErrors: () => void;
  setGridEditDialogState: (state: GridEditDialogState) => void;
  setGridPermissions: (perms: GridPermission) => void;
  setGridPermissionsRecId: (id: string) => void;
  setGridViewTypes: (types: GridViewType[]) => void;
  setSelectedGridType: (type: GridViewType) => void;
  setShowGridViewTypes: (val: boolean) => void;
  setObjGridPreference: (pref: GridPrefState) => void;
  resetObjGridPreference: () => void;
  setLastViewId: (id: string) => void;
  setLastQueryId: (id: string) => void;
  setGridPreferenceRecId: (id: string) => void;
  setObjCalculatedColumns: (cols: AgCalculatedColumn[]) => void;
  setObjCalculatedSubgridColumns: (cols: AgCalculatedColumn[]) => void;
  setSelectedCalculatedColumn: (col: AgCalculatedColumn | null) => void;
  setSelectedSubgridCalculatedColumn: (col: AgCalculatedColumn | null) => void;
  setShowCalculatedColumnPanel: (val: boolean) => void;
  setShowSubgridCalculatedColumnPanel: (val: boolean) => void;
  setObjColumnStyles: (styles: AgColumnStyle[]) => void;
  setObjRowStyles: (styles: AgRowStyle[]) => void;
  setObjSubgridColumnStyles: (styles: AgColumnStyle[]) => void;
  setObjSubgridRowStyles: (styles: AgRowStyle[]) => void;
  setSelectedColumnStyle: (style: AgColumnStyle | null) => void;
  setSelectedRowStyle: (style: AgRowStyle | null) => void;
  setSelectedSubgridColumnStyle: (style: AgColumnStyle | null) => void;
  setSelectedSubgridRowStyle: (style: AgRowStyle | null) => void;
  setShowColumnStylePanel: (val: boolean) => void;
  setShowSubgridColumnStylePanel: (val: boolean) => void;
  setCustomStylePanelProps: (props: CustomStylePanelProps | null) => void;
  setCustomCalculatedColumnPanelProps: (
    props: CustomCalculatedColumnPanelProps | null
  ) => void;
  updateGridPermissions: (name: string, checked: boolean) => void;
  enableGridView: (name: string) => void;
  disableGridView: (name: string) => void;
  enableAllGridViews: () => void;
  restoreAllGridViews: () => void;
}

/** Chart slice state */
interface ChartState {
  chartInfo: ChartInfo | null;
  chartOptions: SObjectChart[] | null;
  objCharts: SObjectChart[];
  objSubgridCharts: SObjectChart[];
  selectedChart: SObjectChart | null;
  selectedSubgridChart: SObjectChart | null;
  showCharts: boolean;
  showChartDialog: boolean;
  showChartSettings: boolean;
  showSaveChartDialog: boolean;
  showSaveChartSubgridDialog: boolean;
  showDeleteChartDialog: boolean;
  showDeleteChartSubgridDialog: boolean;
  useAllChartData: boolean;
  useAllSubgridChartData: boolean;
}
export type ChartSlice = WithFunctionalSetters<ChartState>;

/** Flow slice state */
interface FlowState {
  objFlows: SObjectFlow[];
  subgridObjFlows: SObjectFlow[];
  selectedFlow: SObjectFlow | null;
  selectedSubgridFlow: SObjectFlow | null;
  flowEventSource: FlowEventSource;
  showFlowConfigPanel: boolean;
}
export type FlowSlice = WithFunctionalSetters<FlowState>;

/** Slack slice - has custom compound setter, kept manual */
export interface SlackSlice {
  // State
  showSlackPanel: boolean;
  showSlackConfigPanel: boolean;
  showShareToSlackDialog: boolean;
  slackConfigConfigured: boolean | null;
  slackPanelRecordId: string | null;
  slackPanelObjectType: string | null;
  slackPanelRecordName: string | null;
  slackUserToken: string | null;
  slackChannelsRefreshTrigger: number;
  slackDirectMessages: unknown[];
  slackDirectMessagesRefreshTrigger: number;
  selectedSlackRow: unknown | null;
  // Setters
  setShowSlackPanel: (val: boolean) => void;
  setShowSlackConfigPanel: (val: boolean) => void;
  setShowShareToSlackDialog: (val: boolean) => void;
  setSlackConfigConfigured: (configured: boolean | null) => void;
  setSlackPanelRecord: (
    recordId: string | null,
    objectType: string | null,
    recordName: string | null
  ) => void;
  setSlackUserToken: (token: string | null) => void;
  triggerSlackChannelsRefresh: () => void;
  setSlackDirectMessages: (messages: unknown[]) => void;
  triggerSlackDirectMessagesRefresh: () => void;
  setSelectedSlackRow: (row: unknown | null) => void;
}

/** TreeGrid slice - has Record<> types, kept manual */
export interface TreeGridSlice {
  // State
  treegridParentIdField: string;
  treeGridPref: TreeGridPref | null;
  treeGridPreferences: SObjectTreeGridPreference | null;
  treeGridPreferenceRecId: string;
  treeGridState: SObjectTreeGridState | null;
  subgridTreeGridPreferences: SObjectTreeGridPreference | null;
  subgridTreeGridPreferenceRecId: string;
  subgridTreeGridPrefsByRelation: Record<
    string,
    { prefs: SObjectTreeGridPreference | null; recId: string }
  >;
  showTreegridConfigPanel: boolean;
  // Setters
  setTreegridParentIdField: (field: string) => void;
  setTreeGridPref: (pref: TreeGridPref | null) => void;
  setTreeGridPreferences: (prefs: SObjectTreeGridPreference | null) => void;
  setTreeGridPreferenceRecId: (id: string) => void;
  setTreeGridState: (state: SObjectTreeGridState | null) => void;
  setSubgridTreeGridPreferences: (
    prefs: SObjectTreeGridPreference | null,
    relationName?: string
  ) => void;
  setSubgridTreeGridPreferenceRecId: (
    id: string,
    relationName?: string
  ) => void;
  setShowTreegridConfigPanel: (val: boolean) => void;
}

/** Query slice state */
interface QueryState {
  queryOptions: SObjectQuery[];
  selectedQuery: SObjectQuery | null;
  currentQueryRule: RuleModel;
  queryRuleModified: Record<string, unknown> | null;
  isQueryActive: boolean;
  runQuery: boolean;
  showQueryPanel: boolean;
  showQueryDeleteDialog: boolean;
  showQueryMetricsPanel: boolean;
  currentFilterRule: RuleModel;
  currentTimeSeriesFilterRule: RuleModel;
  isRuleValid: boolean;
}
export type QuerySlice = WithFunctionalSetters<QueryState>;

/** UI slice state */
interface UIState {
  loading: boolean;
  loadingIndicatorText: string;
  initialDataLoaded: boolean;
  showDebugStatements: boolean;
  transposedColumnOptions: PicklistItem[] | null;
  transposedRowData: Record<string, unknown>[];
  selectedTransposedColumn: PicklistItem | null;
  selectedTimeSeriesFilter: TimeSeriesFilterOption | null;
  timeSeriesFilterOptions: TimeSeriesFilterOption[];
  isMainTimeSeriesFilterActive: boolean;
  isSubgridTimeSeriesFilterActive: boolean;
  showDeploymentPanel: boolean;
  showMetadataPanel: boolean;
  showObjectPrefsPanel: boolean;
  showPermissionsPanel: boolean;
  viewStateRecId: string;
  objPreferences: ObjectPreference[];
}
export interface UISlice extends WithFunctionalSetters<UIState> {
  togglePanelState: (panelName: PanelStateKey) => void;
  setExclusivePanel: (panelName: PanelStateKey) => void;
  addTimeSeriesFilterOption: (option: TimeSeriesFilterOption) => void;
  deleteTimeSeriesFilterOption: (id: string) => void;
  updateTimeSeriesFilterOption: (
    name: string,
    option: TimeSeriesFilterOption
  ) => void;
}

/** Confirmation dialog slice */
export interface ConfirmationDialogSlice {
  confirmationDialog: {
    isOpen: boolean;
    config: ConfirmationDialogConfig | null;
    resolve: ((value: boolean) => void) | null;
  };
  openConfirmationDialog: (
    config: ConfirmationDialogConfig
  ) => Promise<boolean>;
  closeConfirmationDialog: (confirmed: boolean) => void;
}

/** Shareable user for share dialog */
export interface ShareableUser {
  id: string;
  name: string;
  profileId: string;
  profileName: string;
  isSelected: boolean;
  isCurrentlyShared: boolean;
}

/** View sharing slice state */
interface ViewSharingState {
  sharedWithMeViews: SharedViewDTO[];
  sharedWithMeLoading: boolean;
  showShareViewDialog: boolean;
  shareDialogViewId: string | null;
  shareDialogViewName: string | null;
  shareDialogRecipients: SharedViewDTO[];
  shareDialogRecipientsLoading: boolean;
  shareDialogUsers: ShareableUser[];
  shareDialogUsersLoading: boolean;
  shareDialogProfileFilter: string | null;
  showImportViewDialog: boolean;
  importDialogSharedView: SharedViewDTO | null;
  pendingViewUpdates: SharedViewDTO[];
  pendingUpdatesNotificationShown: boolean;
  sharedByUserFilter: string | null;
}
export interface ViewSharingSlice
  extends WithFunctionalSetters<ViewSharingState> {
  openShareViewDialog: (viewId: string, viewName: string) => void;
  closeShareViewDialog: () => void;
  openImportViewDialog: (sharedView: SharedViewDTO) => void;
  closeImportViewDialog: () => void;
  toggleShareDialogUserSelection: (userId: string) => void;
  selectAllShareDialogUsers: () => void;
  deselectAllShareDialogUsers: () => void;
  getViewsWithPendingUpdates: () => SharedViewDTO[];
  markViewAsUpdated: (viewId: string) => void;
  resetViewSharingState: () => void;
}

/** Query sharing slice state */
interface QuerySharingState {
  sharedWithMeQueries: SharedQueryDTO[];
  sharedWithMeQueriesLoading: boolean;
  showShareQueryDialog: boolean;
  shareQueryDialogQueryId: string | null;
  shareQueryDialogQueryName: string | null;
  shareQueryDialogRecipients: SharedQueryDTO[];
  shareQueryDialogRecipientsLoading: boolean;
  shareQueryDialogUsers: ShareableUser[];
  shareQueryDialogUsersLoading: boolean;
  shareQueryDialogProfileFilter: string | null;
  showImportQueryDialog: boolean;
  importDialogSharedQuery: SharedQueryDTO | null;
  pendingQueryUpdates: SharedQueryDTO[];
  pendingQueryUpdatesNotificationShown: boolean;
  sharedByUserQueryFilter: string | null;
}
export interface QuerySharingSlice
  extends WithFunctionalSetters<QuerySharingState> {
  openShareQueryDialog: (queryId: string, queryName: string) => void;
  closeShareQueryDialog: () => void;
  openImportQueryDialog: (sharedQuery: SharedQueryDTO) => void;
  closeImportQueryDialog: () => void;
  toggleShareQueryDialogUserSelection: (userId: string) => void;
  selectAllShareQueryDialogUsers: () => void;
  deselectAllShareQueryDialogUsers: () => void;
  getQueriesWithPendingUpdates: () => SharedQueryDTO[];
  markQueryAsUpdated: (queryId: string) => void;
  resetQuerySharingState: () => void;
}

// ============================================================
// COMBINED STORE TYPE
// ============================================================

export interface Store
  extends ThemeSlice,
    ExportSlice,
    ViewSlice,
    SubgridSlice,
    DialogSlice,
    MetadataSlice,
    GridSlice,
    ChartSlice,
    FlowSlice,
    SlackSlice,
    TreeGridSlice,
    QuerySlice,
    UISlice,
    ConfirmationDialogSlice,
    ViewSharingSlice,
    QuerySharingSlice {}

// ============================================================
// LEGACY TYPE ALIASES (for backwards compatibility)
// ============================================================

/** @deprecated Use SliceCreator from typeUtils.ts instead */
export type SliceCreator<T> = StateCreator<
  Store,
  [['zustand/devtools', never]],
  [],
  T
>;
