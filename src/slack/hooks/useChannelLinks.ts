/**
 * useChannelLinks - Custom hook for fetching and managing Slack channel links
 *
 * This hook manages the relationship between Salesforce records and Slack channels/DMs.
 * It provides:
 * - Automatic fetching of channel links when record changes
 * - Enrichment of links with Slack channel metadata (owner status, DM detection)
 * - Separation of channels vs DMs for different UI treatment
 * - Manual refresh capability for updates after creating new links
 *
 * @module useChannelLinks
 *
 * Channel links are stored in Salesforce (Ag_Slack_Channel_Link__c) and associate
 * a Slack channel with a Salesforce record for contextual messaging.
 *
 * @example
 * ```tsx
 * const { channelLinks, dmLinks, loading, error, refresh } = useChannelLinks(
 *   apiClient,
 *   recordId,
 *   currentUserId,
 *   isAuthenticated
 * );
 *
 * // Display channels and DMs separately
 * <ChannelList channels={channelLinks} />
 * <DMList dms={dmLinks} />
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { APIClient } from '../../brideDesignPattern/apiInterface';
import { getChannelLinks, getMultipleChannelInfo, ChannelLink } from '../api/channelApi';
import { prettyPrint } from '../../utilities/prettyPrint';

/**
 * Extended ChannelLink interface with additional metadata from Slack API.
 * @interface EnrichedChannelLink
 * @extends ChannelLink
 */
export interface EnrichedChannelLink extends ChannelLink {
  /** Whether the current user is the creator/owner of this channel */
  isOwner?: boolean;
  /** Whether this is a direct message (im or mpim) rather than a channel */
  isDM?: boolean;
}

/**
 * Custom hook for fetching Salesforce channel links for a specific record.
 *
 * Automatically fetches and enriches channel links when the record ID changes.
 * Separates channels and DMs for different UI treatment.
 *
 * @param apiClient - The APIClient instance for making Apex calls
 * @param recordId - The Salesforce record ID to fetch links for (null to skip)
 * @param currentUserId - The current Slack user ID for ownership detection
 * @param isAuthenticated - Whether the user is authenticated (default: true)
 * @returns Object containing:
 *   - channelLinks: EnrichedChannelLink[] - Non-DM channel links
 *   - dmLinks: EnrichedChannelLink[] - Direct message links
 *   - loading: boolean - Whether data is being fetched
 *   - error: string | null - Error message if fetch failed
 *   - refresh: () => Promise<void> - Function to manually refresh data
 */
export function useChannelLinks(apiClient: APIClient, recordId: string | null, currentUserId: string | null, isAuthenticated: boolean = true) {
  const [channelLinks, setChannelLinks] = useState<EnrichedChannelLink[]>([]);
  const [dmLinks, setDmLinks] = useState<EnrichedChannelLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches and enriches channel links for the current record.
   *
   * This function:
   * 1. Fetches channel link records from Salesforce
   * 2. For each link, fetches channel info from Slack API
   * 3. Enriches links with ownership and type info
   * 4. Separates results into channels vs DMs
   *
   * @async
   * @returns Promise that resolves when refresh is complete
   * @throws Rejects the promise if fetch fails (error stored in state)
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (!recordId || !isAuthenticated) {
      setChannelLinks([]);
      setDmLinks([]);
      return Promise.resolve();
    }

    try {
      setLoading(true);
      setError(null);

      prettyPrint(`[useChannelLinks] Fetching links for record: ${recordId}`, null, 'blue');

      // Get channel links from Salesforce
      const links = await getChannelLinks(apiClient, recordId);

      if (links.length === 0) {
        setChannelLinks([]);
        setDmLinks([]);
        setLoading(false);
        return Promise.resolve();
      }

      // Get channel info for all links
      const channelIds = links.map(link => link.channelId);
      const channelInfoMap = await getMultipleChannelInfo(apiClient, channelIds);

      // Enrich links with channel info and separate DMs from channels
      const channels: EnrichedChannelLink[] = [];
      const dms: EnrichedChannelLink[] = [];

      links.forEach(link => {
        const channelInfo = channelInfoMap.get(link.channelId);

        if (channelInfo) {
          const enriched: EnrichedChannelLink = {
            ...link,
            isOwner: currentUserId ? channelInfo.creator === currentUserId : false,
            isDM: channelInfo.is_im || channelInfo.is_mpim || false,
          };

          if (enriched.isDM) {
            dms.push(enriched);
          } else {
            channels.push(enriched);
          }
        } else {
          // If we can't get channel info, assume it's a channel (not DM)
          channels.push(link);
        }
      });

      prettyPrint(`[useChannelLinks] Found ${channels.length} channels and ${dms.length} DMs`, null, 'green');

      setChannelLinks(channels);
      setDmLinks(dms);
      return Promise.resolve();
    } catch (err: any) {
      prettyPrint('[useChannelLinks] Failed to fetch channel links:', err, 'red');
      setError(err.message);
      return Promise.reject(err);
    } finally {
      setLoading(false);
    }
  }, [apiClient, recordId, currentUserId, isAuthenticated]);

  /**
   * Effect: Automatically refresh channel links when dependencies change.
   * Triggers when recordId, currentUserId, or authentication status changes.
   */
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    channelLinks,
    dmLinks,
    loading,
    error,
    refresh,
  };
}
