import {
  SObjectDeleteResult,
  SObjectHoliday,
  SObjectQuery,
  OrgObject,
  SObjectNameApiResponse,
  SObjectRelationPreference,
  SObjectMetadata,
  SObjectPermission,
  UserInfo,
  UserProfile,
  SObjectTreeGridPreference,
  SObjectView,
  SObjectFieldPermission,
  SObjectProjectTask,
  SObjectProjectRole,
  SObjectProjectStatus,
  SObjectTimeSeriesGridPreference,
  SObjectFlow,
  RunFlowApiResult,
  SetDarkModeResult,
  SObjectChart,
  SObjectConfigTemplate,
  SObjectGridTemplate,
  QueryServiceApiResponse,
  SObjectGridPermission,
  SObjectGridPreference,
  BatchUpsertResponse,
  BatchDeleteResponse,
  SharedViewDTO,
  SharedQueryDTO,
  ShareViewParams,
  ShareQueryParams,
  UnshareViewParams,
  UnshareQueryParams,
  GetSharedViewsParams,
  GetSharedQueriesParams,
  GetViewShareRecipientsParams,
  GetQueryShareRecipientsParams,
  SharedViewImportParams,
  SharedQueryImportParams,
  ImportSharedViewDTO,
  ImportSharedQueryDTO,
  UpdateImportedViewParams,
  UpdateImportedQueryParams
} from '../sObjectMetadataTypes';

export interface ChartOptionParams {
  sObjectName: string;
}

export interface CloneConfigParams {
  userId: string;
  userIdsToClone: string[];
}

export interface CloneTemplateParams {
  templateId: string;
  userIdsToClone: string[];
}

export interface CreateTemplateParams {
  userId: string;
  templateName: string;
}

export interface DarkModeParams {
  isDarkMode: boolean;
}

export interface DeleteRecsParams {
  recordIds: string[];
  sObjectName: string;
  batchSize?: number;  // defaults to 1500 in sfdcClient
  batchIndex?: number; // defaults to 0 in sfdcClient
}

export interface DeleteSchedulerRecsParams {
  rowIds: string[];
}

export interface DeleteMetadataParams {
  sObjectName: string;
}

export interface GetCacheKeyParams {
  partitionName: string;
}

export interface GridPermissionParams {
  userId: string;
}

export interface GetSchedulerEventParams {
  startDate: Date;
  endDate: Date;
}

export interface KanbanConfigParams {
  sObjectName: string;
  userId: string;
}

export interface ObjChartParams {
  sObjectName: string;
}

export interface ObjFlowParams {
  sObjectName: string;
}

export interface ObjFieldPermissionParams {
  sObjectName: string;
}

export interface ObjGridPrefsParams {
  sObjectName: string;
  isSubgridView: boolean;
}

export interface ObjMetadataParams {
  sObjectName: string;
}

export interface ObjPermissionsParams {
  sObjectName: string;
}

export interface ObjQueryParams {
  sObjectName: string;
}

export interface ObjViewParams {
  sObjectName: string;
  isSubgridView: boolean;
}

export interface ProjectHolidayParams {
  dummyArg: string;
}

export interface ProjectRoleParams {
  dummyArg: string;
}

export interface ProjectStatusParams {
  dummyArg: string;
}

export interface ProjectTaskQueryParams {
  parentId: string | null;
  projectId: string;
}

export interface TreeGridPrefParams {
  sObjectName: string;
  isSubgridView?: boolean;
}

export interface QueryServiceParams {
  sObjectName: string;
  queryRule: string;
  subQueryRule: string | null;
  subQueryRelation: string | null;
  // Parent field parameters (optional) - JSON string of parent field config
  parentFields?: string | null;
  // Batch query parameters (optional)
  batchSize?: number | null;
  lastRecordId?: string | null;
  orderByField?: string | null;
}

