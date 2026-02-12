/**
 * Slack API Client
 *
 * Wrapper for Slack Web API that handles authentication, rate limiting,
 * and error handling for the AppGrid Slack integration.
 *
 * @version 1.0.0
 * @incremental Step 1: Base client with authentication and error handling
 */

import {
  SlackApiResponse,
  SlackChannel,
  SlackChannelsListResponse,
  SlackMessagesResponse,
  SlackMessagePostResponse,
  SlackUser,
  SlackAuthTestResponse,
  SlackSearchResponse,
  SlackError,
  SLACK_ERROR_CODES,
} from '../components/subGrid/slack/types';

// Type alias to help ESLint recognize the global RequestInit type
type FetchRequestInit = globalThis.RequestInit;

/**
 * Configuration options for SlackClient
 */
export interface SlackClientConfig {
  botToken: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Slack API Client Class
 *
 * Provides methods to interact with Slack Web API
 * All methods return promises and handle errors consistently
 */
export class SlackClient {
  private botToken: string;
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  /**
   * Creates a new SlackClient instance
   * @param config - Configuration options
   */
  constructor(config: SlackClientConfig) {
    this.botToken = config.botToken;
    this.baseUrl = config.baseUrl || 'https://slack.com/api';
    this.timeout = config.timeout || 30000; // 30 seconds
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000; // 1 second
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  /**
   * Makes an authenticated request to Slack API
   * @param endpoint - API endpoint (e.g., 'conversations.list')
   * @param options - Fetch options
   * @returns Promise with response data
   */
  private async makeRequest<T>(
    endpoint: string,
    options: FetchRequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.botToken}`,
      'Content-Type': 'application/json; charset=utf-8',
      ...((options.headers as Record<string, string>) || {}),
    };

    const fetchOptions: FetchRequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    try {
      const response = await fetch(url, fetchOptions);

      // Check for HTTP errors
      if (!response.ok) {
        throw this.createError(
          'http_error',
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();

      // Check for Slack API errors
      if (!data.ok) {
        throw this.createSlackError(data);
      }

      return data as T;
    } catch (error: any) {
      // Handle network errors, timeouts, etc.
      if (error.name === 'AbortError') {
        throw this.createError('timeout', 'Request timed out');
      }

      if (error instanceof TypeError) {
        throw this.createError('network_error', 'Network request failed');
      }

      // Re-throw if already a SlackError
      if (this.isSlackError(error)) {
        throw error;
      }

      // Unknown error
      throw this.createError('unknown_error', error.message || 'Unknown error occurred');
    }
  }

  /**
   * Makes a request with retry logic for rate limiting
   * @param endpoint - API endpoint
   * @param options - Fetch options
   * @param attempt - Current attempt number
   * @returns Promise with response data
   */
  private async makeRequestWithRetry<T>(
    endpoint: string,
    options: FetchRequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    try {
      return await this.makeRequest<T>(endpoint, options);
    } catch (error: any) {
      // Retry on rate limit errors
      if (error.code === SLACK_ERROR_CODES.RATE_LIMITED && attempt < this.retryAttempts) {
        const delay = error.retryAfter
          ? error.retryAfter * 1000
          : this.retryDelay * attempt;

        console.warn(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryAttempts})`);

        await this.sleep(delay);
        return this.makeRequestWithRetry<T>(endpoint, options, attempt + 1);
      }

