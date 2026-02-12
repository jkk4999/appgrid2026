/**
 * Query Sharing Slice
 *
 * Manages state for team query sharing feature including shared queries,
 * dialogs, and pending updates.
 */

import { createSliceWithSetters } from '../createSlice';
import type { SharedQueryDTO } from '../../sObjectMetadataTypes';

// ============================================================
// TYPES
// ============================================================

/** User info for share dialog */
export interface ShareableUser {
  id: string;
  name: string;
  profileId: string;
  profileName: string;
  isSelected: boolean;
  isCurrentlyShared: boolean;
}

// ============================================================
// INITIAL STATE
// ============================================================

const querySharingState = {
  // Shared queries received from others
  sharedWithMeQueries: [] as SharedQueryDTO[],
  sharedWithMeQueriesLoading: false,

  // Share Query Dialog state
  showShareQueryDialog: false,
  shareQueryDialogQueryId: null as string | null,
  shareQueryDialogQueryName: null as string | null,
  shareQueryDialogRecipients: [] as SharedQueryDTO[],
  shareQueryDialogRecipientsLoading: false,
  shareQueryDialogUsers: [] as ShareableUser[],
  shareQueryDialogUsersLoading: false,
  shareQueryDialogProfileFilter: null as string | null,

  // Import Query Dialog state
  showImportQueryDialog: false,
  importDialogSharedQuery: null as SharedQueryDTO | null,

  // Pending updates notification
  pendingQueryUpdates: [] as SharedQueryDTO[],
  pendingQueryUpdatesNotificationShown: false,

  // Filter for "Shared With Me" tab
  sharedByUserQueryFilter: null as string | null,
};

// ============================================================
// SLICE CREATOR
// ============================================================

export const createQuerySharingSlice = createSliceWithSetters(querySharingState, (set, get) => ({
  // Custom action to open share dialog with query info
  openShareQueryDialog: (queryId: string, queryName: string) =>
    set({
      showShareQueryDialog: true,
      shareQueryDialogQueryId: queryId,
      shareQueryDialogQueryName: queryName,
      shareQueryDialogRecipients: [],
      shareQueryDialogUsers: [],
      shareQueryDialogProfileFilter: null,
    }),

  // Custom action to close share dialog and reset state
  closeShareQueryDialog: () =>
    set({
      showShareQueryDialog: false,
      shareQueryDialogQueryId: null,
      shareQueryDialogQueryName: null,
      shareQueryDialogRecipients: [],
      shareQueryDialogUsers: [],
      shareQueryDialogProfileFilter: null,
      shareQueryDialogRecipientsLoading: false,
      shareQueryDialogUsersLoading: false,
    }),

  // Custom action to open import dialog
  openImportQueryDialog: (sharedQuery: SharedQueryDTO) =>
    set({
      showImportQueryDialog: true,
      importDialogSharedQuery: sharedQuery,
    }),

  // Custom action to close import dialog
  closeImportQueryDialog: () =>
    set({
      showImportQueryDialog: false,
      importDialogSharedQuery: null,
    }),

  // Custom action to update user selection in share dialog
  toggleShareQueryDialogUserSelection: (userId: string) => {
    const currentUsers = get().shareQueryDialogUsers as ShareableUser[];
    const updatedUsers = currentUsers.map((user) =>
      user.id === userId ? { ...user, isSelected: !user.isSelected } : user
    );
    set({ shareQueryDialogUsers: updatedUsers });
  },

  // Custom action to select all users in share dialog
  selectAllShareQueryDialogUsers: () => {
    const currentUsers = get().shareQueryDialogUsers as ShareableUser[];
    const updatedUsers = currentUsers.map((user) => ({ ...user, isSelected: true }));
    set({ shareQueryDialogUsers: updatedUsers });
  },

  // Custom action to deselect all users in share dialog
  deselectAllShareQueryDialogUsers: () => {
    const currentUsers = get().shareQueryDialogUsers as ShareableUser[];
    const updatedUsers = currentUsers.map((user) => ({ ...user, isSelected: false }));
    set({ shareQueryDialogUsers: updatedUsers });
  },

  // Custom action to get queries with pending updates
  getQueriesWithPendingUpdates: (): SharedQueryDTO[] => {
    const sharedQueries = get().sharedWithMeQueries as SharedQueryDTO[];
    return sharedQueries.filter((query) => query.hasUpdate);
  },

  // Custom action to mark a query as updated (remove from pending)
  markQueryAsUpdated: (queryId: string) => {
    const currentUpdates = get().pendingQueryUpdates as SharedQueryDTO[];
    const updatedList = currentUpdates.filter((query) => query.importedQueryId !== queryId);
    set({ pendingQueryUpdates: updatedList });
  },

  // Custom action to reset all query sharing state
  resetQuerySharingState: () =>
    set({
      sharedWithMeQueries: [],
      sharedWithMeQueriesLoading: false,
      showShareQueryDialog: false,
      shareQueryDialogQueryId: null,
      shareQueryDialogQueryName: null,
      shareQueryDialogRecipients: [],
      shareQueryDialogRecipientsLoading: false,
      shareQueryDialogUsers: [],
      shareQueryDialogUsersLoading: false,
      shareQueryDialogProfileFilter: null,
      showImportQueryDialog: false,
      importDialogSharedQuery: null,
      pendingQueryUpdates: [],
      pendingQueryUpdatesNotificationShown: false,
      sharedByUserQueryFilter: null,
    }),
}));

// ============================================================
// TYPE EXPORTS
// ============================================================

export type QuerySharingState = typeof querySharingState;