// Batch query response interfaces
export interface BatchMetrics {
  batches: Array<{
    batchNumber: number;
    recordCount: number;
    metrics: any; // Individual batch performance metrics
    roundTripTime?: number; // Time from React call to response received
  }>;
  aggregated: {
    totalRecords: number;
    totalBatches: number;
    totalExecutionTime: number; // Apex-side total execution time
    avgBatchTime: number;
    totalSoqlExecutionTime: number;
    avgSoqlExecutionTime: number;
    totalRoundTripTime: number; // Total network + framework overhead
    avgRoundTripTime: number; // Average per-batch round trip
    totalNetworkOverhead: number; // roundTrip - apexExecution (network + LWC framework)
    avgNetworkOverhead: number; // Average network overhead per batch
  };
}

export interface QueryServiceResponse {
  status: 'success' | 'error';
  records: any[];
  errorMessage?: string;
  queryPerformance?: any;
  // Batch mode metadata
  batchMode?: boolean;
  batchSize?: number;
  orderByField?: string;
  hasMore?: boolean;
  lastRecordId?: string;
}

export interface QueryLocatorParams {
  sObjectName: string;
  queryFields: string;
  whereClause: string;
  orderByClause: string;
  limitClause: string;
  queryLocator: string | null;
  batchSize: number;
}

// Import Time Series Data
export interface ImportTimeSeriesDataParams {
  // Target sObject API name (e.g., 'Account')
  sObjectApiName: string;
  // Preferred: JSON string of rows (safer across Aura/LWC bridge)
  rowsJson?: string;
  // Backward-compat: array of rows (will be stringified by client)
  rows?: Array<Record<string, any>>;
  // When true, validates with DML and rolls back; no data committed
  dryRun?: boolean;
}

export interface ImportTimeSeriesDataResult {
  status: 'success' | 'error';
  insertedCount: number;
  errors: Array<{
    rowIndex: number;
    fieldName?: string | null;
    message: string;
  }>;
}

// Define interfaces for clarity
export interface QueryResponse {
  status: string;
  records?: any[];
  errorMessage?: string;
  errorType?: string;
  stackTrace?: string;
  generatedSoql?: string;
  bindVariables?: string;
  queryPerformance?: Map<string, number> | any; // Can be Map or BatchMetrics
  // Batch mode metadata
  hasMore?: boolean;
  batchMode?: boolean;
  batchSize?: number;
  orderByField?: string;
  lastRecordId?: string;
}

export interface RelationPreferenceParams {
  sObjectName: string;
}

export interface RunFlowParams {
  flowName: string;
  flowParameters: Record<string, any>;
  flowRecordIds: string[];
}

export interface SObjectNameParams {
  recordId: string;
}

export interface UpsertServiceParams {
  sObjectName: string;
  jsonRecs: string;
  batchSize?: number;  // defaults to 1500 in sfdcClient
  batchIndex?: number; // defaults to 0 in sfdcClient
}

export interface UpsertSchedulerEventParams {
  jsonRecs: string;
}

export interface UserInfoParams {
  userId: string;
}

export interface UserProfileParams {
  profileName: string;
}

export interface GetSchedulerEventsApiResponse {
  id: string;
  status: string;
  errors: string[];
}

