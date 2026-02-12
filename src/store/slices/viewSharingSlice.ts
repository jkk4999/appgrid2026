/**
 * View Sharing Slice
 *
 * Manages state for team view sharing feature including shared views,
 * dialogs, and pending updates.
 */

import { createSliceWithSetters } from '../createSlice';
import type { SharedViewDTO } from '../../sObjectMetadataTypes';

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

const viewSharingState = {
  // Shared views received from others
  sharedWithMeViews: [] as SharedViewDTO[],
  sharedWithMeLoading: false,

  // Share View Dialog state
  showShareViewDialog: false,
  shareDialogViewId: null as string | null,
  shareDialogViewName: null as string | null,
  shareDialogRecipients: [] as SharedViewDTO[],
  shareDialogRecipientsLoading: false,
  shareDialogUsers: [] as ShareableUser[],
  shareDialogUsersLoading: false,
  shareDialogProfileFilter: null as string | null,

  // Import View Dialog state
  showImportViewDialog: false,
  importDialogSharedView: null as SharedViewDTO | null,

  // Pending updates notification
  pendingViewUpdates: [] as SharedViewDTO[],
  pendingUpdatesNotificationShown: false,

  // Filter for "Shared With Me" tab
  sharedByUserFilter: null as string | null,
};

// ============================================================
// SLICE CREATOR
// ============================================================

export const createViewSharingSlice = createSliceWithSetters(viewSharingState, (set, get) => ({
  // Custom action to open share dialog with view info
  openShareViewDialog: (viewId: string, viewName: string) =>
    set({
      showShareViewDialog: true,
      shareDialogViewId: viewId,
      shareDialogViewName: viewName,
      shareDialogRecipients: [],
      shareDialogUsers: [],
      shareDialogProfileFilter: null,
    }),

  // Custom action to close share dialog and reset state
  closeShareViewDialog: () =>
    set({
      showShareViewDialog: false,
      shareDialogViewId: null,
      shareDialogViewName: null,
      shareDialogRecipients: [],
      shareDialogUsers: [],
      shareDialogProfileFilter: null,
      shareDialogRecipientsLoading: false,
      shareDialogUsersLoading: false,
    }),

  // Custom action to open import dialog
  openImportViewDialog: (sharedView: SharedViewDTO) =>
    set({
      showImportViewDialog: true,
      importDialogSharedView: sharedView,
    }),

  // Custom action to close import dialog
  closeImportViewDialog: () =>
    set({
      showImportViewDialog: false,
      importDialogSharedView: null,
    }),

  // Custom action to update user selection in share dialog
  toggleShareDialogUserSelection: (userId: string) => {
    const currentUsers = get().shareDialogUsers as ShareableUser[];
    const updatedUsers = currentUsers.map((user) =>
      user.id === userId ? { ...user, isSelected: !user.isSelected } : user
    );
    set({ shareDialogUsers: updatedUsers });
  },

  // Custom action to select all users in share dialog
  selectAllShareDialogUsers: () => {
    const currentUsers = get().shareDialogUsers as ShareableUser[];
    const updatedUsers = currentUsers.map((user) => ({ ...user, isSelected: true }));
    set({ shareDialogUsers: updatedUsers });
  },

  // Custom action to deselect all users in share dialog
  deselectAllShareDialogUsers: () => {
    const currentUsers = get().shareDialogUsers as ShareableUser[];
    const updatedUsers = currentUsers.map((user) => ({ ...user, isSelected: false }));
    set({ shareDialogUsers: updatedUsers });
  },

  // Custom action to get views with pending updates
  getViewsWithPendingUpdates: (): SharedViewDTO[] => {
    const sharedViews = get().sharedWithMeViews as SharedViewDTO[];
    return sharedViews.filter((view) => view.hasUpdate);
  },

  // Custom action to mark a view as updated (remove from pending)
  markViewAsUpdated: (viewId: string) => {
    const currentUpdates = get().pendingViewUpdates as SharedViewDTO[];
    const updatedList = currentUpdates.filter((view) => view.importedViewId !== viewId);
    set({ pendingViewUpdates: updatedList });
  },

  // Custom action to reset all view sharing state
  resetViewSharingState: () =>
    set({
      sharedWithMeViews: [],
      sharedWithMeLoading: false,
      showShareViewDialog: false,
      shareDialogViewId: null,
      shareDialogViewName: null,
      shareDialogRecipients: [],
      shareDialogRecipientsLoading: false,
      shareDialogUsers: [],
      shareDialogUsersLoading: false,
      shareDialogProfileFilter: null,
      showImportViewDialog: false,
      importDialogSharedView: null,
      pendingViewUpdates: [],
      pendingUpdatesNotificationShown: false,
      sharedByUserFilter: null,
    }),
}));

// ============================================================
// TYPE EXPORTS
// ============================================================

export type ViewSharingState = typeof viewSharingState;