      // Don't retry other errors
      throw error;
    }
  }

  /**
   * Creates a standardized SlackError
   * @param code - Error code
   * @param message - Error message
   * @param statusCode - HTTP status code (optional)
   * @returns SlackError object
   */
  private createError(
    code: string,
    message: string,
    statusCode?: number
  ): SlackError {
    return {
      code,
      message,
      statusCode,
    };
  }

  /**
   * Creates a SlackError from Slack API error response
   * @param data - Slack API error response
   * @returns SlackError object
   */
  private createSlackError(data: any): SlackError {
    const error: SlackError = {
      code: data.error || 'unknown_error',
      message: this.getErrorMessage(data.error),
    };

    // Handle rate limiting with retry-after header
    if (data.error === SLACK_ERROR_CODES.RATE_LIMITED) {
      error.retryAfter = parseInt(data.response_metadata?.retry_after || '60', 10);
    }

    return error;
  }

  /**
   * Checks if an error is a SlackError
   * @param error - Error to check
   * @returns True if error is SlackError
   */
  private isSlackError(error: any): error is SlackError {
    return error && typeof error.code === 'string' && typeof error.message === 'string';
  }

  /**
   * Gets user-friendly error message from error code
   * @param code - Slack error code
   * @returns User-friendly error message
   */
  private getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      [SLACK_ERROR_CODES.NOT_AUTHED]: 'Not authenticated. Please check your Slack configuration.',
      [SLACK_ERROR_CODES.INVALID_AUTH]: 'Invalid authentication token. Please update your Slack configuration.',
      [SLACK_ERROR_CODES.ACCOUNT_INACTIVE]: 'Slack account is inactive.',
      [SLACK_ERROR_CODES.TOKEN_REVOKED]: 'Authentication token has been revoked. Please reconnect.',
      [SLACK_ERROR_CODES.NO_PERMISSION]: 'Insufficient permissions. Please check bot scopes.',
      [SLACK_ERROR_CODES.NOT_IN_CHANNEL]: 'Bot is not a member of this channel. Please invite the bot.',
      [SLACK_ERROR_CODES.IS_ARCHIVED]: 'This channel is archived.',
      [SLACK_ERROR_CODES.CHANNEL_NOT_FOUND]: 'Channel not found.',
      [SLACK_ERROR_CODES.RATE_LIMITED]: 'Rate limit exceeded. Please wait a moment.',
      [SLACK_ERROR_CODES.CANT_CREATE_CHANNEL]: 'Cannot create channel. Check permissions.',
      [SLACK_ERROR_CODES.NAME_TAKEN]: 'Channel name is already taken.',
      [SLACK_ERROR_CODES.INVALID_NAME]: 'Invalid channel name.',
    };

    return messages[code] || `Slack API Error: ${code}`;
  }

  /**
   * Sleep utility for retry delays
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =========================================================================
  // PUBLIC API METHODS - AUTHENTICATION & TESTING
  // =========================================================================

  /**
   * Tests the authentication and returns workspace/bot info
   * This should be called first to verify the connection
   *
   * @returns Promise with auth test response
   * @throws SlackError if authentication fails
   *
   * @example
   * const info = await slackClient.testConnection();
   * console.log(`Connected to ${info.team} as ${info.user}`);
   */
  async testConnection(): Promise<SlackAuthTestResponse> {
    try {
      const response = await this.makeRequest<SlackAuthTestResponse>('auth.test', {
        method: 'POST',
      });

      return response;
    } catch (error: any) {
      console.error('Slack connection test failed:', error);
      throw error;
    }
  }

  /**
   * Gets the current bot token (for debugging only - DO NOT expose to client)
   * @returns Bot token
   */
  getBotToken(): string {
    return this.botToken;
  }

  /**
   * Updates the bot token
   * @param newToken - New bot token
   */
  setBotToken(newToken: string): void {
    this.botToken = newToken;
  }

  // =========================================================================
  // PUBLIC API METHODS - CHANNEL OPERATIONS
  // =========================================================================

  /**
   * Lists all channels the bot has access to
   *
   * @param options - Optional parameters
   * @param options.types - Comma-separated types: public_channel, private_channel, mpim, im
   * @param options.limit - Maximum number of channels to return (default: 200)
   * @param options.cursor - Pagination cursor
   * @returns Promise with list of channels
   *
   * @example
   * const response = await slackClient.listChannels({ types: 'public_channel,private_channel' });
   * console.log(`Found ${response.channels.length} channels`);
   */
  async listChannels(options: {
    types?: string;
    limit?: number;
    cursor?: string;
    excludeArchived?: boolean;
  } = {}): Promise<SlackChannelsListResponse> {
    const params = new URLSearchParams();
    params.append('types', options.types || 'public_channel,private_channel');
    params.append('limit', String(options.limit || 200));
    params.append('exclude_archived', String(options.excludeArchived !== false));

    if (options.cursor) {
      params.append('cursor', options.cursor);
    }

    const endpoint = `conversations.list?${params.toString()}`;

    try {
      const response = await this.makeRequestWithRetry<SlackChannelsListResponse>(endpoint, {
        method: 'GET',
      });

      return response;
    } catch (error: any) {
      console.error('Failed to list Slack channels:', error);
      throw error;
    }
  }

  /**
   * Gets detailed information about a specific channel
   *
   * @param channelId - Slack channel ID (e.g., C1234567890)
   * @returns Promise with channel details
   *
   * @example
   * const channel = await slackClient.getChannelInfo('C1234567890');
   * console.log(`Channel: ${channel.name}, Members: ${channel.num_members}`);
   */
  async getChannelInfo(channelId: string): Promise<SlackChannel> {
    if (!channelId) {
      throw this.createError('invalid_argument', 'Channel ID is required');
    }

    const params = new URLSearchParams();
    params.append('channel', channelId);

    const endpoint = `conversations.info?${params.toString()}`;

    try {
      const response = await this.makeRequestWithRetry<{ ok: boolean; channel: SlackChannel }>(endpoint, {
        method: 'GET',
      });

      return response.channel;
    } catch (error: any) {
      console.error(`Failed to get info for channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new channel
   *
   * @param name - Channel name (lowercase, no spaces, hyphens/underscores allowed)
   * @param isPrivate - Whether channel should be private (default: false)
   * @returns Promise with created channel
   *
   * @example
   * const channel = await slackClient.createChannel('project-apollo', false);
   * console.log(`Created channel: ${channel.id}`);
   */
  async createChannel(name: string, isPrivate: boolean = false): Promise<SlackChannel> {
    if (!name) {
      throw this.createError('invalid_argument', 'Channel name is required');
    }

    // Validate channel name format
    if (!/^[a-z0-9_-]+$/.test(name)) {
      throw this.createError(
        SLACK_ERROR_CODES.INVALID_NAME,
        'Channel name must be lowercase, with no spaces. Use hyphens or underscores.'
      );
    }

    if (name.length > 80) {
      throw this.createError(
        SLACK_ERROR_CODES.INVALID_NAME_MAXLENGTH,
        'Channel name must be 80 characters or less'
      );
    }

    const body = {
      name,
      is_private: isPrivate,
    };

    try {
      const response = await this.makeRequestWithRetry<{ ok: boolean; channel: SlackChannel }>(
        'conversations.create',
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      );

      return response.channel;
    } catch (error: any) {
      console.error(`Failed to create channel "${name}":`, error);
      throw error;
    }
  }

  /**
   * Invites a user to a channel
   *
   * @param channelId - Slack channel ID
   * @param userId - Slack user ID to invite
   * @returns Promise that resolves when invitation is sent
   *
   * @example
   * await slackClient.inviteToChannel('C1234567890', 'U9876543210');
   */
  async inviteToChannel(channelId: string, userId: string): Promise<void> {
    if (!channelId || !userId) {
      throw this.createError('invalid_argument', 'Channel ID and User ID are required');
    }

    const body = {
      channel: channelId,
      users: userId,
    };

    try {
      await this.makeRequestWithRetry<SlackApiResponse>('conversations.invite', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error: any) {
      console.error(`Failed to invite user ${userId} to channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Joins a public channel
   *
   * @param channelId - Slack channel ID
   * @returns Promise with channel info
   *
   * @example
   * const channel = await slackClient.joinChannel('C1234567890');
   */
  async joinChannel(channelId: string): Promise<SlackChannel> {
    if (!channelId) {
      throw this.createError('invalid_argument', 'Channel ID is required');
    }

    const body = {
      channel: channelId,
    };

    try {
      const response = await this.makeRequestWithRetry<{ ok: boolean; channel: SlackChannel }>(
        'conversations.join',
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      );

      return response.channel;
    } catch (error: any) {
      console.error(`Failed to join channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Archives a channel
   *
   * @param channelId - Slack channel ID
   * @returns Promise that resolves when channel is archived
   *
   * @example
   * await slackClient.archiveChannel('C1234567890');
   */
  async archiveChannel(channelId: string): Promise<void> {
    if (!channelId) {
      throw this.createError('invalid_argument', 'Channel ID is required');
    }

    const body = {
      channel: channelId,
    };

    try {
      await this.makeRequestWithRetry<SlackApiResponse>('conversations.archive', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error: any) {
      console.error(`Failed to archive channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Sets the topic for a channel
   *
   * @param channelId - Slack channel ID
   * @param topic - New topic text
   * @returns Promise that resolves when topic is set
   *
   * @example
   * await slackClient.setChannelTopic('C1234567890', 'Project Apollo Discussion');
   */
  async setChannelTopic(channelId: string, topic: string): Promise<void> {
    if (!channelId) {
      throw this.createError('invalid_argument', 'Channel ID is required');
    }

    const body = {
      channel: channelId,
      topic: topic || '',
    };

    try {
      await this.makeRequestWithRetry<SlackApiResponse>('conversations.setTopic', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error: any) {
      console.error(`Failed to set topic for channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Sets the purpose/description for a channel
   *
   * @param channelId - Slack channel ID
   * @param purpose - New purpose text
   * @returns Promise that resolves when purpose is set
   *
   * @example
   * await slackClient.setChannelPurpose('C1234567890', 'Coordinate Apollo project tasks');
   */
  async setChannelPurpose(channelId: string, purpose: string): Promise<void> {
    if (!channelId) {
      throw this.createError('invalid_argument', 'Channel ID is required');
    }

    const body = {
      channel: channelId,
      purpose: purpose || '',
    };

    try {
      await this.makeRequestWithRetry<SlackApiResponse>('conversations.setPurpose', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error: any) {
      console.error(`Failed to set purpose for channel ${channelId}:`, error);
      throw error;
    }
  }

  // =========================================================================
  // PUBLIC API METHODS - MESSAGE OPERATIONS
  // =========================================================================

  /**
   * Gets messages from a channel
   *
   * @param channelId - Slack channel ID
   * @param options - Optional parameters
   * @param options.limit - Number of messages to return (default: 50, max: 1000)
   * @param options.cursor - Pagination cursor for next page
   * @param options.oldest - Only messages after this Unix timestamp
   * @param options.latest - Only messages before this Unix timestamp
   * @returns Promise with messages and pagination info
   *
   * @example
   * const response = await slackClient.getMessages('C1234567890', { limit: 50 });
   * console.log(`Loaded ${response.messages.length} messages`);
   */
  async getMessages(
    channelId: string,
    options: {
      limit?: number;
      cursor?: string;
      oldest?: string;
      latest?: string;
    } = {}
  ): Promise<SlackMessagesResponse> {
    if (!channelId) {
      throw this.createError('invalid_argument', 'Channel ID is required');
    }

    const params = new URLSearchParams();
    params.append('channel', channelId);
    params.append('limit', String(options.limit || 50));

    if (options.cursor) {
      params.append('cursor', options.cursor);
    }
    if (options.oldest) {
      params.append('oldest', options.oldest);
    }
    if (options.latest) {
      params.append('latest', options.latest);
    }

    const endpoint = `conversations.history?${params.toString()}`;

    try {
      const response = await this.makeRequestWithRetry<SlackMessagesResponse>(endpoint, {
        method: 'GET',
      });

      return response;
    } catch (error: any) {
      console.error(`Failed to get messages from channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Sends a message to a channel
   *
   * @param channelId - Slack channel ID
   * @param text - Message text (supports Slack markdown)
   * @param options - Optional parameters
   * @param options.threadTs - Parent message timestamp (for thread replies)
   * @param options.blocks - Rich message blocks (advanced formatting)
   * @returns Promise with posted message details
   *
   * @example
   * const message = await slackClient.sendMessage('C1234567890', 'Hello from AppGrid!');
   * console.log(`Message posted at ${message.ts}`);
   */
  async sendMessage(
    channelId: string,
    text: string,
    options: {
      threadTs?: string;
      blocks?: any[];
    } = {}
  ): Promise<SlackMessagePostResponse> {
    if (!channelId) {
      throw this.createError('invalid_argument', 'Channel ID is required');
    }
    if (!text && !options.blocks) {
      throw this.createError('invalid_argument', 'Message text or blocks are required');
    }

    const body: any = {
      channel: channelId,
      text: text || '',
    };

    if (options.threadTs) {
      body.thread_ts = options.threadTs;
    }

    if (options.blocks) {
      body.blocks = options.blocks;
    }

    try {
      const response = await this.makeRequestWithRetry<SlackMessagePostResponse>('chat.postMessage', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return response;
    } catch (error: any) {
      console.error(`Failed to send message to channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Gets replies to a thread
   *
   * @param channelId - Slack channel ID
   * @param threadTs - Parent message timestamp
   * @param options - Optional parameters
   * @param options.limit - Number of replies to return (default: 50)
   * @param options.cursor - Pagination cursor
   * @returns Promise with thread replies
   *
   * @example
   * const response = await slackClient.getThreadReplies('C1234567890', '1234567890.123456');
   * console.log(`Thread has ${response.messages.length} replies`);
   */
  async getThreadReplies(
    channelId: string,
    threadTs: string,
    options: {
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<SlackMessagesResponse> {
    if (!channelId || !threadTs) {
      throw this.createError('invalid_argument', 'Channel ID and thread timestamp are required');
    }

    const params = new URLSearchParams();
    params.append('channel', channelId);
    params.append('ts', threadTs);
    params.append('limit', String(options.limit || 50));

    if (options.cursor) {
      params.append('cursor', options.cursor);
    }

    const endpoint = `conversations.replies?${params.toString()}`;

    try {
      const response = await this.makeRequestWithRetry<SlackMessagesResponse>(endpoint, {
        method: 'GET',
      });

      return response;
    } catch (error: any) {
      console.error(`Failed to get thread replies for ${threadTs} in channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing message
   *
   * @param channelId - Slack channel ID
   * @param ts - Message timestamp to update
   * @param text - New message text
   * @returns Promise that resolves when message is updated
   *
   * @example
   * await slackClient.updateMessage('C1234567890', '1234567890.123456', 'Updated text');
   */
  async updateMessage(channelId: string, ts: string, text: string): Promise<void> {
    if (!channelId || !ts || !text) {
      throw this.createError('invalid_argument', 'Channel ID, timestamp, and text are required');
    }

    const body = {
      channel: channelId,
      ts,
      text,
    };

    try {
      await this.makeRequestWithRetry<SlackApiResponse>('chat.update', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error: any) {
      console.error(`Failed to update message ${ts} in channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a message
   *
   * @param channelId - Slack channel ID
   * @param ts - Message timestamp to delete
   * @returns Promise that resolves when message is deleted
   *
   * @example
   * await slackClient.deleteMessage('C1234567890', '1234567890.123456');
   */
  async deleteMessage(channelId: string, ts: string): Promise<void> {
    if (!channelId || !ts) {
      throw this.createError('invalid_argument', 'Channel ID and timestamp are required');
    }

    const body = {
      channel: channelId,
      ts,
    };

    try {
      await this.makeRequestWithRetry<SlackApiResponse>('chat.delete', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error: any) {
      console.error(`Failed to delete message ${ts} from channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Adds a reaction emoji to a message
   *
   * @param channelId - Slack channel ID
   * @param ts - Message timestamp
   * @param emoji - Emoji name (without colons, e.g., 'thumbsup', 'rocket')
   * @returns Promise that resolves when reaction is added
   *
   * @example
   * await slackClient.addReaction('C1234567890', '1234567890.123456', 'thumbsup');
   */
  async addReaction(channelId: string, ts: string, emoji: string): Promise<void> {
    if (!channelId || !ts || !emoji) {
      throw this.createError('invalid_argument', 'Channel ID, timestamp, and emoji are required');
    }

    // Remove colons if user included them
    const cleanEmoji = emoji.replace(/:/g, '');

    const body = {
      channel: channelId,
      timestamp: ts,
      name: cleanEmoji,
    };

    try {
      await this.makeRequestWithRetry<SlackApiResponse>('reactions.add', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error: any) {
      console.error(`Failed to add reaction ${emoji} to message ${ts}:`, error);
      throw error;
    }
  }

  /**
   * Removes a reaction from a message
   *
   * @param channelId - Slack channel ID
   * @param ts - Message timestamp
   * @param emoji - Emoji name (without colons)
   * @returns Promise that resolves when reaction is removed
   *
   * @example
   * await slackClient.removeReaction('C1234567890', '1234567890.123456', 'thumbsup');
   */
  async removeReaction(channelId: string, ts: string, emoji: string): Promise<void> {
    if (!channelId || !ts || !emoji) {
      throw this.createError('invalid_argument', 'Channel ID, timestamp, and emoji are required');
    }

    const cleanEmoji = emoji.replace(/:/g, '');

    const body = {
      channel: channelId,
      timestamp: ts,
      name: cleanEmoji,
    };

    try {
      await this.makeRequestWithRetry<SlackApiResponse>('reactions.remove', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error: any) {
      console.error(`Failed to remove reaction ${emoji} from message ${ts}:`, error);
      throw error;
    }
  }

  /**
   * Schedules a message to be posted at a future time
   *
   * @param channelId - Slack channel ID
   * @param text - Message text
   * @param postAt - Unix timestamp when message should be posted
   * @returns Promise with scheduled message ID
   *
   * @example
   * const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
   * const scheduled = await slackClient.scheduleMessage('C1234567890', 'Reminder!', futureTime);
   */
  async scheduleMessage(
    channelId: string,
    text: string,
    postAt: number
  ): Promise<{ scheduled_message_id: string }> {
    if (!channelId || !text || !postAt) {
      throw this.createError('invalid_argument', 'Channel ID, text, and post_at time are required');
    }

    const body = {
      channel: channelId,
      text,
      post_at: postAt,
    };

    try {
      const response = await this.makeRequestWithRetry<{
        ok: boolean;
        scheduled_message_id: string;
      }>('chat.scheduleMessage', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return { scheduled_message_id: response.scheduled_message_id };
    } catch (error: any) {
      console.error(`Failed to schedule message in channel ${channelId}:`, error);
      throw error;
    }
  }

  // =========================================================================
  // PUBLIC API METHODS - USER OPERATIONS
  // =========================================================================

  /**
   * Gets information about a specific user
   *
   * @param userId - Slack user ID
   * @returns Promise with user details
   *
   * @example
   * const user = await slackClient.getUserInfo('U1234567890');
   * console.log(`User: ${user.real_name} (${user.profile.email})`);
   */
  async getUserInfo(userId: string): Promise<SlackUser> {
    if (!userId) {
      throw this.createError('invalid_argument', 'User ID is required');
    }

    const params = new URLSearchParams();
    params.append('user', userId);

    const endpoint = `users.info?${params.toString()}`;

    try {
      const response = await this.makeRequestWithRetry<{ ok: boolean; user: SlackUser }>(endpoint, {
        method: 'GET',
      });

      return response.user;
    } catch (error: any) {
      console.error(`Failed to get info for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Lists all users in the workspace
   *
   * @param options - Optional parameters
   * @param options.limit - Number of users to return (default: 100)
   * @param options.cursor - Pagination cursor
   * @returns Promise with list of users
   *
   * @example
   * const response = await slackClient.listUsers({ limit: 100 });
   * console.log(`Found ${response.members.length} users`);
   */
  async listUsers(options: {
    limit?: number;
    cursor?: string;
  } = {}): Promise<{ members: SlackUser[]; response_metadata?: { next_cursor: string } }> {
    const params = new URLSearchParams();
    params.append('limit', String(options.limit || 100));

    if (options.cursor) {
      params.append('cursor', options.cursor);
    }

    const endpoint = `users.list?${params.toString()}`;

    try {
      const response = await this.makeRequestWithRetry<{
        ok: boolean;
        members: SlackUser[];
        response_metadata?: { next_cursor: string };
      }>(endpoint, {
        method: 'GET',
      });

      return {
        members: response.members,
        response_metadata: response.response_metadata,
      };
    } catch (error: any) {
      console.error('Failed to list Slack users:', error);
      throw error;
    }
  }

  // =========================================================================
  // PUBLIC API METHODS - SEARCH OPERATIONS
  // =========================================================================

  /**
   * Searches for messages across all channels
   *
   * @param query - Search query (supports Slack search syntax)
   * @param options - Optional parameters
   * @param options.count - Number of results to return (default: 20, max: 100)
   * @param options.page - Page number for pagination (default: 1)
   * @param options.sort - Sort order: 'score' or 'timestamp' (default: 'score')
   * @param options.sortDir - Sort direction: 'asc' or 'desc' (default: 'desc')
   * @returns Promise with search results
   *
   * @example
   * const results = await slackClient.searchMessages('from:@john urgent', { count: 20 });
   * console.log(`Found ${results.messages.total} messages`);
   */
  async searchMessages(
    query: string,
    options: {
      count?: number;
      page?: number;
      sort?: 'score' | 'timestamp';
      sortDir?: 'asc' | 'desc';
    } = {}
  ): Promise<SlackSearchResponse> {
    if (!query) {
      throw this.createError('invalid_argument', 'Search query is required');
    }

    const params = new URLSearchParams();
    params.append('query', query);
    params.append('count', String(options.count || 20));
    params.append('page', String(options.page || 1));

    if (options.sort) {
      params.append('sort', options.sort);
    }
    if (options.sortDir) {
      params.append('sort_dir', options.sortDir);
    }

    const endpoint = `search.messages?${params.toString()}`;

    try {
      const response = await this.makeRequestWithRetry<SlackSearchResponse>(endpoint, {
        method: 'GET',
      });

      return response;
    } catch (error: any) {
      console.error(`Failed to search messages for query "${query}":`, error);
      throw error;
    }
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Converts Unix timestamp to human-readable date
   * @param ts - Unix timestamp (seconds)
   * @returns Formatted date string
   */
  static formatTimestamp(ts: string | number): string {
    const timestamp = typeof ts === 'string' ? parseFloat(ts) : ts;
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  }

  /**
   * Extracts channel ID from a Slack permalink
   * @param permalink - Slack message permalink
   * @returns Channel ID or null
   */
  static extractChannelIdFromPermalink(permalink: string): string | null {
    const match = permalink.match(/\/archives\/([A-Z0-9]+)\//);
    return match ? match[1] : null;
  }

  /**
   * Sanitizes channel name to meet Slack requirements
   * @param name - Proposed channel name
   * @returns Sanitized channel name
   */
  static sanitizeChannelName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-') // Replace invalid chars with hyphens
      .replace(/-+/g, '-') // Remove consecutive hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 80); // Enforce max length
  }

  /**
   * Checks if a Slack error indicates the bot needs to be invited to a channel
   * @param error - SlackError object
   * @returns True if bot needs invitation
   */
  static needsInvite(error: SlackError): boolean {
    return error.code === SLACK_ERROR_CODES.NOT_IN_CHANNEL;
  }

  /**
   * Checks if a Slack error is related to authentication
   * @param error - SlackError object
   * @returns True if auth error
   */
  static isAuthError(error: SlackError): boolean {
    return [
      SLACK_ERROR_CODES.NOT_AUTHED,
      SLACK_ERROR_CODES.INVALID_AUTH,
      SLACK_ERROR_CODES.TOKEN_REVOKED,
    ].includes(error.code as any);
  }
}

export default SlackClient;