export interface APIClient {
  cloneAppGridConfig(params: CloneConfigParams): Promise<any>;
  cloneAppGridTemplate(params: CloneTemplateParams): Promise<any>;
  createAppGridTemplate(
    params: CreateTemplateParams
  ): Promise<SObjectGridTemplate[]>;
  deleteRecs(params: DeleteRecsParams): Promise<BatchDeleteResponse>;
  deleteSchedulerEvents(
    params: DeleteSchedulerRecsParams
  ): Promise<SObjectDeleteResult[]>;
  executeDynamicSOQL(params: QueryServiceParams): Promise<QueryResponse>;
  getChartOptions(params: ChartOptionParams): Promise<any>;
  getConfigTemplates(): Promise<SObjectConfigTemplate[]>; // done
  getGridPermissions(): Promise<SObjectGridPermission[]>;
  getGridTemplates(): Promise<SObjectGridTemplate[]>;
  getObjCharts(params: ObjChartParams): Promise<SObjectChart[]>;
  getObjFieldPermissions(
    params: ObjFieldPermissionParams
  ): Promise<SObjectFieldPermission>;
  getObjGridPrefs(params: ObjGridPrefsParams): Promise<SObjectGridPreference[]>;
  getObjFieldPermissions(params: ObjFieldPermissionParams): Promise<any>; // done
  getObjFlows(params: ObjFlowParams): Promise<SObjectFlow[]>;
  getMetadata(params: ObjMetadataParams): Promise<SObjectMetadata>;
  getObjPermissions(): Promise<SObjectPermission[]>; // done
  getObjPreferences(): Promise<SObjectPermission[]>;
  getObjQueries(params: ObjQueryParams): Promise<SObjectQuery[]>;
  getObjTreeGridPreferences(
    params: TreeGridPrefParams
  ): Promise<SObjectTreeGridPreference[]>;
  getObjTimeSeriesGridPreferences(
    params: TreeGridPrefParams
  ): Promise<SObjectTimeSeriesGridPreference[]>;
  getObjViews(params: ObjViewParams): Promise<SObjectView[]>;
  getOrgObjects(): Promise<OrgObject[]>; // done
  getHolidays(params: ProjectHolidayParams): Promise<SObjectHoliday[]>; // done
  getProjectRoles(params: ProjectRoleParams): Promise<SObjectProjectRole[]>;
  getProjectStatuses(
    params: ProjectStatusParams
  ): Promise<SObjectProjectStatus[]>;
  getProjectTasks(
    params: ProjectTaskQueryParams
  ): Promise<SObjectProjectTask[]>;
  getRelationPreferences(
    params: RelationPreferenceParams
  ): Promise<SObjectRelationPreference[]>;
  getSObjectName(params: SObjectNameParams): Promise<SObjectNameApiResponse>;
  getUserInfo(): Promise<UserInfo>;
  getUserProfile(): Promise<UserProfile>;
  getAllProfiles(): Promise<any>;
  getUsersWithProfile(params: UserProfileParams): Promise<any>;
  importTimeSeriesData(
    params: ImportTimeSeriesDataParams
  ): Promise<ImportTimeSeriesDataResult>;
  queryRecordsWithLocator(
    params: QueryLocatorParams
  ): Promise<QueryServiceApiResponse>;

  runFlow(params: RunFlowParams): Promise<RunFlowApiResult>;

  setDarkMode(params: DarkModeParams): Promise<SetDarkModeResult>;
  upsertRecs(params: UpsertServiceParams): Promise<BatchUpsertResponse>;
  upsertSchedulerEvents(
    params: UpsertSchedulerEventParams
  ): Promise<GetSchedulerEventsApiResponse[]>;

  // -------------------------
  // Slack Integration Methods
  // -------------------------
  // Authentication & Testing
  slackAuthTest(): Promise<any>;
  slackGetConfigStatus(): Promise<any>;

  // Channels / Conversations
  slackListConversations(params: Record<string, any>): Promise<any>;
  slackGetConversationInfo(params: Record<string, any>): Promise<any>;
  slackJoinConversation(params: Record<string, any>): Promise<any>;
  slackOpenConversation(params: Record<string, any>): Promise<any>;
  slackCreateChannel(params: Record<string, any>): Promise<any>;
  slackInviteToChannel(params: Record<string, any>): Promise<any>;
  slackListConversationMembers(params: Record<string, any>): Promise<any>;
  slackLeaveChannel(params: Record<string, any>): Promise<any>;
  slackArchiveChannel(params: Record<string, any>): Promise<any>;
  slackConvertToPrivate(params: Record<string, any>): Promise<any>;

  // Messages
  slackGetConversationHistory(params: Record<string, any>): Promise<any>;
  slackPostMessage(params: Record<string, any>): Promise<any>;
  slackPostBlockMessage(params: Record<string, any>): Promise<any>;
  slackUpdateMessage(params: Record<string, any>): Promise<any>;
  slackDeleteMessage(params: Record<string, any>): Promise<any>;
  slackPostThreadReply(params: Record<string, any>): Promise<any>;
  slackGetThreadReplies(params: Record<string, any>): Promise<any>;

