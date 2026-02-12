/**
 * authApi - Authentication API for Slack OAuth and token management
 *
 * This module provides functions for managing Slack user authentication:
 * - Testing authentication status with Slack's auth.test endpoint
 * - Retrieving user token status from Salesforce
 * - Revoking tokens when disconnecting
 * - Getting OAuth authorization URLs for the connection flow
 *
 * @module authApi
 *
 * All functions communicate with Salesforce Apex controllers which in turn
 * call the Slack API. User tokens are stored in Salesforce custom objects.
 *
 * Error Handling:
 * - Configuration errors (missing metadata) are passed through for UI handling
 * - Network errors are caught and re-thrown with context
 * - All operations are logged via prettyPrint
 */

import { APIClient } from '../../brideDesignPattern/apiInterface';
import { prettyPrint } from '../../utilities/prettyPrint';

/**
 * Result from Slack's auth.test API endpoint.
 * Contains information about the authenticated user and workspace.
 *
 * @interface AuthTestResult
 */
export interface AuthTestResult {
  /** Whether the authentication test was successful */
  ok: boolean;
  /** The URL of the Slack workspace */
  url: string;
  /** The name of the Slack workspace/team */
  team: string;
  /** The display name of the authenticated user */
  user: string;
  /** The unique identifier for the Slack workspace */
  team_id: string;
  /** The unique identifier for the authenticated user */
  user_id: string;
  /** The bot user ID if the token is a bot token (optional) */
  bot_id?: string;
  /** Error code from Slack if authentication failed (optional) */
  error?: string;
}

/**
 * Result from checking user token status in Salesforce.
 *
 * @interface UserTokenResult
 */
export interface UserTokenResult {
  /** Whether the API call was successful */
  success: boolean;
  /** Whether the user has an active token stored */
  hasToken: boolean;
  /** The actual token value (only returned if hasToken is true) */
  userToken?: string;
}

/**
 * Tests authentication with Slack and retrieves current user info.
 *
 * Calls Slack's auth.test endpoint to verify the stored token is valid
 * and retrieve information about the authenticated user and workspace.
 *
 * @async
 * @param apiClient - The APIClient instance for making Apex calls
 * @returns Promise resolving to AuthTestResult with user/team info
 * @throws Error if the API call fails or token is invalid
 */
export async function testAuth(apiClient: APIClient): Promise<AuthTestResult> {
  prettyPrint('[authApi] Testing authentication', null, 'blue');

  const response = await apiClient.slackAuthTest();
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  prettyPrint('[authApi] Auth test result:', data, 'blue');
  return data;
}

/**
 * Retrieves the current user's Slack token status from Salesforce.
 *
 * Checks if the current Salesforce user has an active OAuth token stored.
 * Does not return the actual token for security; just indicates if one exists.
 *
 * @async
 * @param apiClient - The APIClient instance for making Apex calls
 * @returns Promise resolving to UserTokenResult indicating token status
 * @throws Error if the API call fails (e.g., configuration error)
 */
export async function getUserToken(apiClient: APIClient): Promise<UserTokenResult> {
  prettyPrint('[authApi] Getting user token', null, 'blue');

  const response = await apiClient.slackGetUserToken();
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  return data;
}

/**
 * Revokes/deactivates the current user's Slack OAuth token.
 *
 * Marks the stored token as inactive in Salesforce. This disconnects
 * the user from Slack without deleting the token record.
 *
 * @async
 * @param apiClient - The APIClient instance for making Apex calls
 * @returns Promise resolving to object with success boolean
 * @throws Error if the API call fails
 */
export async function revokeUserToken(apiClient: APIClient): Promise<{ success: boolean }> {
  prettyPrint('[authApi] Revoking user token', null, 'blue');

  const response = await apiClient.slackRevokeUserToken();
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  return data;
}

/**
 * Gets the Slack OAuth authorization URL for connecting a user's account.
 *
 * Generates a URL that redirects to Slack's OAuth consent page. The URL includes:
 * - Client ID from Salesforce metadata configuration
 * - Required user scopes for Slack API access
 * - Redirect URI back to Salesforce
 * - CSRF protection state parameter
 *
 * @async
 * @param apiClient - The APIClient instance for making Apex calls
 * @returns Promise resolving to object containing the authorization URL
 * @throws Error if configuration is missing (Client ID not set)
 */
export async function getAuthorizationUrl(apiClient: APIClient): Promise<{ authUrl: string }> {
  prettyPrint('[authApi] Getting authorization URL', null, 'blue');

  const response = await apiClient.slackGetAuthorizationUrl();
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  return data;
}
