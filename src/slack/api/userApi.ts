/**
 * User API
 * Handles Slack user operations
 */

import { APIClient } from '../../brideDesignPattern/apiInterface';
import { prettyPrint } from '../../utilities/prettyPrint';

export interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  real_name: string;
  profile: {
    real_name: string;
    display_name: string;
    email?: string;
    image_24?: string;
    image_32?: string;
    image_48?: string;
    image_72?: string;
  };
}

export interface UsersListResult {
  ok: boolean;
  members: SlackUser[];
  error?: string;
}

/**
 * List all users in the workspace
 */
export async function listUsers(apiClient: APIClient): Promise<SlackUser[]> {
  prettyPrint('[userApi] Listing users', null, 'blue');

  const response = await apiClient.slackListUsers();
  const data: UsersListResult = typeof response === 'string' ? JSON.parse(response) : response;

  if (!data.ok) {
    throw new Error(data.error || 'Failed to list users');
  }

  prettyPrint(`[userApi] Found ${data.members.length} users`, null, 'green');
  return data.members;
}

/**
 * Get user profile by user ID
 */
export async function getUserProfile(apiClient: APIClient, userId: string): Promise<SlackUser> {
  prettyPrint(`[userApi] Getting user profile: ${userId}`, null, 'blue');

  const response = await apiClient.slackGetUserProfile({ user: userId });
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  if (!data.ok) {
    throw new Error(data.error || 'Failed to get user profile');
  }

  return data.profile;
}
