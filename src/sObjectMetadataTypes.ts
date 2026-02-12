import { ColumnState } from 'ag-grid-community';
import {
  AgCalculatedColumn,
  AgColumnStyle,
  AgRowStyle,
  FilterOption
} from './appInterfaces/grid/gridInterfaces';

export interface CreateTemplateApiResponse {
  status: string;
  errorMessage: string;
  templates: SObjectGridTemplate[];
}

export interface GetEventsApiResponse {
  status: string;
  errorMessage: string;
  records: Map<string, object>[];
  queryLocator: string;
}

export interface InitialData {
  userInfo: string;
  orgObjects: string;
  gridPermissions: string;
  objPreferences: string;
  userProfile: string;
  metadata: Map<string, object>;
}

export interface SObjectFieldPermission {
  Id: string;
  ParentId: string;
  SobjectType: string;
  Field: string;
  PermissionsRead: boolean;
  PermissionsEdit: boolean;
}

export interface SObjectGridPermission {
  id: string;
  name: string;
  ownerId: string;
  user: string;
  gridPermissions: string;
  lastModifiedById: string;
  createdById: string;
}

export interface SObjectGridTemplate {
  id: string;
  name: string;
  ownerId?: string;
  description?: string;
  lastModifiedById?: string;
  createdById?: string;
}

export interface SObjectObjPreference {
  id?: string;
  name: string;
  ownerId: string;
  preferences: string;
  lastModifiedById: string;
  createdById: string;
}

export interface GridTemplateApiResponse {
  status: string;
  errorMessage: string;
  templates: SObjectGridTemplate[];
}

export interface OrgObject {
  isCustomizable: boolean;
  isCustomSetting: boolean;
  isFeedEnabled: boolean;
  isQueryable: boolean;
  isRetrieveable: boolean;
  isSearchable: boolean;
  isWorkflowEnabled: boolean;
  keyPrefix: string;
  label: string;
  permissionsCreate: boolean;
  permissionsDelete: boolean;
  permissionsEdit: boolean;
  permissionsModifyAll: boolean;
  permissionsRead: boolean;
  permissionsViewAll: boolean;
  pluralLabel: string;
  qualifiedApiName: string;
  sObjectType: string;
}

export interface SObject {
  Id?: string;
  [key: string]: unknown; // For additional optional fields
}

export interface SObjectQueryLocatorApiResponse {
  records: SObject[];
  queryLocater: string;
}

export interface SObjectDeleteResult {
  id: string;
  recordId: string;
  isSuccess: boolean;
  errors: string[];
  errorMessages: string[];
  recordIndex?: number;
}

export interface SObjectDeleteApiResponse {
  deleteResult: SObjectDeleteResult[];
}

// Batchified delete response from Apex
export interface BatchDeleteResponse {
  status: 'success' | 'error';
  results: SObjectDeleteResult[];
  batchMode: boolean;
  batchSize?: number;
  batchIndex?: number;
  processedCount: number;
  totalCount: number;
  hasMore: boolean;
  nextBatchIndex?: number;
  errorMessage?: string;
}

export interface SObjectUpsertResult {
  recordId: string;
  isSuccess: boolean;
  errors: string[];
  errorMessages: string[];
  recordIndex?: number;
}

// Batchified upsert response from Apex
export interface BatchUpsertResponse {
  status: 'success' | 'error';
  results: SObjectUpsertResult[];
  batchMode: boolean;
  batchSize?: number;
  batchIndex?: number;
  processedCount: number;
  totalCount: number;
  hasMore: boolean;
  nextBatchIndex?: number;
  errorMessage?: string;
}

export interface AgWrapperUpsertResult {
  status: string;
  errorMessage: string;
  upsertResult: Record<number, string>; // Map<Integer, String> in Apex translates to Record<number, string> in TypeScript
  recordIds: Record<number, string>; // Map<Integer, Id> in Apex; since Id in Salesforce is a string, we use string here
}

export interface SObjectNameApiResponse {
  status: string;
  errorMsg: string;
  sObjectName: string;
}

export interface SObjectRelationPreference {
  id: string;
  name: string;
  ownerId: string;
  preferences: string;
  sobjectApiName: string;
  lastModifiedById: string;
  createdById: string;
}

