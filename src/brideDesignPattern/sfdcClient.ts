// Zustand

// TypeScript declaration to inform the compiler about the custom function on the window object.
declare global {
  interface Window {
    handleRequestFromReact: (methodName: string, params?: any) => Promise<any>;
  }
}

import {
  APIClient,
  DarkModeParams,
  DeleteMetadataParams,
  DeleteRecsParams,
  GetCacheKeyParams,
  GetSchedulerEventsApiResponse,
  ImportTimeSeriesDataParams,
  ImportTimeSeriesDataResult,
  ObjChartParams,
  ObjFieldPermissionParams,
  ObjFlowParams,
  ObjGridPrefsParams,
  ObjMetadataParams,
  ObjQueryParams,
  ObjViewParams,
  ProjectHolidayParams,
  ProjectRoleParams,
  ProjectStatusParams,
  ProjectTaskQueryParams,
  QueryLocatorParams,
  QueryResponse,
  QueryServiceParams,
  RelationPreferenceParams,
  RunFlowParams,
  SObjectNameParams,
  TreeGridPrefParams,
  UpsertSchedulerEventParams,
  UpsertServiceParams,
  UserProfileParams
} from './apiInterface';

import {
  OrgObject,
  SObjectDeleteResult,
  SObjectFlow,
  SObjectMetadata,
  SObjectNameApiResponse,
  SObjectPermission,
  SObjectProjectTask,
  SObjectQuery,
  SObjectRelationPreference,
  SObjectView,
  UserInfo,
  UserProfile,
  SObjectTreeGridPreference,
  SObjectUpsertResult,
  SObjectFieldPermission,
  SObjectTimeSeriesGridPreference,
  RunFlowApiResult,
  SObjectChart,
  SObjectConfigTemplate,
  QueryServiceApiResponse,
  SObjectGridTemplate,
  SObjectProjectRole,
  SObjectProjectStatus,
  SObjectHoliday,
  SObjectGridPermission,
  SObjectGridPreference,
  SetDarkModeResult,
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

import { ChartOptionParams } from './apiInterface';

import { prettyPrint } from '../utilities/prettyPrint';

// Default timeout for API calls (30 seconds)
const DEFAULT_API_TIMEOUT_MS = 30000;

// Methods that may legitimately take longer (batch operations, large queries, cold starts)
const EXTENDED_TIMEOUT_METHODS = new Set([
  'executeDynamicSOQL',
  'upsertRecs',
  'deleteRecs',
  'importTimeSeriesData',
  'queryRecordsWithLocator',
  // View/Query/Preference methods that may be slow with large datasets
  'getObjViews',
  'getObjQueries',
  'getObjGridPrefs',
  'getObjTimeSeriesGridPreferences',
  'getObjTreeGridPreferences',
  'getMetadata',
  // Methods that can be slow during Salesforce cold starts
  'getRelationPreferences',
  'getObjFieldPermissions',
  'getObjFlows',
  'getObjCharts',
  'getInitialData',
  'slackGetConfigStatus'
]);

// Extended timeout for batch/query operations (2 minutes)
const EXTENDED_API_TIMEOUT_MS = 120000;

const LWC_REQUEST_TYPE = 'appgrid:apex:request';
const LWC_RESPONSE_TYPE = 'appgrid:apex:response';




export class ApiTimeoutError extends Error {
  public methodName: string;
  public timeoutMs: number;

  constructor(methodName: string, timeoutMs: number) {
    super(`API call '${methodName}' timed out after ${timeoutMs / 1000} seconds. The Salesforce server may be experiencing high load.`);
    this.name = 'ApiTimeoutError';
    this.methodName = methodName;
    this.timeoutMs = timeoutMs;
  }
}

export class SfdcClient implements APIClient {
  constructor() {}

  private pendingApex = new Map<
  string,
  {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();

private lwcListenerBound = false;

private ensureLwcListener() {
  if (this.lwcListenerBound) return;

  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data;
    if (!data || data.type !== LWC_RESPONSE_TYPE || !data.requestId) return;

    const pending = this.pendingApex.get(data.requestId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pendingApex.delete(data.requestId);

    if (data.ok) pending.resolve(data.result);
    else pending.reject(new Error(data.error || 'Unknown Apex bridge error'));
  });

  this.lwcListenerBound = true;
}

private async callApex(methodName: string, params?: any): Promise<any> {
  this.ensureLwcListener();

  const timeoutMs = EXTENDED_TIMEOUT_METHODS.has(methodName)
    ? EXTENDED_API_TIMEOUT_MS
    : DEFAULT_API_TIMEOUT_MS;

  const requestId =
    (globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(16).slice(2)}`);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      this.pendingApex.delete(requestId);
      reject(new ApiTimeoutError(methodName, timeoutMs));
    }, timeoutMs);

    this.pendingApex.set(requestId, { resolve, reject, timer });

    window.parent.postMessage(
      {
        type: LWC_REQUEST_TYPE,
        requestId,
        methodName,
        params
      },
      '*' // optionally replace with exact Salesforce origin
    );
  }).catch((error) => {
    if (error instanceof ApiTimeoutError) {
      prettyPrint(
        '[sfdcClient] API timeout',
        { methodName, timeoutMs, params: params ? Object.keys(params) : 'none' },
        'red'
      );
    }
    throw error;
  });
}




  /**
   * A private helper to centralize all calls to the Aura component's Apex bridge.
   * This ensures consistency in error handling and parameter passing.
   * @param methodName The name of the Apex method to call (e.g., 'getMetadata').
   * @param params An object containing the parameters for the Apex method.
   */
  // private async callApex(methodName: string, params?: any): Promise<any> {
  //   // The Aura helper now guarantees `handleRequestFromReact` is available on the window
  //   // object before the React application is mounted.
  //   if (typeof window.handleRequestFromReact !== 'function') {
  //     const errorMsg = 'Aura communication channel is not available.';
  //     prettyPrint('[sfdcClient] callApex error', { methodName, errorMsg }, 'red');
  //     return Promise.reject(new Error(errorMsg));
  //   }

  //   // Determine timeout based on method type
  //   const timeoutMs = EXTENDED_TIMEOUT_METHODS.has(methodName)
  //     ? EXTENDED_API_TIMEOUT_MS
  //     : DEFAULT_API_TIMEOUT_MS;

  //   // Track timeout ID for cleanup
  //   let timeoutId: ReturnType<typeof setTimeout> | null = null;

  //   // Create a timeout promise that rejects after the specified duration
  //   const timeoutPromise = new Promise<never>((_, reject) => {
  //     timeoutId = setTimeout(() => {
  //       reject(new ApiTimeoutError(methodName, timeoutMs));
  //     }, timeoutMs);
  //   });

  //   // Race the actual API call against the timeout
  //   try {
  //     const result = await Promise.race([
  //       window.handleRequestFromReact(methodName, params),
  //       timeoutPromise
  //     ]);
  //     // Clear timeout on success
  //     if (timeoutId) clearTimeout(timeoutId);
  //     return result;
  //   } catch (error) {
  //     // Clear timeout on error (may have already fired, but safe to call)
  //     if (timeoutId) clearTimeout(timeoutId);
  //     if (error instanceof ApiTimeoutError) {
  //       prettyPrint('[sfdcClient] API timeout', {
  //         methodName,
  //         timeoutMs,
  //         params: params ? Object.keys(params) : 'none'
  //       }, 'red');
  //     }
  //     throw error;
  //   }
  // }

  async getInitialData(): Promise<any> {
    return await this.callApex('getInitialData');
  }

  async cloneAppGridConfig(params: {
    userId: string;
    userIdsToClone: string[];
  }): Promise<any> {
    return await this.callApex('cloneAppGridConfig', params);
  }

  async cloneAppGridTemplate(params: {
    templateId: string;
    userIdsToClone: string[];
  }): Promise<any> {
    return await this.callApex('cloneAppGridTemplate', params);
  }

  async createAppGridTemplate(params: {
    userId: string;
    templateName: string;
  }): Promise<SObjectGridTemplate[]> {
    return await this.callApex('createAppGridTemplate', params);
  }

  /**
   * Delete records with automatic batching support.
   * Handles batching automatically when record count exceeds batchSize.
   * @param params Delete parameters including recordIds and sObjectName
   * @returns Aggregated BatchDeleteResponse with all results
   */
  async deleteRecs(params: DeleteRecsParams): Promise<BatchDeleteResponse> {
    const DEFAULT_BATCH_SIZE = 1500;
    const batchSize = params.batchSize ?? DEFAULT_BATCH_SIZE;

    // If caller specified a batchIndex, they're handling batching themselves
    if (params.batchIndex !== undefined) {
      return await this.callApex('deleteRecs', { ...params, batchSize });
    }

    // Automatic batching: process all records in batches
    const allResults: SObjectDeleteResult[] = [];
    let batchIndex = 0;
    let hasMore = true;
    let totalProcessed = 0;

    while (hasMore) {
      const batchParams = {
        ...params,
        batchSize,
        batchIndex
      };

      const response: BatchDeleteResponse = await this.callApex(
        'deleteRecs',
        batchParams
      );

      if (response.status === 'error') {
        // Return error response immediately
        return {
          ...response,
          results: [...allResults, ...(response.results || [])],
          totalCount: params.recordIds.length,
          processedCount: totalProcessed + (response.processedCount || 0)
        };
      }

      allResults.push(...(response.results || []));
      totalProcessed += response.processedCount || 0;
      hasMore = response.hasMore === true;
      batchIndex = response.nextBatchIndex ?? batchIndex + batchSize;
    }

    return {
      status: 'success',
      results: allResults,
      batchMode: true,
      batchSize,
      processedCount: totalProcessed,
      totalCount: params.recordIds.length,
      hasMore: false
    };
  }

  async deleteSchedulerEvents(params: {
    rowIds: string[];
    sObjectName: string;
  }): Promise<SObjectDeleteResult[]> {
    return await this.callApex('deleteSchedulerEvents', params);
  }

  async deleteSObjectMetadata(params: DeleteMetadataParams) {
    return await this.callApex('deleteSObjectMetadata', params);
  }

  async getAllProfiles() {
    return await this.callApex('getAllProfiles');
  }

  async getCacheKeys(params: GetCacheKeyParams) {
    return await this.callApex('getCacheKeys', params);
  }

  async getChartOptions(params: ChartOptionParams): Promise<any> {
    return await this.callApex('getChartOptions', params);
  }

  async getConfigTemplates(): Promise<SObjectConfigTemplate[]> {
    return await this.callApex('getConfigTemplates');
  }

  async getGridPermissions(): Promise<SObjectGridPermission[]> {
    return await this.callApex('getGridPermissions');
  }

  async getGridTemplates(): Promise<SObjectGridTemplate[]> {
    return await this.callApex('getGridTemplates');
  }

  async getObjCharts(params: ObjChartParams): Promise<SObjectChart[]> {
    return await this.callApex('getObjCharts', params);
  }

  async getObjFieldPermissions(
    params: ObjFieldPermissionParams
  ): Promise<SObjectFieldPermission> {
    return await this.callApex('getObjFieldPermissions', params);
  }

  async getObjFlows(params: ObjFlowParams): Promise<SObjectFlow[]> {
    return await this.callApex('getObjFlows', params);
  }

  async getObjGridPrefs(
    params: ObjGridPrefsParams
  ): Promise<SObjectGridPreference[]> {
    return await this.callApex('getObjGridPrefs', params);
  }

  async getMetadata(params: ObjMetadataParams): Promise<SObjectMetadata> {
    return this.callApex('getMetadata', params);
  }

  async getObjPermissions(): Promise<SObjectPermission[]> {
    // This method requires no parameters, so we just pass the method name.
    return await this.callApex('getObjPermissions');
  }

  async getObjPreferences(): Promise<SObjectPermission[]> {
    // This method requires no parameters, so we just pass the method name.
    return await this.callApex('getObjPreferences');
  }

  async getObjQueries(params: ObjQueryParams): Promise<SObjectQuery[]> {
    return this.callApex('getObjQueries', params);
  }

  async getObjTimeSeriesGridPreferences(
    params: TreeGridPrefParams
  ): Promise<SObjectTimeSeriesGridPreference[] | never> {
    return this.callApex('getObjTimeSeriesGridPreferences', params);
  }

  async getObjTreeGridPreferences(
    params: TreeGridPrefParams
  ): Promise<SObjectTreeGridPreference[] | never> {
    return this.callApex('getObjTreeGridPreferences', params);
  }

  async getObjViews(params: ObjViewParams): Promise<SObjectView[]> {
    return await this.callApex('getObjViews', params);
  }

  async getOrgObjects(): Promise<OrgObject[]> {
    return await this.callApex('getOrgObjects');
  }

  async getRelationPreferences(
    params: RelationPreferenceParams
  ): Promise<SObjectRelationPreference[]> {
    return this.callApex('getRelationPreferences', params);
  }

  async getSObjectName(
    params: SObjectNameParams
  ): Promise<SObjectNameApiResponse> {
    return this.callApex('getSObjectName', params);
  }

  async getUserInfo(): Promise<UserInfo> {
    return this.callApex('getUserInfo');
  }

  async getUserProfile(): Promise<UserProfile> {
    return this.callApex('getUserProfile');
  }

  async getUsersWithProfile(params: UserProfileParams) {
    return this.callApex('getUsersWithProfile', params);
  }

  async getHolidays(params: ProjectHolidayParams): Promise<SObjectHoliday[]> {
    return this.callApex('getHolidays', params);
  }

  async getProjectRoles(
    params: ProjectRoleParams
  ): Promise<SObjectProjectRole[]> {
    return this.callApex('getProjectRoles', params);
  }

  async getProjectStatuses(
    params: ProjectStatusParams
  ): Promise<SObjectProjectStatus[]> {
    return this.callApex('getProjectStatuses', params);
  }

  async getProjectTasks(
    params: ProjectTaskQueryParams
  ): Promise<SObjectProjectTask[]> {
    return this.callApex('getProjectTasks', params);
  }

  async queryRecordsWithLocator(
    params: QueryLocatorParams
  ): Promise<QueryServiceApiResponse> {
    return await this.callApex('queryRecordsWithLocator', params);
  }

  async executeDynamicSOQL(params: QueryServiceParams): Promise<QueryResponse> {
    const res = await this.callApex('executeDynamicSOQL', params);

    // LWC automatically stringifies Map<String, Object> return values
    // So we need to parse it back to an object
    if (typeof res === 'string') {
      return JSON.parse(res) as QueryResponse;
    }

    return res as QueryResponse;
  }

  async importTimeSeriesData(
    params: ImportTimeSeriesDataParams
  ): Promise<ImportTimeSeriesDataResult> {
    const payload: any = {
      sObjectApiName: params.sObjectApiName,
      rowsJson: params.rowsJson ?? JSON.stringify(params.rows || []),
      dryRun: params.dryRun === true
    };
    return await this.callApex('importTimeSeriesData', payload);
  }

  async runFlow(params: RunFlowParams): Promise<RunFlowApiResult> {
    return await this.callApex('runFlow', params);
  }

  async setDarkMode(params: DarkModeParams): Promise<SetDarkModeResult> {
    return await this.callApex('setDarkMode', params);
  }

  /**
   * Upsert records with automatic batching support.
   * Handles batching automatically when record count exceeds batchSize.
   * @param params Upsert parameters including sObjectName and jsonRecs
   * @returns Aggregated BatchUpsertResponse with all results
   */
  async upsertRecs(params: UpsertServiceParams): Promise<BatchUpsertResponse> {
    const DEFAULT_BATCH_SIZE = 1500;
    const batchSize = params.batchSize ?? DEFAULT_BATCH_SIZE;

    // Parse jsonRecs to get total count
    let records: any[];
    try {
      records = JSON.parse(params.jsonRecs);
    } catch {
      return {
        status: 'error',
        results: [],
        batchMode: false,
        processedCount: 0,
        totalCount: 0,
        hasMore: false,
        errorMessage: 'Invalid JSON in jsonRecs parameter'
      };
    }

    const totalCount = records.length;

    // If caller specified a batchIndex, they're handling batching themselves
    if (params.batchIndex !== undefined) {
      return await this.callApex('upsertRecs', { ...params, batchSize });
    }

    // Automatic batching: process all records in batches
    const allResults: SObjectUpsertResult[] = [];
    let batchIndex = 0;
    let hasMore = true;
    let totalProcessed = 0;

    while (hasMore) {
      const batchParams = {
        ...params,
        batchSize,
        batchIndex
      };

      const rawResponse: BatchUpsertResponse | any[] = await this.callApex(
        'upsertRecs',
        batchParams
      );
      const response: BatchUpsertResponse = Array.isArray(rawResponse)
        ? {
            status: 'success',
            results: rawResponse,
            batchMode: true,
            batchSize,
            processedCount: rawResponse.length,
            totalCount,
            hasMore: false
          }
        : rawResponse;

      if (response.status === 'error') {
        // Return error response immediately
        return {
          ...response,
          results: [...allResults, ...(response.results || [])],
          totalCount,
          processedCount: totalProcessed + (response.processedCount || 0)
        };
      }

      allResults.push(...(response.results || []));
      totalProcessed += response.processedCount || 0;
      hasMore = response.hasMore === true;
      batchIndex = response.nextBatchIndex ?? batchIndex + batchSize;
    }

    return {
      status: 'success',
      results: allResults,
      batchMode: true,
      batchSize,
      processedCount: totalProcessed,
      totalCount,
      hasMore: false
    };
  }

  async upsertSchedulerEvents(
    params: UpsertSchedulerEventParams
  ): Promise<GetSchedulerEventsApiResponse[]> {
    return await this.callApex('upsertSchedulerEvents', params);
  }

  // -------------------------
  // Slack Integration Methods
  // -------------------------
  async slackAuthTest(): Promise<any> {
    return await this.callApex('slackAuthTest');
  }

  async slackGetConfigStatus(): Promise<any> {
    return await this.callApex('slackGetConfigStatus');
  }

  async slackListConversations(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackListConversations', params);
  }

  async slackGetConversationInfo(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackGetConversationInfo', params);
  }

  async slackGetConversationHistory(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackGetConversationHistory', params);
  }

  async slackPostMessage(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackPostMessage', params);
  }

  async slackListUsers(): Promise<any> {
    return await this.callApex('slackListUsers');
  }

  async slackJoinConversation(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackJoinConversation', params);
  }

  async slackOpenConversation(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackOpenConversation', params);
  }

  async slackCreateChannel(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackCreateChannel', params);
  }

  async slackInviteToChannel(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackInviteToChannel', params);
  }

  async slackListConversationMembers(
    params: Record<string, any>
  ): Promise<any> {
    return await this.callApex('slackListConversationMembers', params);
  }

  async slackLeaveChannel(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackLeaveChannel', params);
  }

  async slackArchiveChannel(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackArchiveChannel', params);
  }

  async slackConvertToPrivate(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackConvertToPrivate', params);
  }

  async slackPostBlockMessage(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackPostBlockMessage', params);
  }

  async slackUpdateMessage(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackUpdateMessage', params);
  }

  async slackDeleteMessage(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackDeleteMessage', params);
  }

  async slackPostThreadReply(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackPostThreadReply', params);
  }

  async slackGetThreadReplies(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackGetThreadReplies', params);
  }

  async slackGetUserProfile(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackGetUserProfile', params);
  }

  async slackGetUserPresence(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackGetUserPresence', params);
  }

  async slackSetUserPresence(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackSetUserPresence', params);
  }

  async slackLookupUserByEmail(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackLookupUserByEmail', params);
  }

  async slackAddReaction(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackAddReaction', params);
  }

  async slackRemoveReaction(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackRemoveReaction', params);
  }

  async slackGetReactions(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackGetReactions', params);
  }

  async slackSearchMessages(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackSearchMessages', params);
  }

  async slackPinMessage(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackPinMessage', params);
  }

  async slackUnpinMessage(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackUnpinMessage', params);
  }

  async slackListPins(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackListPins', params);
  }

  // ========== Slack User OAuth Methods ==========

  /**
   * Get the Slack OAuth authorization URL
   * User clicks this to connect their personal Slack account
   */
  async slackGetAuthorizationUrl(): Promise<any> {
    return await this.callApex('slackGetAuthorizationUrl');
  }

  /**
   * Get the stored user token for the current user
   */
  async slackGetUserToken(): Promise<any> {
    return await this.callApex('slackGetUserToken');
  }

  /**
   * Revoke/disconnect the user's Slack token
   */
  async slackRevokeUserToken(): Promise<any> {
    return await this.callApex('slackRevokeUserToken');
  }

  async slackListBookmarks(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackListBookmarks', params);
  }

  async slackAddBookmark(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackAddBookmark', params);
  }

  async slackRemoveBookmark(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackRemoveBookmark', params);
  }

  async slackUploadFile(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackUploadFile', params);
  }

  async slackUploadFileUsingConfig(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackUploadFileUsingConfig', params);
  }

  async slackGetLinkedChannelIds(recordId: string): Promise<string[]> {
    return await this.callApex('slackGetLinkedChannelIds', recordId);
  }

  async slackGetChannelLinks(params: Record<string, any>): Promise<any> {
    return await this.callApex('slackGetChannelLinks', params);
  }

  async slackCreateChannelLink(params: {
    recordId: string;
    objectType: string;
    recordName: string;
    channelId: string;
    channelName: string;
    isPrimary: boolean;
    linkType: string;
  }): Promise<any> {
    // Log the params before sending (need to extract from proxy)
    const paramsObj = {
      recordId: params.recordId,
      objectType: params.objectType,
      recordName: params.recordName,
      channelId: params.channelId,
      channelName: params.channelName,
      isPrimary: params.isPrimary,
      linkType: params.linkType
    };
    console.log(
      '[sfdcClient] slackCreateChannelLink called with params:',
      JSON.stringify(paramsObj, null, 2)
    );
    return await this.callApex('slackCreateChannelLink', params);
  }

  async slackDeleteChannelLink(params: {
    recordId: string;
    channelId: string;
  }): Promise<any> {
    const paramsObj = {
      recordId: params.recordId,
      channelId: params.channelId
    };
    console.log(
      '[sfdcClient] slackDeleteChannelLink called with params:',
      JSON.stringify(paramsObj, null, 2)
    );
    return await this.callApex('slackDeleteChannelLink', params);
  }

  // -------------------------
  // View Sharing Methods
  // -------------------------

  async getSharedViews(params: GetSharedViewsParams): Promise<SharedViewDTO[]> {
    return await this.callApex('getSharedViews', params);
  }

  async getSharedQueries(
    params: GetSharedQueriesParams
  ): Promise<SharedQueryDTO[]> {
    return await this.callApex('getSharedQueries', params);
  }

  async shareView(params: ShareViewParams): Promise<boolean> {
    return await this.callApex('shareView', params);
  }

  async shareQuery(params: ShareQueryParams): Promise<boolean> {
    return await this.callApex('shareQuery', params);
  }

  async unshareView(params: UnshareViewParams): Promise<boolean> {
    return await this.callApex('unshareView', params);
  }

  async unshareQuery(params: UnshareQueryParams): Promise<boolean> {
    return await this.callApex('unshareQuery', params);
  }

  async getViewShareRecipients(
    params: GetViewShareRecipientsParams
  ): Promise<SharedViewDTO[]> {
    return await this.callApex('getViewShareRecipients', params);
  }

  async getQueryShareRecipients(
    params: GetQueryShareRecipientsParams
  ): Promise<SharedQueryDTO[]> {
    return await this.callApex('getQueryShareRecipients', params);
  }

  async importSharedView(
    params: SharedViewImportParams
  ): Promise<ImportSharedViewDTO> {
    return await this.callApex('importSharedView', params);
  }

  async importSharedQuery(
    params: SharedQueryImportParams
  ): Promise<ImportSharedQueryDTO> {
    return await this.callApex('importSharedQuery', params);
  }

  async updateImportedView(
    params: UpdateImportedViewParams
  ): Promise<SObjectView> {
    return await this.callApex('updateImportedView', params);
  }

  async updateImportedQuery(
    params: UpdateImportedQueryParams
  ): Promise<SObjectQuery> {
    return await this.callApex('updateImportedQuery', params);
  }

  async incrementShareVersion(params: { viewId: string }): Promise<boolean> {
    return await this.callApex('incrementShareVersion', params);
  }

  async incrementShareQueryVersion(params: {
    queryId: string;
  }): Promise<boolean> {
    return await this.callApex('incrementShareQueryVersion', params);
  }

  async getActiveUsers(params: Record<string, unknown>): Promise<any> {
    return await this.callApex('getActiveUsers', params);
  }
}
