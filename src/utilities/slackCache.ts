import { prettyPrint } from './prettyPrint';
import { APIClient } from '../brideDesignPattern/apiInterface';

/**
 * Advanced caching utility for Slack API responses
 * Helps avoid hitting rate limits by:
 * - Caching frequently accessed, slowly changing data
 * - Throttling parallel requests in batches
 * - Providing batch fetch operations
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class SlackCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  // Throttling configuration
  private readonly MAX_PARALLEL_REQUESTS = 3;
  private readonly BATCH_DELAY_MS = 100;

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data with a TTL (time to live) in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    });
  }

  /**
   * Clear a specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear all cache entries matching a pattern
   */
  clearPattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get channel info with caching
   */
  async getChannelInfo(channelId: string, apiClient: APIClient): Promise<any> {
    const cacheKey = `channel_info:${channelId}`;

    // Check cache first
    const cached = this.get(cacheKey);
    if (cached) {
      prettyPrint(`[SlackCache] Channel info cache HIT: ${channelId}`, null, 'green');
      return cached;
    }

    // Cache miss - fetch from API
    prettyPrint(`[SlackCache] Channel info cache MISS: ${channelId}`, null, 'yellow');

    try {
      const response = await apiClient.slackGetConversationInfo({ channel: channelId });
      const data = typeof response === 'string' ? JSON.parse(response) : response;

      // Cache the result
      this.set(cacheKey, data, CACHE_TTL.CHANNEL_INFO);

      return data;
    } catch (error) {
      prettyPrint(`[SlackCache] Error fetching channel info for ${channelId}:`, error, 'red');
      throw error;
    }
  }

  /**
   * Get multiple channel infos with throttled parallel requests
   * This is the key optimization for HomeView
   */
  async getChannelInfoBatch(
    channelIds: string[],
    apiClient: APIClient
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    // Check cache for all channels first
    const uncachedChannelIds: string[] = [];

    for (const channelId of channelIds) {
      const cacheKey = `channel_info:${channelId}`;
      const cached = this.get(cacheKey);

      if (cached) {
        results.set(channelId, cached);
        prettyPrint(`[SlackCache] Batch cache HIT: ${channelId}`, null, 'green');
      } else {
        uncachedChannelIds.push(channelId);
      }
    }

    if (uncachedChannelIds.length === 0) {
      prettyPrint('[SlackCache] All channels found in cache!', null, 'green');
      return results;
    }

    prettyPrint(
      `[SlackCache] Fetching ${uncachedChannelIds.length} uncached channels in batches of ${this.MAX_PARALLEL_REQUESTS}`,
      null,
      'cyan'
    );

    // Fetch uncached channels in throttled batches
    for (let i = 0; i < uncachedChannelIds.length; i += this.MAX_PARALLEL_REQUESTS) {
      const batch = uncachedChannelIds.slice(i, i + this.MAX_PARALLEL_REQUESTS);

      prettyPrint(
        `[SlackCache] Fetching batch ${Math.floor(i / this.MAX_PARALLEL_REQUESTS) + 1}: ${batch.join(', ')}`,
        null,
        'cyan'
      );

      // Fetch batch in parallel
      const batchPromises = batch.map(channelId => this.getChannelInfo(channelId, apiClient));

      try {
        const batchResults = await Promise.all(batchPromises);

        // Add results to map
        batch.forEach((channelId, index) => {
          results.set(channelId, batchResults[index]);
        });
      } catch (error) {
        prettyPrint(`[SlackCache] Error in batch fetch:`, error, 'red');
        // Continue with next batch even if this one fails
      }

      // Delay between batches to avoid burst rate limiting
      if (i + this.MAX_PARALLEL_REQUESTS < uncachedChannelIds.length) {
        await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY_MS));
      }
    }

    return results;
  }

  /**
   * Get conversation history with caching
   */
  async getConversationHistory(channelId: string, apiClient: APIClient, limit = 20): Promise<any> {
    const cacheKey = `channel_history:${channelId}_${limit}`;

    // Check cache
    const cached = this.get(cacheKey);
    if (cached) {
      prettyPrint(`[SlackCache] Conversation history cache HIT: ${channelId}`, null, 'green');
      return cached;
    }

    // Cache miss - fetch from API
    prettyPrint(`[SlackCache] Conversation history cache MISS: ${channelId}`, null, 'yellow');

    try {
      const response = await apiClient.slackGetConversationHistory({
        channel: channelId,
        limit,
      });
      const data = typeof response === 'string' ? JSON.parse(response) : response;

      // Cache the result
      this.set(cacheKey, data, CACHE_TTL.CHANNEL_HISTORY);

      return data;
    } catch (error) {
      prettyPrint(`[SlackCache] Error fetching conversation history for ${channelId}:`, error, 'red');
      throw error;
    }
  }

  /**
   * Get search results with caching
   */
  async getSearchResults(query: string, apiClient: APIClient, count: number = 20): Promise<any> {
    const cacheKey = `search:${query}_${count}`;

    // Check cache
    const cached = this.get(cacheKey);
    if (cached) {
      prettyPrint(`[SlackCache] Search results cache HIT: ${query}`, null, 'green');
      return cached;
    }

    // Cache miss - fetch from API
    prettyPrint(`[SlackCache] Search results cache MISS: ${query}`, null, 'yellow');

    try {
      const response = await apiClient.slackSearchMessages({
        query,
        count,
        sort: 'timestamp',
        sort_dir: 'desc'
      });
      const data = typeof response === 'string' ? JSON.parse(response) : response;

      // Cache the result
      this.set(cacheKey, data, CACHE_TTL.SEARCH_RESULTS);

      return data;
    } catch (error) {
      prettyPrint(`[SlackCache] Error searching messages for ${query}:`, error, 'red');
      throw error;
    }
  }

  /**
   * Get channel links with caching
   */
  async getChannelLinks(recordId: string, apiClient: APIClient): Promise<any> {
    const cacheKey = `channel_links:${recordId}`;

    // Check cache
    const cached = this.get(cacheKey);
    if (cached) {
      prettyPrint(`[SlackCache] Channel links cache HIT: ${recordId}`, null, 'green');
      return cached;
    }

    // Cache miss - fetch from API
    prettyPrint(`[SlackCache] Channel links cache MISS: ${recordId}`, null, 'yellow');

    try {
      const response = await apiClient.slackGetChannelLinks({ recordId });
      const data = typeof response === 'string' ? JSON.parse(response) : response;

      // Cache the result
      this.set(cacheKey, data, CACHE_TTL.CHANNEL_INFO);

      return data;
    } catch (error) {
      prettyPrint(`[SlackCache] Error fetching channel links for ${recordId}:`, error, 'red');
      throw error;
    }
  }

  /**
   * Invalidate channel-specific caches (call after posting a message)
   */
  invalidateChannel(channelId: string): void {
    this.delete(`channel_info:${channelId}`);
    this.clearPattern(`^channel_history:${channelId}`);
    prettyPrint(`[SlackCache] Invalidated caches for channel: ${channelId}`, null, 'magenta');
  }

  /**
   * Invalidate record-specific caches
   */
  invalidateRecord(recordId: string): void {
    this.delete(`channel_links:${recordId}`);
    this.clearPattern(`^search:${recordId}`);
    prettyPrint(`[SlackCache] Invalidated caches for record: ${recordId}`, null, 'magenta');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {
      totalEntries: this.cache.size,
      byType: {
        channelInfo: 0,
        channelHistory: 0,
        search: 0,
        channelLinks: 0,
        other: 0,
      },
    };

    this.cache.forEach((_, key) => {
      if (key.startsWith('channel_info:')) stats.byType.channelInfo++;
      else if (key.startsWith('channel_history:')) stats.byType.channelHistory++;
      else if (key.startsWith('search:')) stats.byType.search++;
      else if (key.startsWith('channel_links:')) stats.byType.channelLinks++;
      else stats.byType.other++;
    });

    return stats;
  }
}

// Export singleton instance
export const slackCache = new SlackCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  AUTH_TEST: 30 * 60 * 1000, // 30 minutes - auth rarely changes
  USERS_LIST: 10 * 60 * 1000, // 10 minutes - users rarely change
  CHANNELS_LIST: 5 * 60 * 1000, // 5 minutes - channels change occasionally
  CHANNEL_INFO: 5 * 60 * 1000, // 5 minutes - channel metadata rarely changes
  CHANNEL_HISTORY: 5 * 60 * 1000, // 5 minutes - messages cached longer, invalidated on operations
  SEARCH_RESULTS: 5 * 60 * 1000, // 5 minutes - search results cached longer, invalidated on operations
};
