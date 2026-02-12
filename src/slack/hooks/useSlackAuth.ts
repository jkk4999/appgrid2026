/**
 * useSlackAuth - Custom hook for managing Slack authentication state
 *
 * This hook provides a complete authentication flow for Slack integration:
 * - Checks if the user has a stored OAuth token
 * - Validates the token by testing authentication with Slack API
 * - Provides disconnect functionality to revoke the token
 * - Tracks authentication state, user info, and any errors
 *
 * @module useSlackAuth
 *
 * Error Handling:
 * - Catches and exposes configuration errors (missing metadata records)
 * - Exposes authentication failures for UI display
 * - Logs all operations via prettyPrint for debugging
 *
 * @example
 * ```tsx
 * const { isAuthenticated, isChecking, currentUserId, error, disconnect } = useSlackAuth(apiClient);
 *
 * if (isChecking) return <Loading />;
 * if (error) return <Error message={error} />;
 * if (!isAuthenticated) return <ConnectButton />;
 * return <SlackUI userId={currentUserId} />;
 * ```
 */

import { useState, useEffect } from 'react';
import { APIClient } from '../../brideDesignPattern/apiInterface';
import { testAuth, getUserToken, revokeUserToken, AuthTestResult } from '../api/authApi';
import { prettyPrint } from '../../utilities/prettyPrint';

/**
 * Custom hook for managing Slack authentication state.
 *
 * Automatically checks authentication status on mount and provides
 * methods for disconnecting the user's Slack account.
 *
 * @param apiClient - The APIClient instance for making Apex calls to Salesforce
 * @returns Object containing authentication state and methods:
 *   - isAuthenticated: boolean - Whether the user has a valid Slack connection
 *   - isChecking: boolean - Whether authentication check is in progress
 *   - currentUserId: string | null - The Slack user ID if authenticated
 *   - authInfo: AuthTestResult | null - Full auth test result from Slack
 *   - error: string | null - Error message if authentication failed
 *   - disconnect: () => Promise<void> - Function to revoke the user's token
 */
export function useSlackAuth(apiClient: APIClient) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<AuthTestResult | null>(null);

  /**
   * Effect: Check authentication status on mount.
   *
   * Performs the following steps:
   * 1. Queries Salesforce for a stored user token
   * 2. If token exists, validates it with Slack's auth.test API
   * 3. Updates state based on authentication result
   *
   * This runs once when the component mounts (or when apiClient changes).
   */
  useEffect(() => {
    /**
     * Async function to check authentication status.
     * Called immediately when the effect runs.
     */
    const checkAuth = async () => {
      try {
        setIsChecking(true);
        setError(null);

        prettyPrint('[useSlackAuth] Checking authentication', null, 'blue');

        // Check if user has a token
        const tokenData = await getUserToken(apiClient);

        if (tokenData.success && tokenData.hasToken) {
          // Verify the token works
          const authData = await testAuth(apiClient);

          if (authData.ok) {
            setIsAuthenticated(true);
            setCurrentUserId(authData.user_id);
            setAuthInfo(authData);
            prettyPrint('[useSlackAuth] User authenticated:', authData.user_id, 'green');
          } else {
            setIsAuthenticated(false);
            setError(authData.error || 'Authentication failed');
          }
        } else {
          setIsAuthenticated(false);
          prettyPrint('[useSlackAuth] User not authenticated', null, 'yellow');
        }
      } catch (err: any) {
        prettyPrint('[useSlackAuth] Authentication check failed:', err, 'red');
        setError(err.message);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [apiClient]);

  /**
   * Disconnects the user from Slack by revoking their stored OAuth token.
   *
   * This function:
   * 1. Calls the Apex method to mark the token as inactive in Salesforce
   * 2. Clears all local authentication state
   * 3. Logs the operation for debugging
   *
   * @async
   * @throws Re-throws errors after logging; caller should handle
   */
  const disconnect = async () => {
    try {
      setError(null);
      prettyPrint('[useSlackAuth] Disconnecting from Slack', null, 'blue');

      await revokeUserToken(apiClient);

      setIsAuthenticated(false);
      setCurrentUserId(null);
      setAuthInfo(null);
      prettyPrint('[useSlackAuth] Disconnected successfully', null, 'green');
    } catch (err: any) {
      prettyPrint('[useSlackAuth] Disconnect failed:', err, 'red');
      setError(err.message);
      throw err;
    }
  };

  return {
    isAuthenticated,
    isChecking,
    currentUserId,
    authInfo,
    error,
    disconnect,
  };
}
