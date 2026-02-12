import {
  APIClient,
  ChartOptionParams,
  CloneConfigParams,
  CloneTemplateParams,
  DeleteRecordsServiceParams,
  ObjFieldPermissionParams,
  ObjFlowParams,
  ObjMetadataParams,
  ObjQueryParams,
  ObjViewParams,
  ProjectHolidayParams,
  RelationPreferenceParams,
  RunFlowParams,
  QueryServiceParams,
  UpsertServiceParams,
  UserProfileParams,
  SObjectNameParams,
  ObjGridPrefsParams,
  CreateTemplateParams,
  ObjChartParams,
  TreeGridPrefParams,
  ProjectTaskQueryParams,
  ProjectRoleParams,
  ProjectStatusParams,
  QueryLocatorParams,
  GetEventParams,
  UpsertSchedulerEventParams,
  GetSchedulerEventsApiResponse
} from './apiInterface';

// axios
import axios from 'axios';

// Base URL for the Node.js server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// HTML Encode/Decode
import { decode } from 'he';

// sObjectMetadataType
import {
  GridPermission,
  OrgObject,
  ObjPreferenceSObject,
  SObjectDeleteResult,
  SObjectRelationPreference,
  UserInfo,
  UserProfile,
  SObjectPermission,
  SObjectNameApiResponse,
  SObjectTreeGridPreference,
  SObjectFieldPermission,
  SObjectTimeSeriesGridPreference,
  SObjectUpsertResult,
  SObjectConfigTemplate,
  SObjectGridTemplate,
  SObjectProjectTask,
  ProjectTaskQueryApiResponse,
  SObjectProjectRole,
  SObjectProjectStatus,
  SObjectHoliday,
  SObjectQueryLocatorApiResponse,
  QueryServiceApiResponse
} from '../sObjectMetadataTypes';
import {
  SchedulerEventWrapper,
  SObjectEvent,
  SObjectSchedulerEvent
} from '../components/scheduler/scheduler';

export class SQLClient implements APIClient {
  async cloneAppGridConfig({ userId, userIdsToClone }: CloneConfigParams) {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'cloneAppGridConfig',
        userId: userId,
        userIdsToClone: userIdsToClone
      };

      const response = await axios.post(`${API_BASE_URL}/api/apex`, params);

      const apiResult = response.data;

      return apiResult;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async cloneAppGridTemplate({
    templateId,
    userIdsToClone
  }: CloneTemplateParams) {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'cloneAppGridTemplate',
        templateId: templateId,
        userIdsToClone: userIdsToClone
      };

      const response = await axios.post(
        'http://localhost:3000/api/cloneAppGridTemplate',
        params
      );

      const apiResult = response.data;

      return apiResult;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async createAppGridTemplate({ userId, templateName }: CreateTemplateParams) {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'createAppGridTemplate',
        userId: userId,
        templateName: templateName
      };

      const response = await axios.post(
        'http://localhost:3000/api/createAppGridTemplate',
        params
      );

      const apiResult = response.data;

