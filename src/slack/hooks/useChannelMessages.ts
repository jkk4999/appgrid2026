/**
 * Hook for fetching channel messages
 */

import { useState, useEffect, useCallback } from 'react';
import { APIClient } from '../../brideDesignPattern/apiInterface';
import { getConversationHistory, SlackMessage } from '../api/messageApi';
import { prettyPrint } from '../../utilities/prettyPrint';

export function useChannelMessages(apiClient: APIClient, channelId: string | null, limit: number = 20, isAuthenticated: boolean = true) {
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!channelId || !isAuthenticated) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const msgs = await getConversationHistory(apiClient, channelId, limit);
      setMessages(msgs);
    } catch (err: any) {
      prettyPrint('[useChannelMessages] Failed to fetch messages:', err, 'red');
      setError(err.message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [apiClient, channelId, limit, isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    messages,
    loading,
    error,
    refresh,
  };
}
