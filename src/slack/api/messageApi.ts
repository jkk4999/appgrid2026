/**
 * Message API
 * Handles Slack message operations
 */

import { APIClient } from '../../brideDesignPattern/apiInterface';
import { prettyPrint } from '../../utilities/prettyPrint';
import { retryWithBackoff, RetryOptions } from '../../utilities/slackRetry';

export interface SlackFile {
  id: string;
  name: string;
  mimetype: string;
  filetype: string;
  size: number;
  url_private: string;
  url_private_download: string;
  thumb_360?: string;
  thumb_480?: string;
  thumb_800?: string;
  permalink: string;
  preview?: string;
}

export interface SlackMessage {
  type: string;
  user?: string;
  text: string;
  ts: string;
  thread_ts?: string;
  bot_id?: string;
  blocks?: any[];
  files?: SlackFile[];
}

export interface ConversationHistoryResult {
  ok: boolean;
  messages: SlackMessage[];
  has_more: boolean;
  error?: string;
}

export interface SearchResult {
  ok: boolean;
  messages?: {
    matches: Array<{
      channel: { id: string; name?: string };
      text: string;
      ts: string;
      user?: string;
    }>;
  };
  error?: string;
}

/**
 * Get conversation history for a channel
 */
export async function getConversationHistory(
  apiClient: APIClient,
  channelId: string,
  limit: number = 20,
  retryOptions?: RetryOptions,
  cancelToken?: { cancelled: boolean }
): Promise<SlackMessage[]> {
  prettyPrint(`[messageApi] Getting conversation history: ${channelId} (limit: ${limit})`, null, 'blue');

  return retryWithBackoff(
    async () => {
      const response = await apiClient.slackGetConversationHistory({
        channel: channelId,
        limit
      });
      const data: ConversationHistoryResult =
        typeof response === 'string' ? JSON.parse(response) : response;

      if (!data.ok) {
        throw new Error(data.error || 'Failed to get conversation history');
      }

      prettyPrint(`[messageApi] Found ${data.messages.length} messages`, null, 'green');
      return data.messages;
    },
    retryOptions,
    cancelToken
  );
}

/**
 * Search for messages containing a query
 */
export async function searchMessages(
  apiClient: APIClient,
  query: string,
  count: number = 100,
  retryOptions?: RetryOptions,
  cancelToken?: { cancelled: boolean }
): Promise<SearchResult> {
  prettyPrint(`[messageApi] Searching messages: "${query}" (count: ${count})`, null, 'blue');

  return retryWithBackoff(
    async () => {
      const response = await apiClient.slackSearchMessages({
        query,
        count,
        sort: 'timestamp',
        sort_dir: 'desc'
      });
      const data: SearchResult = typeof response === 'string' ? JSON.parse(response) : response;

      if (!data.ok) {
        throw new Error(data.error || 'Failed to search messages');
      }

      const matchCount = data.messages?.matches?.length || 0;
      prettyPrint(`[messageApi] Found ${matchCount} matching messages`, null, 'green');

      return data;
    },
    retryOptions,
    cancelToken
  );
}

/**
 * Post a message to a channel
 */
export async function postMessage(
  apiClient: APIClient,
  channelId: string,
  text: string,
  retryOptions?: RetryOptions,
  cancelToken?: { cancelled: boolean }
): Promise<void> {
  prettyPrint(`[messageApi] Posting message to: ${channelId}`, { text }, 'blue');

  return retryWithBackoff(
    async () => {
      const params: any = {
        channel: channelId,
        text
      };

      const response = await apiClient.slackPostMessage(params);
      const data = typeof response === 'string' ? JSON.parse(response) : response;

      if (!data.ok) {
        throw new Error(data.error || 'Failed to post message');
      }

      prettyPrint('[messageApi] Message posted successfully', null, 'green');
    },
    retryOptions,
    cancelToken
  );
}

/**
 * Update an existing message
 */
export async function updateMessage(
  apiClient: APIClient,
  channelId: string,
  ts: string,
  text: string
): Promise<void> {
  prettyPrint(`[messageApi] Updating message: ${channelId}/${ts}`, null, 'blue');

  const response = await apiClient.slackUpdateMessage({
    channel: channelId,
    ts,
    text,
    blocks: null,
  });
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  if (!data.ok) {
    throw new Error(data.error || 'Failed to update message');
  }

  prettyPrint('[messageApi] Message updated successfully', null, 'green');
}

/**
 * Delete a message
 */
export async function deleteMessage(
  apiClient: APIClient,
  channelId: string,
  ts: string
): Promise<void> {
  prettyPrint(`[messageApi] Deleting message: ${channelId}/${ts}`, null, 'blue');

  const response = await apiClient.slackDeleteMessage({
    channel: channelId,
    ts,
  });
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  if (!data.ok) {
    throw new Error(data.error || 'Failed to delete message');
  }

  prettyPrint('[messageApi] Message deleted successfully', null, 'green');
}

/**
 * Upload a file to Slack
 */
export async function uploadFile(
  apiClient: APIClient,
  file: File,
  channelId?: string,
  initialComment?: string
): Promise<SlackFile> {
  prettyPrint(`[messageApi] Uploading file: ${file.name} (${file.size} bytes)`, null, 'blue');

  // Convert file to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const response = await apiClient.slackUploadFileUsingConfig({
    filename: file.name,
    filetype: file.type,
    content: base64,
    channels: channelId,
    initial_comment: initialComment,
  });
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  if (!data.ok) {
    throw new Error(data.error || 'Failed to upload file');
  }

  // files.completeUploadExternal returns different structure:
  // - With channel: { ok: true, file: {...} }
  // - Without channel: { ok: true, files: [{...}] }
  const uploadedFile = data.file || (data.files && data.files[0]);

  if (!uploadedFile) {
    throw new Error('No file information in upload response');
  }

  prettyPrint('[messageApi] File uploaded successfully', uploadedFile, 'green');
  return uploadedFile;
}

/**
 * Post a message with file attachments
 * NOTE: This uses files.completeUploadExternal with initial_comment
 * The initial_comment does NOT support rich text formatting (bold, italic, etc.)
 * Only plain text is supported when attaching files
 * Returns the uploaded files data for immediate UI update
 */
export async function postMessageWithFiles(
  apiClient: APIClient,
  channelId: string,
  text: string,
  files: File[]
): Promise<SlackFile[]> {
  prettyPrint(`[messageApi] Posting message with ${files.length} file(s) to: ${channelId}`, null, 'blue');

  const uploadedFiles: SlackFile[] = [];

  // Upload first file WITH channelId and initial_comment (creates the message)
  // Upload remaining files WITH channelId but WITHOUT initial_comment (adds to same thread)
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      // Only add text comment to the FIRST file to avoid duplicate messages
      const comment = i === 0 ? text : undefined;
      const uploadedFile = await uploadFile(apiClient, file, channelId, comment);
      uploadedFiles.push(uploadedFile);
      prettyPrint(`[messageApi] File uploaded and shared: ${file.name}`, null, 'green');
    } catch (err) {
      prettyPrint(`[messageApi] Failed to upload file: ${file.name}`, err, 'red');
      throw err;
    }
  }

  prettyPrint('[messageApi] Message with files posted successfully', uploadedFiles, 'green');
  return uploadedFiles;
}
