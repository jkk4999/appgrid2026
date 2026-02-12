/**
 * Type definitions for Slack integration
 * Based on Slack Web API documentation
 */

// ============================================================================
// Slack Channel Types
// ============================================================================

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  created: number;
  is_archived: boolean;
  is_general: boolean;
  unlinked: number;
  name_normalized: string;
  is_shared: boolean;
  is_org_shared: boolean;
  is_member: boolean;
  is_pending_ext_shared: boolean;
  pending_connected_team_ids?: string[];
  context_team_id?: string;
  updated: number;
  parent_conversation?: string | null;
  creator: string;
  is_ext_shared: boolean;
  shared_team_ids?: string[];
  pending_shared?: string[];
  is_moved?: number;
  topic?: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose?: {
    value: string;
    creator: string;
    last_set: number;
  };
  num_members?: number;
}

// ============================================================================
// Slack Message Types
// ============================================================================

export interface SlackMessage {
  type: 'message';
  subtype?: string;
  text: string;
  ts: string;
  user?: string;
  bot_id?: string;
  app_id?: string;
  team?: string;
  thread_ts?: string;
  parent_user_id?: string;
  reply_count?: number;
  reply_users_count?: number;
  latest_reply?: string;
  reply_users?: string[];
  subscribed?: boolean;
  last_read?: string;
  unread_count?: number;
  reactions?: SlackReaction[];
  edited?: {
    user: string;
    ts: string;
  };
  is_starred?: boolean;
  pinned_to?: string[];
  pinned_info?: {
    channel: string;
    pinned_by: string;
    pinned_ts: number;
  };
  files?: SlackFile[];
  attachments?: SlackAttachment[];
  blocks?: SlackBlock[];
}

export interface SlackReaction {
  name: string;
  users: string[];
  count: number;
}

export interface SlackFile {
  id: string;
  created: number;
  timestamp: number;
  name: string;
  title: string;
  mimetype: string;
  filetype: string;
  pretty_type: string;
  user: string;
  mode: string;
  editable: boolean;
  is_external: boolean;
  external_type: string;
  username?: string;
  size: number;
  url_private: string;
  url_private_download: string;
  thumb_64?: string;
  thumb_80?: string;
  thumb_360?: string;
  thumb_360_w?: number;
  thumb_360_h?: number;
  thumb_480?: string;
  thumb_480_w?: number;
  thumb_480_h?: number;
  thumb_160?: string;
  thumb_720?: string;
  thumb_800?: string;
  thumb_960?: string;
  thumb_1024?: string;
  permalink: string;
  permalink_public?: string;
  edit_link?: string;
  preview?: string;
  preview_highlight?: string;
  lines?: number;
  lines_more?: number;
  preview_is_truncated?: boolean;
  is_public: boolean;
  public_url_shared: boolean;
  display_as_bot: boolean;
  channels?: string[];
  groups?: string[];
  ims?: string[];
  has_rich_preview?: boolean;
}

export interface SlackAttachment {
  id?: number;
  color?: string;
  fallback?: string;
  text?: string;
  title?: string;
  title_link?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  ts?: number;
  fields?: {
    title: string;
    value: string;
    short?: boolean;
  }[];
  actions?: any[];
  mrkdwn_in?: string[];
}

export interface SlackBlock {
  type: string;
  block_id?: string;
  elements?: any[];
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
    verbatim?: boolean;
  };
  accessory?: any;
  fields?: any[];
}

// ============================================================================
// Slack User Types
// ============================================================================

export interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  color: string;
  real_name: string;
  tz: string;
  tz_label: string;
  tz_offset: number;
  profile: SlackUserProfile;
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_bot: boolean;
  is_app_user: boolean;
  updated: number;
  has_2fa?: boolean;
}

export interface SlackUserProfile {
  title: string;
  phone: string;
  skype: string;
  real_name: string;
  real_name_normalized: string;
  display_name: string;
  display_name_normalized: string;
  fields: any;
  status_text: string;
  status_emoji: string;
  status_expiration: number;
  avatar_hash: string;
  image_original?: string;
  is_custom_image?: boolean;
  email?: string;
  first_name?: string;
  last_name?: string;
  image_24: string;
  image_32: string;
  image_48: string;
  image_72: string;
  image_192: string;
  image_512: string;
  image_1024?: string;
  status_text_canonical: string;
  team: string;
}