export interface SObjectChart {
  // DTO properties (camelCase from Apex DTO)
  id?: string;
  name?: string;
  ownerId?: string;
  sobjectApiName?: string;
  chartConfig?: string;
  gridFilter?: string;
  chartQuery?: string;
  chartView?: string;
  isPivotChart?: boolean;
  // Legacy Salesforce field names (for backwards compatibility)
  Id?: string;
  Name?: string;
  OwnerId?: string;
  AppGridAg__SObjectApiName__c?: string;
  AppGridAg__Chart_Config__c?: string;
  AppGridAg__Grid_Filter__c?: string;
  AppGridAg__Chart_Query__c?: string;
  AppGridAg__Chart_View__c?: string;
  AppGridAg__Is_Pivot_Chart__c?: boolean;
}

export interface SObjectChartApiResponse {
  status: string;
  errorMessage: string;
  charts: SObjectChart[];
}

export interface SObjectFlow {
  id?: string;
  name?: string;
  ownerId?: string;
  sObjectApiName: string;
  flowProperties?: string;
  flowParameters?: string;
  isActive: boolean;
}

export interface SObjectFlowApiResponse {
  status: string;
  errorMessage: string;
  flows: SObjectFlow[];
}

export interface SObjectRelationPreferenceApiResponse {
  status: string;
  errorMessage: string;
  relationPreferences: SObjectRelationPreference[];
}

export interface SObjectConfigTemplate {
  Id: string;
  Name: string;
  AppGridAg__AG_Chart_Prefs__c: string;
  AppGridAg__AG_Flow_Prefs__c: string;
  AppGridAg__AG_TreeGrid_Prefs__c: string;
  AppGridAg__AG_VIew_Prefs__c: string;
  AppGridAg__Object_Prefs__c: string;
  AppGridAg__Permission_Prefs__c: string;
  AppGridAg__Relation_Prefs__c: string;
  AppGridAg__Query_Prefs__c: string;
  AppGridAg__TimeSeries_Prefs__c: string;
  OwnerId: string;
  LastModifiedById: string;
  CreatedById: string;
}

export interface SObjectConfigTemplateApiResponse {
  status: string;
  errorMessage: string;
  templates: SObjectConfigTemplate[];
}

export interface SObjectLookupRec {
  Id: string;
  Name: string;
}

export interface SObjectMetadata {
  apiName: string;
  sobjectType: string;
  label: string;
  labelPlural: string;
  keyPrefix: string;
  isAccessible: boolean;
  isCreateable: boolean;
  isDeletable: boolean;
  isQueryable: boolean;
  isUpdateable: boolean;
  isSearchable: boolean;
  fields: SObjectFieldMetadata[];
  recordTypes: SObjectRecordTypeInfo[]; // renamed to match Apex DTO
  childRelationships: SObjectChildRelationshipInfo[];
}

export interface SObjectFieldMetadata {
  name: string;
  label: string;
  type: string;
  length: number;
  isAccessible: boolean;
  isCreateable: boolean;
  isUpdateable: boolean;
  isAutoNumber: boolean;
  isCalculated: boolean;
  isCustom: boolean;
  isDefaultedOnCreate: boolean;
  isDependentPicklist: boolean;
  isFilterable: boolean;
  isGroupable: boolean;
  isNameField: boolean;
  isNillable: boolean;
  isPermissionable: boolean;
  isSortable: boolean;
  defaultValue: string | null;
  relationshipName?: string | null;
  relationshipOrder?: number | null;
  referenceTo: string[];
  picklistValues: SObjectPicklistValue[];
}

export interface SObjectPicklistValue {
  value: string;
  label: string;
}

export interface SObjectRecordTypeInfo {
  recordTypeId: string;
  name: string;
  isActive: boolean;
  isAvailable: boolean;
  isDefaultRecordTypeMapping: boolean;
  isMaster: boolean;
}

export interface SObjectChildRelationshipInfo {
  childSObject: string;
  relationshipName: string;
  field: string;
}

export interface SObjectUser {
  Id: string;
  Name: string;
}

export interface RunFlowApiResult {
  status: string;
  errorMessage?: string;
  returnValue?: string;
  returnValues?: string[];
  returnBoolean?: boolean;
  returnDecimal?: number;
  returnInteger?: number;
  returnDate?: Date;
  returnDateTime?: Date;
  returnSObjects?: SObject[];
}

export interface SetDarkModeResult {
  status: string;
}

export interface TreeGridPref {
  groupField: string;
  parentLookupField: string;
}

export interface TreeGridState {
  calculatedColumns?: AgCalculatedColumn[];
  columnState?: ColumnState[];
  columnStyles?: AgColumnStyle[];
  filterOptions?: FilterOption[];
  rowStyles?: AgRowStyle[];
  showAdvancedFilter?: boolean;
}

