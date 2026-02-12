/**
 * Hook for fetching Slack users
 */

import { useState, useEffect, useCallback } from 'react';
import { APIClient } from '../../brideDesignPattern/apiInterface';
import { listUsers, SlackUser } from '../api/userApi';
import { prettyPrint } from '../../utilities/prettyPrint';

export function useSlackUsers(apiClient: APIClient, enabled: boolean = true, isAuthenticated: boolean = true) {
  const [users, setUsers] = useState<SlackUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !isAuthenticated) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userList = await listUsers(apiClient);

      // Filter out deleted users and bots
      const activeUsers = userList.filter(user => !user.deleted && user.id !== 'USLACKBOT');

      setUsers(activeUsers);
    } catch (err: any) {
      prettyPrint('[useSlackUsers] Failed to fetch users:', err, 'red');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiClient, enabled, isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    users,
    loading,
    error,
    refresh,
  };
}
