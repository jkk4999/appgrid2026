// Centralized PubSub topics with tiny emit helpers
// This consolidates raw string usage and provides light typing.

import PubSub from 'pubsub-js';

export const TOPICS = {
  // LMS Actions (external component communication)
  LMS_GET_CAPABILITIES: 'LmsGetCapabilities',
  LMS_SELECT_OBJECT: 'LmsSelectObject',
  LMS_SELECT_VIEW: 'LmsSelectView',
  LMS_EXECUTE_QUERY: 'LmsExecuteQuery',
  LMS_GET_VIEWS: 'LmsGetViews',
  LMS_GET_QUERIES: 'LmsGetQueries',
  LMS_GET_ORG_OBJECTS: 'LmsGetOrgObjects',
  LMS_SELECT_QUERY: 'LmsSelectQuery',
  LMS_GET_FILTERS: 'LmsGetFilters',
  LMS_SET_ADVANCED_FILTER: 'LmsSetAdvancedFilter',
  LMS_CLEAR_FILTERS: 'LmsClearFilters',
  LMS_GET_COLUMN_STYLES: 'LmsGetColumnStyles',
  LMS_SET_COLUMN_STYLE: 'LmsSetColumnStyle',
  LMS_CLEAR_COLUMN_STYLES: 'LmsClearColumnStyles',
  LMS_GET_ROW_STYLES: 'LmsGetRowStyles',
  LMS_SET_ROW_STYLE: 'LmsSetRowStyle',
  LMS_CLEAR_ROW_STYLES: 'LmsClearRowStyles',

  // Queries/View state
  RUN_QUERY: 'RunQuery',
  REFRESH_QUERY: 'RefreshQuery',
  REFRESH_SUBGRID_QUERY: 'RefreshSubgridQuery',

  // Records
  ADD_GRID_ROW: 'AddGridRow',
  EDIT_RECORD: 'EditRecord',
  SAVE_RECORDS: 'SaveRecords',
  DELETE_RECORDS: 'DeleteRecords',

  // TreeGrid variants (existing strings kept for compatibility)
  SAVE_TREEGRID_RECORDS: 'SaveTreeGridRecords',
  DELETE_TREEGRID_RECORDS: 'DeleteTreeGridRecords',
  EDIT_TREEGRID_RECORD: 'EditTreeGridRecord',

  // Templates
  CREATE_TEMPLATE: 'CreateTemplate',
  DELETE_TEMPLATE: 'DeleteTemplate',

  // Filters
  SAVE_FILTER: 'Save Filter',
  CLEAR_FILTERS: 'ClearFilters',
  DELETE_FILTER: 'Delete Filter',

  // Charts
  CHART_SELECTION_CHANGED: 'ChartSelectionChanged',
  DELETE_CHART: 'DeleteChart',
  SELECT_ALL_GRID_DATA: 'SelectAllGridData',
  REFRESH_CHART_DATA: 'RefreshChartData',

  // UI/Panels
  SHOW_QUERY_BUILDER_DIALOG: 'ShowQueryBuilderDialog',
  SHOW_COLUMN_STYLE_PANEL: 'ShowColumnStylePanel',
  SHOW_CALCULATED_COLUMN_PANEL: 'ShowCalculatedColumnPanel',
  OPEN_COLUMNS_PANEL: 'OpenColumnsPanel',
  OPEN_FILTERS_PANEL: 'OpenFiltersPanel',
} as const;

export type Topic = typeof TOPICS[keyof typeof TOPICS];

// Optional payload used to scope toolbar events
export type ToolbarPayload = {
  context?: 'main' | 'subgrid';
  gridId?: string | number | null;
  recordId?: string | null;
};

export function emit(topic: Topic, payload?: unknown) {
  PubSub.publish(topic, payload as any);
}

// Convenience emitters for common actions
export const emitRunQuery = () => emit(TOPICS.RUN_QUERY);
export const emitRefreshQuery = () => emit(TOPICS.REFRESH_QUERY);
export const emitRefreshSubgridQuery = () => emit(TOPICS.REFRESH_SUBGRID_QUERY);
export const emitSaveRecords = (payload?: ToolbarPayload) => emit(TOPICS.SAVE_RECORDS, payload);
export const emitDeleteRecords = (payload?: ToolbarPayload) => emit(TOPICS.DELETE_RECORDS, payload);
export const emitEditRecord = (payload?: ToolbarPayload) => emit(TOPICS.EDIT_RECORD, payload);
export const emitDeleteTemplate = () => emit(TOPICS.DELETE_TEMPLATE);
export const emitShowQueryBuilder = () => emit(TOPICS.SHOW_QUERY_BUILDER_DIALOG);
export const emitShowColumnStylePanel = () => emit(TOPICS.SHOW_COLUMN_STYLE_PANEL);
export const emitShowCalculatedColumnPanel = () => emit(TOPICS.SHOW_CALCULATED_COLUMN_PANEL);
export const emitOpenColumnPanel = (payload?: ToolbarPayload) => {
  (document.activeElement as HTMLElement | null)?.blur?.();
  emit(TOPICS.OPEN_COLUMNS_PANEL, payload);
};
export const emitOpenFilterPanel = (payload?: ToolbarPayload) =>
  emit(TOPICS.OPEN_FILTERS_PANEL, payload);
