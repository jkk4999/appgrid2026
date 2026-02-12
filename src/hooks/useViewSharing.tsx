/**
 * useViewSharing Hook
 *
 * Provides methods for team view sharing functionality.
 * Handles loading shared views, sharing/unsharing views,
 * importing views, and checking for pending updates.
 */

import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../zustandStore';
import { prettyPrint } from '../utilities/prettyPrint';
import { useSnackbarAction } from './useSnackbarAction';
import type { APIClient } from '../brideDesignPattern/apiInterface';
import type { SharedViewDTO, SObjectView } from '../sObjectMetadataTypes';

interface UseViewSharingOptions {
  apiClient: APIClient;
  sObjectName: string;
}

/**
 * Hook for managing view sharing functionality.
 *
 * @example
 * ```tsx
 * const { loadSharedViews, shareView, importView, updateImportedView, pendingUpdateCount } = useViewSharing({
 *   apiClient,
 *   sObjectName: 'Account',
 * });
 *
 * // Load shared views on component mount
 * useEffect(() => {
 *   loadSharedViews();
 * }, [loadSharedViews]);
 *
 * // Share a view
 * const handleShare = async () => {
 *   await shareView(viewId, ['userId1', 'userId2'], false);
 * };
 *
 * // Import a shared view
 * const handleImport = async () => {
 *   await importView(sharedView, 'My Imported View', 'Sync');
 * };
 * ```
 */