export interface SObjectTreeGridPreference {
  Id?: string;
  Name?: string;
  OwnerId?: string;
  AppGridAg__Preferences__c?: string;
  AppGridAg__SObjectApiName__c: string;
  AppGridAg__Group_Field__c: string;
  AppGridAg__Parent_Lookup_Field__c: string;
  LastModifiedById?: Date;
  CreatedById?: Date;
}

export interface SObjectTimeSeriesGridPreference {
  id?: string;
  name: string;
  ownerId?: string;
  sObjectApiName: string;
  transposedColumn: string;
  gridState?: string;
  selectedFilter?: string;
  savedFilters?: string;
  userId: string;
  isSubgridView?: boolean;
  lastModifiedById?: Date;
  createdById?: Date;
}

export interface SObjectTimeSeriesGridPreferenceApiResponse {
  status: string;
  errorMessage: string;
  timeSeriesGridPreferences: SObjectTimeSeriesGridPreference[];
}

export interface SObjectTreeGridPreferenceApiResponse {
  status: string;
  errorMessage: string;
  treeGridPreferences: SObjectTreeGridPreference[];
}

export interface SObjectHoliday {
  id: string;
  name: string;
  activityDate: Date;
  isAllDay: boolean;
  startTimeInMinutes: number;
  endTimeInMinutes: number;
}

export interface SObjectGridPreference {
  id: string;
  name: string;
  ownerId: string;
  sobjectApiName: string;
  lastQueryUsed: string;
  lastViewUsed: string;
  isSubgridView: boolean;
  createdById: string;
  lastModifiedById: string;
}

export interface ObjChart {
  chartName: string;
  chartDef: Record<string, any>;
}

export interface SObjectView {
  calculatedColumns?: string;
  columnState: string;
  columnStyles?: string;
  filterOptions?: string;
  gridState?: string;
  id?: string;
  isSubgridView?: boolean;
  name?: string;
  pivotMode?: boolean;
  ownerId?: string;
  rowStyles?: string;
  showAdvancedFilter?: boolean;
  sObjectApiName: string;
  parentFields?: string; // JSON string of selected parent fields: { [relationshipName]: string[] }
  // Team Sharing fields
  sourceSharedViewId?: string; // Links imported view to its AG_Shared_View__c record
  importedVersion?: number; // Version at time of import
  isShared?: boolean; // True if this view has been shared with others
  syncMode?: 'Sync' | 'Snapshot'; // For imported views: Sync or Snapshot
}

/**
 * Shared view data transfer object for team sharing feature
 */
export interface SharedViewDTO {
  id: string;
  sourceViewId: string;
  sourceViewName: string;
  sharedById: string;
  sharedByName: string;
  sharedWithId: string | null;
  sharedWithName: string | null;
  shareType: 'Individual' | 'All Users';
  version: number;
  sharedDate: string;
  isActive: boolean;
  hasUpdate: boolean;
  importedVersion: number | null;
  importedViewId: string | null;
  // Source view data for import preview
  gridState?: string;
  columnState?: string;
  calculatedColumns?: string;
  columnStyles?: string;
  rowStyles?: string;
  filterOptions?: string;
  pivotMode?: boolean;
  showAdvancedFilter?: boolean;
  parentFields?: string;
  sObjectApiName?: string;
}

/**
 * Shared query data transfer object for team sharing feature
 */
export interface SharedQueryDTO {
  id: string;
  sourceQueryId: string;
  sourceQueryName: string;
  sharedById: string;
  sharedByName: string;
  sharedWithId: string | null;
  sharedWithName: string | null;
  shareType: 'Individual' | 'All Users';
  version: number;
  sharedDate: string;
  isActive: boolean;
  hasUpdate: boolean;
  importedVersion: number | null;
  importedQueryId: string | null;
  // Source query data for import preview
  sObjectApiName?: string;
  queryRule?: string;
  relationQueryRule?: string;
  relationSObjectApiName?: string;
  relationLookupField?: string;
  isQueryActive?: boolean;
  isDefault?: boolean;
  isPublic?: boolean;
}

/**
 * Parameters for sharing a view
 */
export interface ShareViewParams {
  viewId: string;
  userIds: string[];
  shareWithAll: boolean;
}

/**
 * Parameters for unsharing a view
 */
export interface UnshareViewParams {
  viewId: string;
  userIds?: string[];
}

/**
 * Parameters for sharing a query
 */
export interface ShareQueryParams {
  queryId: string;
  userIds: string[];
  shareWithAll: boolean;
}

/**
 * Parameters for unsharing a query
 */
export interface UnshareQueryParams {
  queryId: string;
  userIds?: string[];
}

/**
 * Parameters for getting shared views
 */