// ============================================================================
// Slack API Response Types
// ============================================================================

export interface SlackApiResponse<T = any> {
  ok: boolean;
  error?: string;
  warning?: string;
  response_metadata?: {
    next_cursor?: string;
    warnings?: string[];
  };
  data?: T;
}

export interface SlackChannelsListResponse extends SlackApiResponse {
  channels: SlackChannel[];
  response_metadata?: {
    next_cursor: string;
  };
}

export interface SlackMessagesResponse extends SlackApiResponse {
  messages: SlackMessage[];
  has_more: boolean;
  pin_count?: number;
  channel_actions_ts?: string | null;
  channel_actions_count?: number;
  response_metadata?: {
    next_cursor: string;
  };
}

export interface SlackMessagePostResponse extends SlackApiResponse {
  channel: string;
  ts: string;
  message: SlackMessage;
}

export interface SlackSearchResponse extends SlackApiResponse {
  query: string;
  messages?: {
    total: number;
    pagination: {
      total_count: number;
      page: number;
      per_page: number;
      page_count: number;
      first: number;
      last: number;
    };
    paging: {
      count: number;
      total: number;
      page: number;
      pages: number;
    };
    matches: SlackSearchMatch[];
  };
}

export interface SlackSearchMatch extends SlackMessage {
  iid: string;
  channel: {
    id: string;
    is_ext_shared?: boolean;
    is_mpim: boolean;
    is_org_shared: boolean;
    is_pending_ext_shared: boolean;
    is_private: boolean;
    is_shared: boolean;
    name: string;
    name_normalized?: string;
    pending_shared?: string[];
    team?: string;
    user?: string;
  };
  permalink: string;
  previous?: SlackMessage;
  previous_2?: SlackMessage;
  next?: SlackMessage;
  next_2?: SlackMessage;
  score?: number;
}

export interface SlackAuthTestResponse extends SlackApiResponse {
  url: string;
  team: string;
  user: string;
  team_id: string;
  user_id: string;
  bot_id?: string;
  is_enterprise_install?: boolean;
}

// ============================================================================
// AppGrid Slack Configuration Types (Salesforce)
// Object Names: AppGridAg__Ag_Slack_Config__c, AppGridAg__Ag_Slack_Object_Config__c, AppGridAg__Ag_Slack_Channel_Link__c
// ============================================================================

export interface SlackConfig {
  Id?: string;
  Name: string;
  AppGridAg__Bot_Token__c: string;
  AppGridAg__Workspace_Id__c: string;
  AppGridAg__Workspace_Name__c: string;
  AppGridAg__Is_Active__c: boolean;
  AppGridAg__Default_Channel_Prefix__c: string;
  AppGridAg__Last_Tested__c?: string;
}

export interface SlackObjectConfig {
  Id?: string;
  Name: string;
  AppGridAg__Object_API_Name__c: string;
  AppGridAg__Object_Label__c: string;
  AppGridAg__Enabled__c: boolean;
  AppGridAg__Auto_Create_Channels__c: boolean;
  AppGridAg__Channel_Naming_Pattern__c: string;
  AppGridAg__Ag_Slack_Config__c: string; // Lookup to AppGridAg__Ag_Slack_Config__c
}

/**
 * Junction object linking Salesforce records to Slack channels
 * Object: AppGridAg__Ag_Slack_Channel_Link__c
 * This allows any Salesforce record to be linked to one or more Slack channels
 * without modifying the source object's schema
 */
export interface SlackChannelLink {
  Id?: string;
  Name?: string; // Auto-number field (SCL-00001)
  AppGridAg__Salesforce_Record_Id__c: string; // 18-char SF record ID
  AppGridAg__Salesforce_Object_Type__c: string; // Object API name (e.g., "Account")
  AppGridAg__Record_Name__c?: string; // Human-readable record name
  AppGridAg__Slack_Channel_Id__c: string; // Slack channel ID (e.g., C1234567890)
  AppGridAg__Slack_Channel_Name__c?: string; // Human-readable channel name
  AppGridAg__Is_Primary__c: boolean; // Is this the primary channel for the record?
  AppGridAg__Link_Type__c: 'Auto-Created' | 'Manually Linked' | 'System';
  AppGridAg__Created_By_Integration__c: boolean;
  AppGridAg__Active__c: boolean;
  CreatedDate?: string;
  CreatedById?: string;
  LastModifiedDate?: string;
  LastModifiedById?: string;
}

