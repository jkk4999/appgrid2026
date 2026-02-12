/**
 * SalesforceApi - Wrapper for Salesforce API operations
 *
 * This module provides a simplified interface for common Salesforce operations
 * using the apiClient bridge pattern.
 */

import { APIClient } from '../brideDesignPattern/apiInterface';

/**
 * Query result interface
 */
export interface QueryResult<T> {
  records: T[];
  totalSize: number;
  done: boolean;
}

/**
 * SalesforceApi class - provides static methods for Salesforce operations
 */
export class SalesforceApi {
  private static apiClient: APIClient | null = null;

  /**
   * Initialize the SalesforceApi with an apiClient instance
   * Must be called before using any other methods
   */
  static initialize(apiClient: APIClient): void {
    this.apiClient = apiClient;
  }

  /**
   * Get the current apiClient instance
   */
  private static getClient(): APIClient {
    if (!this.apiClient) {
      throw new Error(
        'SalesforceApi not initialized. Call SalesforceApi.initialize(apiClient) first.'
      );
    }
    return this.apiClient;
  }

  /**
   * Execute a SOQL query using the structured API
   * @param sObjectName - The SObject API name
   * @param queryRule - JSON string containing the query rule/filter
   * @param subQueryRule - Optional sub-query rule (JSON string)
   * @param subQueryRelation - Optional sub-query relation name
   * @returns Promise with query results
   */
  static async query<T = any>(
    sObjectName: string,
    queryRule: string = '{}',
    subQueryRule: string | null = null,
    subQueryRelation: string | null = null
  ): Promise<QueryResult<T>> {
    const client = this.getClient();

    try {
      const result = await client.executeDynamicSOQL({
        sObjectName,
        queryRule,
        subQueryRule,
        subQueryRelation
      });

      // Parse the result
      return {
        records: result?.records || [],
        totalSize: result?.records?.length || 0,
        done: !result?.hasMore
      };
    } catch (error: any) {
      console.error('SalesforceApi query failed:', error);
      throw new Error(`Query failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Execute a raw SOQL query string
   * NOTE: This method is not yet implemented as the underlying API
   * does not support raw SOQL queries directly.
   * @param _soql - Raw SOQL query string (not used)
   * @returns Never - always throws
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async queryRaw<T = any>(soql: string): Promise<QueryResult<T>> {
    throw new Error(
      'Raw SOQL queries are not supported. Use the apiClient directly or use structured query parameters.'
    );
  }

  /**
   * Update a Salesforce record
   * @param sObjectType - Salesforce object API name
   * @param recordId - Record ID to update
   * @param fields - Fields to update
   * @returns Promise with update result
   */
  static async update(
    sObjectType: string,
    recordId: string,
    fields: Record<string, any>
  ): Promise<any> {
    const client = this.getClient();

    try {
      const record = {
        Id: recordId,
        ...fields
      };

      const result = await client.upsertRecs({
        sObjectName: sObjectType,
        jsonRecs: JSON.stringify([record])
      });

      return result;
    } catch (error: any) {
      console.error('SalesforceApi update failed:', error);
      throw new Error(`Update failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Create a new Salesforce record
   * @param sObjectType - Salesforce object API name
   * @param fields - Fields for the new record
   * @returns Promise with created record
   */
  static async create(
    sObjectType: string,
    fields: Record<string, any>
  ): Promise<any> {
    const client = this.getClient();

    try {
      const result = await client.upsertRecs({
        sObjectName: sObjectType,
        jsonRecs: JSON.stringify([fields])
      });

      return result && result.results && result.results.length > 0 ? result.results[0] : result;
    } catch (error: any) {
      console.error('SalesforceApi create failed:', error);
      throw new Error(`Create failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Delete a Salesforce record
   * @param sObjectType - Salesforce object API name
   * @param recordId - Record ID to delete
   * @returns Promise with delete result
   */
  static async delete(sObjectType: string, recordId: string): Promise<any> {
    const client = this.getClient();

    try {
      const result = await client.deleteRecs({
        sObjectName: sObjectType,
        recordIds: [recordId]
      });

      return result;
    } catch (error: any) {
      console.error('SalesforceApi delete failed:', error);
      throw new Error(`Delete failed: ${error.message || 'Unknown error'}`);
    }
  }
}

export default SalesforceApi;