export interface GetSharedViewsParams {
  sObjectName: string;
}

/**
 * Parameters for getting shared queries
 */
export interface GetSharedQueriesParams {
  sObjectName: string;
}

/**
 * Parameters for getting view share recipients
 */
export interface GetViewShareRecipientsParams {
  viewId: string;
}

/**
 * Parameters for getting query share recipients
 */
export interface GetQueryShareRecipientsParams {
  queryId: string;
}

/**
 * Parameters for importing a shared view
 */
export interface SharedViewImportParams {
  sharedViewId: string;
  viewName: string;
  syncMode: 'Sync' | 'Snapshot';
}

/**
 * Response payload for importing a shared view.
 */
export interface ImportSharedViewDTO {
  status: 'success' | 'error';
  view?: SObjectView;
  errorMessage?: string;
}

/**
 * Parameters for importing a shared query
 */
export interface SharedQueryImportParams {
  sharedQueryId: string;
  queryName: string;
  syncMode: 'Sync' | 'Snapshot';
}

/**
 * Response payload for importing a shared query.
 */
export interface ImportSharedQueryDTO {
  status: 'success' | 'error';
  query?: SObjectQuery;
  errorMessage?: string;
}

/**
 * Parameters for updating an imported view
 */
export interface UpdateImportedViewParams {
  viewId: string;
}

/**
 * Parameters for updating an imported query
 */
export interface UpdateImportedQueryParams {
  queryId: string;
}

export interface UpsertApiResponse {
  status: string;
  errorMessage: string;
  upsertResult: Map<number, string>;
  recordIds: Map<number, string>;
}

export interface SObjectPermission {
  sObjectType: string;
  permissionsCreate: boolean;
  permissionsDelete: boolean;
  permissionsEdit: boolean;
  permissionsRead: boolean;
  permissionsViewAll: boolean;
  permissionsModifyAll: boolean;
}

export interface SObjectProject {
  Id?: string;
  Name: string;
  OwnerId?: string;
  ProjectType?: string;
  AppGridAg__StartDate__c?: Date;
  AppGridAg__EndDate__c?: Date;
  AppGridAg__Resources__c?: string;
  AppGridAg__Palette_Prefs__c?: string;
  CreatedById?: string;
  LastModifiedById?: string;
  CreatedDate?: Date;
  LastModifiedDate?: Date;
}

export interface SObjectProjectRole {
  Id: string;
  DeveloperName: string;
  AppGridAg__Name__c: string;
  AppGridAg__Active__c: boolean;
}

export interface SObjectProjectStatus {
  Id: string;
  DeveloperName: string;
  AppGridAg__Name__c: string;
  AppGridAg__Active__c: boolean;
}

export interface SObjectProjectTask {
  Id?: string;
  Name: string;
  OwnerId: string;
  AppGridAg__ParentId__c: string | null;
  AppGridAg__StartDate__c: string | null;
  AppGridAg__EndDate__c: string | null;
  AppGridAg__EstimatedHours__c: number | null;
  AppGridAg__Duration__c: number | null;
  AppGridAg__Progress__c: number | null;
  AppGridAg__Predecessor__c: string | null;
  AppGridAg__HasChildRecords__c: boolean;
  AppGridAg__ResourceInfo__c: string | null;
  AppGridAg__AG_Project__c: string;
}

export interface ProjectTaskQueryApiResponse {
  status: string;
  errorMessage: string;
  records: SObjectProjectTask[];
}

export interface SObjectQuery {
  id?: string;
  name: string;
  ownerId?: string;
  sObjectApiName: string;
  queryRule: string;
  relationQueryRule?: string;
  relationSObjectApiName?: string;
  relationRelationshipName?: string;
  isActive?: boolean;
  isDefault?: boolean;
  isPublic?: boolean;
  lastModifiedById?: string;
  createdById?: string;
}

export interface QueryServiceApiResponse {
  status: string;
  errorMessage: string;
  records: Map<string, object>[];
  queryLocator: string;
}

export interface SObjectQueryApiResponse {
  status: string;
  errorMessage: string;
  options: SObjectQuery[];
}

export interface UserInfo {
  defaultCurrencyIsoCode: string;
  email: string;
  language: string;
  locale: string;
  name: string;
  orgId: string;
  orgName: string;
  profileId: string;
  profileName: string;
  roleId: string;
  userId: string;
  userType: string;
  userLocale?: string;
  userCurrency?: string;
}

export interface UserProfile {
  id: string;
  name: string;
}

export interface UserProfileApiResponse {
  status: string;
  errorMessage: string;
  profile: UserProfile;
}