// Salesforce Object API Names (constants for queries)
export const SLACK_OBJECTS = {
  CONFIG: 'AppGridAg__Ag_Slack_Config__c',
  OBJECT_CONFIG: 'AppGridAg__Ag_Slack_Object_Config__c',
  CHANNEL_LINK: 'AppGridAg__Ag_Slack_Channel_Link__c',
} as const;

// ============================================================================
// Component Props Types
// ============================================================================

export interface SlackViewProps {
  apiClient: any;
  relation: any;
  parentRow: Record<string, any>;
  isActive: boolean;
}

export interface SlackChannelListProps {
  channels: SlackChannel[];
  selectedChannel: SlackChannel | null;
  onChannelSelect: (channel: SlackChannel) => void;
  onCreateChannel: () => void;
  loading: boolean;
}

export interface SlackMessagePanelProps {
  channel: SlackChannel | null;
  messages: SlackMessage[];
  users: Map<string, SlackUser>;
  onSendMessage: (text: string, threadTs?: string) => Promise<void>;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  onThreadClick: (message: SlackMessage) => void;
}

export interface SlackMessageComposerProps {
  onSend: (text: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  threadTs?: string;
}

export interface SlackThreadPanelProps {
  message: SlackMessage | null;
  replies: SlackMessage[];
  users: Map<string, SlackUser>;
  onClose: () => void;
  onSendReply: (text: string) => Promise<void>;
  loading: boolean;
}

export interface SlackSearchPanelProps {
  onClose: () => void;
  onMessageClick: (message: SlackSearchMatch) => void;
}

export interface SlackChannelCreatorProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, isPrivate: boolean, topic?: string) => Promise<void>;
  suggestedName?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface SlackError {
  code: string;
  message: string;
  statusCode?: number;
  retryAfter?: number;
}

export interface SlackLoadingState {
  channels: boolean;
  messages: boolean;
  users: boolean;
  sending: boolean;
  creating: boolean;
  searching: boolean;
}

export interface SlackPagination {
  cursor?: string;
  hasMore: boolean;
  limit: number;
}

// ============================================================================
// Constants
// ============================================================================

export const SLACK_MESSAGE_LIMIT = 50;
export const SLACK_CHANNEL_LIMIT = 200;
export const SLACK_SEARCH_LIMIT = 100;
export const SLACK_POLL_INTERVAL = 5000; // 5 seconds

export const SLACK_ERROR_CODES = {
  NOT_AUTHED: 'not_authed',
  INVALID_AUTH: 'invalid_auth',
  ACCOUNT_INACTIVE: 'account_inactive',
  TOKEN_REVOKED: 'token_revoked',
  NO_PERMISSION: 'no_permission',
  ORG_LOGIN_REQUIRED: 'org_login_required',
  EKMT_PW_CHANGE_REQUIRED: 'ekm_access_denied',
  NOT_IN_CHANNEL: 'not_in_channel',
  IS_ARCHIVED: 'is_archived',
  CHANNEL_NOT_FOUND: 'channel_not_found',
  RATE_LIMITED: 'ratelimited',
  CANT_CREATE_CHANNEL: 'cant_create_channel',
  NAME_TAKEN: 'name_taken',
  INVALID_NAME: 'invalid_name',
  INVALID_NAME_REQUIRED: 'invalid_name_required',
  INVALID_NAME_PUNCTUATION: 'invalid_name_punctuation',
  INVALID_NAME_MAXLENGTH: 'invalid_name_maxlength',
  INVALID_NAME_SPECIALS: 'invalid_name_specials',
} as const;

export type SlackErrorCode = typeof SLACK_ERROR_CODES[keyof typeof SLACK_ERROR_CODES];