export function useViewSharing({ apiClient, sObjectName }: UseViewSharingOptions) {
  const { enqueueSnackbar, action } = useSnackbarAction();

  // Zustand state
  const {
    sharedWithMeViews,
    sharedWithMeLoading,
    pendingViewUpdates,
    pendingUpdatesNotificationShown,
    setSharedWithMeViews,
    setSharedWithMeLoading,
    setPendingViewUpdates,
    setPendingUpdatesNotificationShown,
    openShareViewDialog,
    openImportViewDialog,
    markViewAsUpdated,
    setSelectedView,
  } = useStore(
    useShallow((state) => ({
      sharedWithMeViews: state.sharedWithMeViews,
      sharedWithMeLoading: state.sharedWithMeLoading,
      pendingViewUpdates: state.pendingViewUpdates,
      pendingUpdatesNotificationShown: state.pendingUpdatesNotificationShown,
      setSharedWithMeViews: state.setSharedWithMeViews,
      setSharedWithMeLoading: state.setSharedWithMeLoading,
      setPendingViewUpdates: state.setPendingViewUpdates,
      setPendingUpdatesNotificationShown: state.setPendingUpdatesNotificationShown,
      openShareViewDialog: state.openShareViewDialog,
      openImportViewDialog: state.openImportViewDialog,
      markViewAsUpdated: state.markViewAsUpdated,
      setSelectedView: state.setSelectedView,
    }))
  );

  /**
   * Get IDs of shared views that the user has already been notified about.
   * Uses localStorage to persist across sessions.
   */
  const getNotifiedSharedViewIds = useCallback((): Set<string> => {
    try {
      const stored = localStorage.getItem('appgrid_notified_shared_views');
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      prettyPrint('useViewSharing getNotifiedSharedViewIds error', err);
    }
    return new Set();
  }, []);

  /**
   * Mark shared view IDs as notified in localStorage.
   */
  const markSharedViewsAsNotified = useCallback((viewIds: string[]) => {
    try {
      const existing = getNotifiedSharedViewIds();
      viewIds.forEach((id) => existing.add(id));
      localStorage.setItem('appgrid_notified_shared_views', JSON.stringify(Array.from(existing)));
    } catch (err) {
      prettyPrint('useViewSharing markSharedViewsAsNotified error', err);
    }
  }, [getNotifiedSharedViewIds]);

  /**
   * Load views shared with the current user.
   * Also checks for pending updates and new shared views, showing notifications if needed.
   */
  const loadSharedViews = useCallback(async () => {
    if (!sObjectName) return;

    try {
      setSharedWithMeLoading(true);

      const response = await apiClient.getSharedViews({ sObjectName: sObjectName });

      if (response && Array.isArray(response)) {
        setSharedWithMeViews(response);

        // Get previously notified view IDs from localStorage
        const notifiedIds = getNotifiedSharedViewIds();

        // Check for new shared views (not yet imported and not yet notified)
        const newSharedViews = response.filter(
          (view: SharedViewDTO) => !view.importedViewId && !notifiedIds.has(view.id)
        );

        // Check for pending updates (imported views with hasUpdate)
        const viewsWithUpdates = response.filter(
          (view: SharedViewDTO) => view.hasUpdate
        );

        if (viewsWithUpdates.length > 0) {
          setPendingViewUpdates(viewsWithUpdates);
        }

        // Show notification for new shared views (only once per view)
        if (newSharedViews.length > 0) {
          const message =
            newSharedViews.length === 1
              ? `A new view has been shared with you: "${newSharedViews[0].sourceViewName}"`
              : `${newSharedViews.length} new views have been shared with you`;

          enqueueSnackbar(message, {
            variant: 'info',
            autoHideDuration: 10000,
            action,
          });

          // Mark these views as notified so user doesn't see notification again
          markSharedViewsAsNotified(newSharedViews.map((v: SharedViewDTO) => v.id));
        }

        // Show notification for pending updates (once per session)
        if (viewsWithUpdates.length > 0 && !pendingUpdatesNotificationShown) {
          const message =
            viewsWithUpdates.length === 1
              ? `1 shared view has an update available`
              : `${viewsWithUpdates.length} shared views have updates available`;

          enqueueSnackbar(message, {
            variant: 'info',
            persist: true,
            action,
          });

          setPendingUpdatesNotificationShown(true);
        }
      } else {
        setSharedWithMeViews([]);
      }
    } catch (err: any) {
      // Extract detailed error message from Apex/LWC error structure
      const errorMessage = err?.body?.message || err?.message || err?.error || JSON.stringify(err);
      prettyPrint('useViewSharing loadSharedViews error', {
        fullError: err,
        message: errorMessage,
        body: err?.body,
        stack: err?.stack
      }, 'red');
      enqueueSnackbar(`Failed to load shared views: ${errorMessage}`, { variant: 'error', action, autoHideDuration: null });
    } finally {
      setSharedWithMeLoading(false);
    }
  }, [
    apiClient,
    sObjectName,
    pendingUpdatesNotificationShown,
    setSharedWithMeViews,
    setSharedWithMeLoading,
    setPendingViewUpdates,
    setPendingUpdatesNotificationShown,
    enqueueSnackbar,
    action,
    getNotifiedSharedViewIds,
    markSharedViewsAsNotified,
  ]);

  /**
   * Share a view with specified users.
   */
  const shareView = useCallback(
    async (viewId: string, userIds: string[], shareWithAll: boolean) => {
      try {
        await apiClient.shareView({
          viewId,
          userIds,
          shareWithAll,
        });

        enqueueSnackbar(
          shareWithAll
            ? 'View shared with all users'
            : `View shared with ${userIds.length} user${userIds.length !== 1 ? 's' : ''}`,
          { variant: 'success' }
        );

        return true;
      } catch (err) {
        prettyPrint('useViewSharing shareView error', err);
        enqueueSnackbar('Failed to share view', { variant: 'error', action, autoHideDuration: null });
        return false;
      }
    },
    [apiClient, enqueueSnackbar, action]
  );

  /**
   * Remove sharing from specified users.
   */
  const unshareView = useCallback(
    async (viewId: string, userIds?: string[]) => {
      try {
        await apiClient.unshareView({
          viewId,
          userIds,
        });

        enqueueSnackbar('View sharing removed', { variant: 'success' });
        return true;
      } catch (err) {
        prettyPrint('useViewSharing unshareView error', err);
        enqueueSnackbar('Failed to remove sharing', { variant: 'error', action, autoHideDuration: null });
        return false;
      }
    },
    [apiClient, enqueueSnackbar, action]
  );

  /**
   * Import a shared view.
   * Returns the imported view on success.
   */
  const importView = useCallback(
    async (
      sharedView: SharedViewDTO,
      viewName: string,
      syncMode: 'Sync' | 'Snapshot'
    ): Promise<SObjectView | null> => {
      try {
        const response = await apiClient.importSharedView({
          sharedViewId: sharedView.id,
          viewName,
          syncMode,
        });

        if (response?.status === 'success' && response.view) {
          const importedView = response.view;
          enqueueSnackbar(`View "${viewName}" imported successfully`, {
            variant: 'success',
          });

          // Refresh shared views to update import status
          await loadSharedViews();

          // Auto-select the imported view
          setSelectedView(importedView);

          return importedView;
        }

        if (response?.errorMessage) {
          enqueueSnackbar(response.errorMessage, { variant: 'error', action, autoHideDuration: null });
        }
        return null;
      } catch (err) {
        prettyPrint('useViewSharing importView error', err);
        enqueueSnackbar('Failed to import view', { variant: 'error', action, autoHideDuration: null });
        return null;
      }
    },
    [apiClient, enqueueSnackbar, action, loadSharedViews, setSelectedView]
  );

  /**
   * Update an imported view with latest changes from source.
   */
  const updateImportedView = useCallback(
    async (viewId: string): Promise<SObjectView | null> => {
      try {
        const updatedView = await apiClient.updateImportedView({
          viewId,
        });

        if (updatedView) {
          enqueueSnackbar('View updated successfully', { variant: 'success' });

          // Mark view as updated in state
          markViewAsUpdated(viewId);

          // Refresh shared views
          await loadSharedViews();

          // Update selected view if it's the one we updated
          setSelectedView(updatedView);

          return updatedView;
        }

        return null;
      } catch (err) {
        prettyPrint('useViewSharing updateImportedView error', err);
        enqueueSnackbar('Failed to update view', { variant: 'error', action, autoHideDuration: null });
        return null;
      }
    },
    [apiClient, enqueueSnackbar, action, markViewAsUpdated, loadSharedViews, setSelectedView]
  );

  /**
   * Increment the share version when a source view is saved.
   * This should be called when saving a view that has been shared.
   */
  const incrementShareVersion = useCallback(
    async (viewId: string): Promise<boolean> => {
      try {
        await apiClient.incrementShareVersion({
          viewId,
        });
        return true;
      } catch (err) {
        prettyPrint('useViewSharing incrementShareVersion error', err);
        return false;
      }
    },
    [apiClient]
  );

  /**
   * Open the share dialog for a view.
   */
  const openShareDialog = useCallback(
    (viewId: string, viewName: string) => {
      openShareViewDialog(viewId, viewName);
    },
    [openShareViewDialog]
  );

  /**
   * Open the import dialog for a shared view.
   */
  const openImportDialog = useCallback(
    (sharedView: SharedViewDTO) => {
      openImportViewDialog(sharedView);
    },
    [openImportViewDialog]
  );

  // Computed values
  const pendingUpdateCount = pendingViewUpdates.length;
  const hasUpdatesAvailable = pendingUpdateCount > 0;

  return {
    // State
    sharedWithMeViews,
    sharedWithMeLoading,
    pendingViewUpdates,
    pendingUpdateCount,
    hasUpdatesAvailable,

    // Actions
    loadSharedViews,
    shareView,
    unshareView,
    importView,
    updateImportedView,
    incrementShareVersion,
    openShareDialog,
    openImportDialog,
  };
}

export default useViewSharing;
