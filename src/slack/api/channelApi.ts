/**
 * Channel API
 * Handles Slack channel operations and Salesforce channel links
 */

import { APIClient } from '../../brideDesignPattern/apiInterface';
import { prettyPrint } from '../../utilities/prettyPrint';

export interface SlackChannel {
  id: string;
  name?: string;
  is_private: boolean;
  is_member: boolean;
  is_im?: boolean;
  is_mpim?: boolean;
  user?: string;
  creator?: string;
  num_members?: number;
}

export interface ChannelInfo {
  ok: boolean;
  channel: SlackChannel;
  error?: string;
}

export interface ChannelLink {
  channelId: string;
  channelName: string;
  recordId: string;
  recordName: string;
  isPrimary: boolean;
  linkType: string;
  createdDate: string;
  isOwner?: boolean;
  creator?: string;
}

export interface CreateChannelLinkParams {
  recordId: string;
  objectType: string;
  recordName: string;
  channelId: string;
  channelName: string;
  isPrimary: boolean;
  linkType: string;
}

/**
 * Get information about a specific channel
 */
export async function getChannelInfo(apiClient: APIClient, channelId: string): Promise<SlackChannel> {
  prettyPrint(`[channelApi] Getting channel info: ${channelId}`, null, 'blue');

  const response = await apiClient.slackGetConversationInfo({ channel: channelId });
  const data: ChannelInfo = typeof response === 'string' ? JSON.parse(response) : response;

  if (!data.ok) {
    throw new Error(data.error || 'Failed to get channel info');
  }

  return data.channel;
}

/**
 * Get channel info for multiple channels in parallel
 */
export async function getMultipleChannelInfo(
  apiClient: APIClient,
  channelIds: string[]
): Promise<Map<string, SlackChannel>> {
  prettyPrint(`[channelApi] Getting info for ${channelIds.length} channels`, null, 'blue');

  const results = new Map<string, SlackChannel>();

  // Fetch all in parallel (no rate limiting - let Slack handle it)
  const promises = channelIds.map(async (channelId) => {
    try {
      const channel = await getChannelInfo(apiClient, channelId);
      return { channelId, channel };
    } catch (error) {
      prettyPrint(`[channelApi] Failed to get info for ${channelId}:`, error, 'red');
      return { channelId, channel: null };
    }
  });

  const channelResults = await Promise.all(promises);

  channelResults.forEach(({ channelId, channel }) => {
    if (channel) {
      results.set(channelId, channel);
    }
  });

  prettyPrint(`[channelApi] Successfully fetched ${results.size} channel infos`, null, 'green');
  return results;
}

/**
 * Get Salesforce channel links for a record
 */
export async function getChannelLinks(apiClient: APIClient, recordId: string): Promise<ChannelLink[]> {
  prettyPrint(`[channelApi] Getting channel links for record: ${recordId}`, null, 'blue');

  const response = await apiClient.slackGetChannelLinks({ recordId });
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  if (!data.success) {
    throw new Error('Failed to get channel links');
  }

  prettyPrint(`[channelApi] Found ${data.links.length} channel links`, null, 'green');
  return data.links;
}

/**
 * Create a Salesforce channel link
 */
export async function createChannelLink(
  apiClient: APIClient,
  params: CreateChannelLinkParams
): Promise<void> {
  prettyPrint('[channelApi] Creating channel link:', params, 'blue');

  const response = await apiClient.slackCreateChannelLink(params);
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  if (!data.success) {
    throw new Error(data.message || 'Failed to create channel link');
  }

  prettyPrint('[channelApi] Channel link created successfully', null, 'green');
}

/**
 * Delete a Salesforce channel link
 */
export async function deleteChannelLink(
  apiClient: APIClient,
  recordId: string,
  channelId: string
): Promise<void> {
  prettyPrint(`[channelApi] Deleting channel link: ${recordId} -> ${channelId}`, null, 'blue');

  const response = await apiClient.slackDeleteChannelLink({ recordId, channelId });
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  if (!data.success) {
    throw new Error(data.message || 'Failed to delete channel link');
  }

  prettyPrint('[channelApi] Channel link deleted successfully', null, 'green');
}

/**
 * Open a DM conversation with a user
 */
export async function openDMConversation(apiClient: APIClient, userId: string): Promise<string> {
  prettyPrint(`[channelApi] Opening DM with user: ${userId}`, null, 'blue');

  const response = await apiClient.slackOpenConversation({ users: userId });
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  if (!data.ok || !data.channel) {
    throw new Error(data.error || 'Failed to open DM conversation');
  }

  const channelId = data.channel.id;
  prettyPrint(`[channelApi] DM channel ID: ${channelId}`, null, 'green');

  return channelId;
}

/**
 * Create a new channel
 */
export async function createChannel(
  apiClient: APIClient,
  name: string,
  isPrivate: boolean
): Promise<string> {
  prettyPrint(`[channelApi] Creating channel: ${name} (private: ${isPrivate})`, null, 'blue');

  const response = await apiClient.slackCreateChannel({
    name,
    is_private: isPrivate,
  });
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  if (!data.ok || !data.channel) {
    throw new Error(data.error || 'Failed to create channel');
  }

  const channelId = data.channel.id;
  prettyPrint(`[channelApi] Channel created: ${channelId}`, null, 'green');

  return channelId;
}