      return apiResult;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async deleteRecordsService({
    rowIds,
    sObjectApiName
  }: DeleteRecordsServiceParams): Promise<SObjectDeleteResult[]> {
    try {
      const params = {
        sObjectApiName: sObjectApiName,
        recordIds: rowIds
      };

      const response = await axios.post(
        'http://localhost:3000/api/deleteRecs',
        params
      );

      const apiResult = response.data;

      return apiResult;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async deleteSchedulerEvents({
    rowIds,
    sObjectApiName
  }: DeleteRecordsServiceParams): Promise<SObjectDeleteResult[]> {
    try {
      const params = {
        sObjectApiName: sObjectApiName,
        recordIds: rowIds
      };

      const response = await axios.post(
        'http://localhost:3000/api/deleteSchedulerEvents',
        params
      );

      const apiResult = response.data;

      return apiResult;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getAllProfiles() {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'getAllProfiles',
        dummyArg: ''
      };

      const response = await axios.post(
        'http://localhost:3000/api/getAllProfiles',
        params
      );

      const apiResult = response.data;

      if (apiResult.status !== 'success') {
        throw new Error(apiResult.errorMessage);
      }

      return apiResult.profiles;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getChartOptions({ sObjectApiName }: ChartOptionParams) {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'getChartOptions',
        sObjectApiName: sObjectApiName
      };

      const response = await axios.post(
        'http://localhost:3000/api/getChartOptions',
        params
      );

      const apiResult = response.data;

      if (apiResult.status !== 'success') {
        throw new Error(apiResult.errorMessage);
      }

      return apiResult.options;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getConfigTemplates(): Promise<SObjectConfigTemplate[]> {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'getConfigTemplates'
      };

      const response = await axios.post(
        'http://localhost:3000/api/getConfigTemplates',
        params
      );

      const apiResponse = response.data;

      if (apiResponse.status !== 'success') {
        throw new Error(apiResponse.errorMessage);
      }

      return apiResponse.templates;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getGridPermissions(): Promise<GridPermission[]> {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'getGridPermissions'
      };

      const response = await axios.post(
        'http://localhost:3000/api/getGridPermissions',
        params
      );

      const apiResponse = response.data;

      if (apiResponse.status !== 'success') {
        throw new Error(apiResponse.errorMessage);
      }

      if (apiResponse.permissions.length > 1) {
        throw new Error(
          'getGridPermissions - more than 1 grid permissions record found'
        );
      }

      return apiResponse.permissions;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getGridTemplates(): Promise<SObjectGridTemplate[]> {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'getGridTemplates'
      };

      const response = await axios.post(
        'http://localhost:3000/api/getGridTemplates',
        params
      );

      const apiResponse = response.data;

      if (apiResponse.status !== 'success') {
        throw new Error(apiResponse.errorMessage);
      }

      return apiResponse.templates;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getObjCharts({ sObjectApiName }: ObjChartParams) {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'getObjCharts',
        sObjectApiName: sObjectApiName
      };

      const response = await axios.post(
        'http://localhost:3000/api/getObjCharts',
        params
      );

      const apiResponse = response.data;

      if (apiResponse.status !== 'success') {
        throw new Error(`getObjCharts - ${apiResponse.errorMessage}`);
      }

      return apiResponse.charts;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getObjFieldPermissions({
    sObjectApiName
  }: ObjFieldPermissionParams): Promise<SObjectFieldPermission> {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'getObjFieldPermissions',
        sObjectApiName: sObjectApiName
      };

      const apiResponse = await axios.post(
        'http://localhost:3000/api/getObjFieldPermissions',
        params
      );

      const apiResult = apiResponse.data;

      return apiResult;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getObjFlows({ sObjectApiName }: ObjFlowParams) {
    try {
      const params = {
        sObjectApiName: sObjectApiName
      };

      const response = await axios.post(
        'http://localhost:3000/api/getObjFlows',
        params
      );

      const apiResponse = response.data;

      if (apiResponse.status !== 'success') {
        throw new Error(`getObjFlows - ${apiResponse.errorMessage}`);
      }

      return apiResponse.flows;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getObjGridPrefs({ sObjectApiName, isSubgridView }: ObjGridPrefsParams) {
    try {
      const params = {
        sObjectApiName: sObjectApiName,
        isSubgridView: isSubgridView
      };

      const response = await axios.post(
        'http://localhost:3000/api/getObjGridPrefs',
        params
      );

      const apiResponse = response.data;

      if (apiResponse.status !== 'success') {
        throw new Error(`getObjGridPrefs - ${apiResponse.errorMessage}`);
      }

      return apiResponse.prefs;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getObjMetadata({ sObjectApiName }: ObjMetadataParams) {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'apiGetSObjectMetadata',
        sObjectApiName: sObjectApiName
      };

      const apiResponse = await axios.post(
        'http://localhost:3000/api/getMetadata',
        params
      );

      const apiResult = apiResponse.data;

      return apiResult;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getObjPermissions(): Promise<SObjectPermission[]> {
    try {
      const params = {
        apexClass: 'AppGridAg.AppGridController',
        methodName: 'getObjPermissions',
        dummyArg: ''
      };

      const apiResponse = await axios.post(
        'http://localhost:3000/api/getObjPermissions',
        params
      );

      const apiResult = apiResponse.data;

      if (apiResult.status != 'success') {
        throw new Error(apiResult.errorMessage);
      }

      return apiResult.objectPermissions;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getObjPreferences(): Promise<ObjPreferenceSObject[]> {
    try {
      const params = {
        apexClass: 'AppGridAg.AppGridController',
        methodName: 'getObjPreferences',
        dummyArg: ''
      };

      const apiResponse = await axios.post(
        'http://localhost:3000/api/getObjPreferences',
        params
      );

      const apiResult = apiResponse.data;

      if (apiResult.status != 'success') {
        throw new Error(apiResult.errorMessage);
      }

      return apiResult.objectPreferences;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getObjQueries({ sObjectApiName }: ObjQueryParams) {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'getObjQueries',
        sObjectApiName: sObjectApiName
      };

      const response = await axios.post(
        'http://localhost:3000/api/getObjQueries',
        params
      );

      const apiResult = response.data;

      if (apiResult.status !== 'success') {
        throw new Error(apiResult.errorMessage);
      }

      return apiResult.options;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getObjTimeSeriesGridPreferences({
    sObjectApiName
  }: TreeGridPrefParams): Promise<SObjectTimeSeriesGridPreference[]> {
    try {
      const params = {
        sObjectApiName: sObjectApiName
      };

      const apiResponse = await axios.post(
        'http://localhost:3000/api/getObjTimeSeriesGridPreferences',
        params
      );

      const apiResult = apiResponse.data;

      if (apiResult.status != 'success') {
        throw new Error(apiResult.errorMessage);
      }

      return apiResult.timeSeriesGridPreferences;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getObjTreeGridPreferences({
    sObjectApiName
  }: TreeGridPrefParams): Promise<SObjectTreeGridPreference[]> {
    try {
      const params = {
        sObjectApiName: sObjectApiName
      };

      const apiResponse = await axios.post(
        'http://localhost:3000/api/getObjTreeGridPreferences',
        params
      );

      const apiResult = apiResponse.data;

      if (apiResult.status != 'success') {
        throw new Error(apiResult.errorMessage);
      }

      return apiResult.treeGridPreferences;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getObjViews({ isSubgridView, sObjectApiName }: ObjViewParams) {
    try {
      const params = {
        isSubgridView: isSubgridView,
        sObjectApiName: sObjectApiName
      };

      const response = await axios.post(
        'http://localhost:3000/api/getObjViews',
        params
      );

      const apiResponse = response.data;

      if (apiResponse.status !== 'success') {
        throw new Error(`getObjFlows - ${apiResponse.errorMessage}`);
      }

      return apiResponse.views;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getOrgObjects(): Promise<OrgObject[]> {
    // Destructuring params object
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'getUserOrgObjects',
        includeAllObjects: false
      };

      const response = await axios.post(
        'http://localhost:3000/api/getOrgObjects',
        params
      );

      const apiResponse = response.data;

      if (apiResponse.status !== 'success') {
        throw new Error(apiResponse.errorMessage);
      }

      const orgObjectList = apiResponse.orgObjects;

      // Get rid of HTML encoding in the labels
      const sortedList = orgObjectList.map((o: OrgObject) => ({
        ...o,
        label: decode(o.Label)
      }));

      // Sort by label
      sortedList.sort((a: OrgObject, b: OrgObject) => {
        const nameA = a.Label.toUpperCase(); // ignore upper and lowercase
        const nameB = b.Label.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });

      return sortedList;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getRelationPreferences({
    sObjectApiName
  }: RelationPreferenceParams): Promise<SObjectRelationPreference[]> {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'getRelationPreferences',
        sObjectApiName: sObjectApiName
      };

      const response = await axios.post(
        'http://localhost:3000/api/getRelationPreferences',
        params
      );

      const apiResponse = response.data;

      // Handle errors in response
      if (apiResponse.status !== 'success') {
        throw new Error(apiResponse.errorMessage);
      }

      // there will always be 1 relationPreferences record
      // unless there is an app error
      if (apiResponse.relationPreferences.length > 1) {
        throw new Error(
          'getRelationPreferences - more than 1 relation preferences record found'
        );
      }

      return apiResponse.relationPreferences;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getSchedulerEvents(
    params: GetEventParams
  ): Promise<SchedulerEventWrapper[]> {
    try {
      const apiResponse = await axios.post<SObjectSchedulerEvent[]>(
        'http://localhost:3000/api/getSchedulerEvents',
        params
      );

      const apiResult = apiResponse.data;

      // Return the records if successful
      return apiResult;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getSObjectName({
    recordId
  }: SObjectNameParams): Promise<SObjectNameApiResponse> {
    try {
      const params = {
        recordId: recordId
      };

      const response = await axios.post(
        'http://localhost:3000/api/getSObjectName',
        params
      );

      const apiResponse = response.data;

      // Handle errors in response
      if (apiResponse.status !== 'success') {
        throw new Error(apiResponse.errorMessage);
      }

      return apiResponse;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getUserInfo(): Promise<UserInfo> {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'getUserInfo',
        dummyArg: ''
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/getUserInfo`,
        params
      );

      const apiResult = response.data;

      if (apiResult.status !== 'success') {
        throw new Error(apiResult.errorMessage);
      }

      return apiResult.userInfo;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'getUserProfile',
        dummyArg: ''
      };

      const response = await axios.post(
        'http://localhost:3000/api/getUserProfile',
        params
      );

      const apiResult = response.data;

      if (apiResult.status !== 'success') {
        throw new Error(apiResult.errorMessage);
      }

      return apiResult.profile;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getUsersWithProfile({ profileName }: UserProfileParams) {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'getUsersWithProfiles',
        dummyArg: profileName
      };

      const response = await axios.post(
        'http://localhost:3000/api/getUsersWithProfiles',
        params
      );

      const apiResult = response.data;

      if (apiResult.status !== 'success') {
        throw new Error(apiResult.errorMessage);
      }

      return apiResult.users;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getProjectRoles(
    params: ProjectRoleParams
  ): Promise<SObjectProjectRole[]> {
    // Return 'any' to handle the wrapper
    try {
      const apiResponse = await axios.post<SObjectProjectRole[]>(
        'http://localhost:3000/api/getProjectRoles',
        params
      );

      const apiResult = apiResponse.data;

      // Return the records if successful
      return apiResult;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getHolidays(params: ProjectHolidayParams): Promise<SObjectHoliday[]> {
    try {
      const apiResponse = await axios.post<SObjectHoliday[]>(
        'http://localhost:3000/api/getHolidays',
        params
      );

      const apiResult = apiResponse.data;

      // Return the records if successful
      return apiResult;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getProjectStatuses(
    params: ProjectStatusParams
  ): Promise<SObjectProjectStatus[]> {
    // Return 'any' to handle the wrapper
    try {
      const apiResponse = await axios.post<SObjectProjectRole[]>(
        'http://localhost:3000/api/getProjectStatuses',
        params
      );

      const apiResult = apiResponse.data;

      // Return the records if successful
      return apiResult;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async getProjectTasks(
    params: ProjectTaskQueryParams
  ): Promise<SObjectProjectTask[]> {
    // Return 'any' to handle the wrapper
    try {
      const apiResponse = await axios.post<ProjectTaskQueryApiResponse>(
        'http://localhost:3000/api/getProjectTasks',
        params
      );

      const apiResult = apiResponse.data;

      // This handles cases where Apex runs successfully but returns a logical error.
      if (apiResult.status === 'ERROR') {
        console.error(
          'APEX LOGIC ERROR (Status 200 OK):',
          apiResult.errorMessage
        );
        throw new Error(apiResult.errorMessage);
      }

      // Return the records if successful
      return apiResult.records;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async queryRecordsWithLocator(
    params: QueryLocatorParams
  ): Promise<QueryServiceApiResponse> {
    // Return 'any' to handle the wrapper
    try {
      // This part is correct. It sends the request to your Node server.
      const apiResponse = await axios.post(
        'http://localhost:3000/api/queryRecordsWithLocator',
        params
      );

      const apiResult = apiResponse.data;

      // Return the records if successful
      return apiResult;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async queryService(query: QueryServiceParams): Promise<any> {
    // Return 'any' to handle the wrapper
    try {
      const apiResponse = await axios.post(
        'http://localhost:3000/api/executeDynamicSOQL',
        query
      );

      const apiResult = apiResponse.data;

      // console.log('sqlClient queryService apiResult is');
      // console.dir(apiResult);

      // This handles cases where Apex runs successfully but returns a logical error.
      if (apiResult.status === 'ERROR') {
        console.error(
          'APEX LOGIC ERROR (Status 200 OK):',
          apiResult.errorMessage
        );
        throw new Error(apiResult.errorMessage);
      }

      // Return the records if successful
      return apiResult;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async runFlow({ flowName, flowParameters, flowRecordIds }: RunFlowParams) {
    try {
      const params = {
        apexClass: 'AppGridController',
        methodName: 'runFlow',
        flowName: flowName,
        flowParameters: flowParameters,
        flowRecordIds: flowRecordIds
      };

      const response = await axios.post(
        'http://localhost:3000/api/runFlow',
        params
      );

      const apiResponse = response.data;

      if (apiResponse.status !== 'success') {
        throw new Error(apiResponse.errorMessage);
      }

      return apiResponse.flows;
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async upsertRecordsService(
    params: UpsertServiceParams
  ): Promise<SObjectUpsertResult[]> {
    try {
      console.log('>>> sqlClient - calling upsertRecs api with params');
      console.dir(params);

      const apiResponse = await axios.post(
        'http://localhost:3000/api/upsertRecs',
        params
      );
      console.log('>>> upsertRecs api response is');
      console.dir(apiResponse);

      const apiResult = apiResponse.data;

      console.log('>>> upsertRecs apiResult is');
      console.dir(apiResult);

      return apiResult; // Expect results array
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }

  async upsertSchedulerEvents(
    params: UpsertSchedulerEventParams
  ): Promise<GetSchedulerEventsApiResponse[]> {
    try {
      const apiResponse = await axios.post(
        'http://localhost:3000/api/upsertSchedulerEvents',
        params
      );
      console.log('>>> upsertSchedulerEvents api response is');
      console.dir(apiResponse);

      const apiResult = apiResponse.data;

      console.log('>>> upsertSchedulerEvents apiResult is');
      console.dir(apiResult);

      return apiResult; // Expect results array
    } catch (error: any) {
      // FIX: Check for the detailed error message in the server's response payload.
      // Axios places the server's response data in `error.response.data`.
      if (
        error.response &&
        error.response.data &&
        error.response.data.errorMessage
      ) {
        // If we find the detailed message from our server, throw that.
        throw new Error(error.response.data.errorMessage);
      } else {
        // Otherwise, fall back to the generic axios error message.
        throw new Error(error.message);
      }
    }
  }
}
