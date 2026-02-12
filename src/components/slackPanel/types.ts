/**
 * Type definitions for SlackPanel components
 */

import { APIClient } from '../../brideDesignPattern/apiInterface';

export type SidebarView = 'home' | 'dms' | 'activity' | 'drafts' | 'channels';

export type CenterPanelContentType =
  | 'message'
  | 'channel'
  | 'activity'
  | 'compose'
  | 'empty';

export interface CenterPanelContent {
  type: CenterPanelContentType;
  data?: any;
}

export interface RightPanelContent {
  type: 'thread' | 'details' | 'empty';
  data?: any;
}

export interface SlackChannel {
  id: string;
  name: string;
  type: 'dm' | 'group-dm' | 'public' | 'private';
  messages: any[];
  unread: number;
  user?: {
    id: string;
    name: string;
    image: string;
  } | null;
  is_private?: boolean;
  is_member?: boolean;
  is_im?: boolean;
  is_mpim?: boolean;
  user_profile?: {
    real_name?: string;
    display_name?: string;
  };
  num_members?: number;
}

export interface ViewItemClickHandler {
  (contentType: CenterPanelContentType, data?: any): void;
}

export interface BaseViewProps {
  onItemClick: ViewItemClickHandler;
  apiClient: APIClient;
}