  // Users
  slackListUsers(): Promise<any>;
  slackGetUserProfile(params: Record<string, any>): Promise<any>;

  // Presence
  slackGetUserPresence(params: Record<string, any>): Promise<any>;
  slackSetUserPresence(params: Record<string, any>): Promise<any>;
  slackLookupUserByEmail(params: Record<string, any>): Promise<any>;

  // Reactions
  slackAddReaction(params: Record<string, any>): Promise<any>;
  slackRemoveReaction(params: Record<string, any>): Promise<any>;
  slackGetReactions(params: Record<string, any>): Promise<any>;

  // Search
  slackSearchMessages(params: Record<string, any>): Promise<any>;

  // Pins
  slackPinMessage(params: Record<string, any>): Promise<any>;
  slackUnpinMessage(params: Record<string, any>): Promise<any>;
  slackListPins(params: Record<string, any>): Promise<any>;

  // Bookmarks
  slackListBookmarks(params: Record<string, any>): Promise<any>;
  slackAddBookmark(params: Record<string, any>): Promise<any>;
  slackRemoveBookmark(params: Record<string, any>): Promise<any>;

  // Files
  slackUploadFileUsingConfig(params: Record<string, any>): Promise<any>;

  // Channel Links
  slackGetLinkedChannelIds(recordId: string): Promise<string[]>;
  slackGetChannelLinks(params: Record<string, any>): Promise<any>;

  slackCreateChannelLink(params: {
    recordId: string;
    objectType: string;
    recordName: string;
    channelId: string;
    channelName: string;
    isPrimary: boolean;
    linkType: string;
  }): Promise<any>;

  slackDeleteChannelLink(params: {
    recordId: string;
    channelId: string;
  }): Promise<any>;

  // User OAuth
  slackGetAuthorizationUrl(): Promise<any>;
  slackGetUserToken(): Promise<any>;
  slackRevokeUserToken(): Promise<any>;

  // -------------------------
  // View Sharing Methods
  // -------------------------
  /** Get views shared with the current user for a specific object */
  getSharedViews(params: GetSharedViewsParams): Promise<SharedViewDTO[]>;

  /** Get queries shared with the current user for a specific object */
  getSharedQueries(params: GetSharedQueriesParams): Promise<SharedQueryDTO[]>;

  /** Share a view with specified users or all users */
  shareView(params: ShareViewParams): Promise<boolean>;

  /** Share a query with specified users or all users */
  shareQuery(params: ShareQueryParams): Promise<boolean>;

  /** Remove sharing from specified users */
  unshareView(params: UnshareViewParams): Promise<boolean>;

  /** Remove sharing from specified users */
  unshareQuery(params: UnshareQueryParams): Promise<boolean>;

  /** Get list of users a view is shared with */
  getViewShareRecipients(params: GetViewShareRecipientsParams): Promise<SharedViewDTO[]>;

  /** Get list of users a query is shared with */
  getQueryShareRecipients(params: GetQueryShareRecipientsParams): Promise<SharedQueryDTO[]>;

  /** Import a shared view */
  importSharedView(params: SharedViewImportParams): Promise<ImportSharedViewDTO>;

  /** Import a shared query */
  importSharedQuery(params: SharedQueryImportParams): Promise<ImportSharedQueryDTO>;

  /** Update an imported view with latest changes from source */
  updateImportedView(params: UpdateImportedViewParams): Promise<SObjectView>;

  /** Update an imported query with latest changes from source */
  updateImportedQuery(params: UpdateImportedQueryParams): Promise<SObjectQuery>;

  /** Increment share version when source view is saved */
  incrementShareVersion(params: { viewId: string }): Promise<boolean>;

  /** Increment share version when source query is saved */
  incrementShareQueryVersion(params: { queryId: string }): Promise<boolean>;

  /** Get active users (for share dialog) */
  getActiveUsers(params: Record<string, unknown>): Promise<any>;
}
