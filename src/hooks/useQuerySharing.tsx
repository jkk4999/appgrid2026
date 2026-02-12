/**
 * useQuerySharing Hook
 *
 * Provides methods for team query sharing functionality.
 * Handles loading shared queries, sharing/unsharing queries,
 * importing queries, and checking for pending updates.
 */

import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../zustandStore';
import { prettyPrint } from '../utilities/prettyPrint';
import { useSnackbarAction } from './useSnackbarAction';
import type { APIClient } from '../brideDesignPattern/apiInterface';
import type { SharedQueryDTO, SObjectQuery } from '../sObjectMetadataTypes';

interface UseQuerySharingOptions {
  apiClient: APIClient;
  sObjectName: string;
}

export function useQuerySharing({ apiClient, sObjectName }: UseQuerySharingOptions) {
  const { enqueueSnackbar, action } = useSnackbarAction();

  const {
    sharedWithMeQueries,
    sharedWithMeQueriesLoading,
    pendingQueryUpdates,
    pendingQueryUpdatesNotificationShown,
    setSharedWithMeQueries,
    setSharedWithMeQueriesLoading,
    setPendingQueryUpdates,
    setPendingQueryUpdatesNotificationShown,
    openShareQueryDialog,
    openImportQueryDialog,
    markQueryAsUpdated,
    setQueryOptions,
    setSelectedQuery,
  } = useStore(
    useShallow((state) => ({
      sharedWithMeQueries: state.sharedWithMeQueries,
      sharedWithMeQueriesLoading: state.sharedWithMeQueriesLoading,
      pendingQueryUpdates: state.pendingQueryUpdates,
      pendingQueryUpdatesNotificationShown: state.pendingQueryUpdatesNotificationShown,
      setSharedWithMeQueries: state.setSharedWithMeQueries,
      setSharedWithMeQueriesLoading: state.setSharedWithMeQueriesLoading,
      setPendingQueryUpdates: state.setPendingQueryUpdates,
      setPendingQueryUpdatesNotificationShown: state.setPendingQueryUpdatesNotificationShown,
      openShareQueryDialog: state.openShareQueryDialog,
      openImportQueryDialog: state.openImportQueryDialog,
      markQueryAsUpdated: state.markQueryAsUpdated,
      setQueryOptions: state.setQueryOptions,
      setSelectedQuery: state.setSelectedQuery,
    }))
  );

  const getNotifiedSharedQueryIds = useCallback((): Set<string> => {
    try {
      const stored = localStorage.getItem('appgrid_notified_shared_queries');
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      prettyPrint('useQuerySharing getNotifiedSharedQueryIds error', err);
    }
    return new Set();
  }, []);

  const markSharedQueriesAsNotified = useCallback((queryIds: string[]) => {
    try {
      const existing = getNotifiedSharedQueryIds();
      queryIds.forEach((id) => existing.add(id));
      localStorage.setItem('appgrid_notified_shared_queries', JSON.stringify(Array.from(existing)));
    } catch (err) {
      prettyPrint('useQuerySharing markSharedQueriesAsNotified error', err);
    }
  }, [getNotifiedSharedQueryIds]);

  const loadSharedQueries = useCallback(async () => {
    if (!sObjectName) return;

    try {
      setSharedWithMeQueriesLoading(true);

      const response = await apiClient.getSharedQueries({ sObjectName: sObjectName });

      if (response && Array.isArray(response)) {
        setSharedWithMeQueries(response);

        const notifiedIds = getNotifiedSharedQueryIds();

        const newSharedQueries = response.filter(
          (query: SharedQueryDTO) => !query.importedQueryId && !notifiedIds.has(query.id)
        );

        const queriesWithUpdates = response.filter(
          (query: SharedQueryDTO) => query.hasUpdate
        );

        if (queriesWithUpdates.length > 0) {
          setPendingQueryUpdates(queriesWithUpdates);
        }

        if (newSharedQueries.length > 0) {
          const message =
            newSharedQueries.length === 1
              ? `A new query has been shared with you: "${newSharedQueries[0].sourceQueryName}"`
              : `${newSharedQueries.length} new queries have been shared with you`;

          enqueueSnackbar(message, {
            variant: 'info',
            autoHideDuration: 10000,
            action,
          });

          markSharedQueriesAsNotified(newSharedQueries.map((q: SharedQueryDTO) => q.id));
        }

        if (queriesWithUpdates.length > 0 && !pendingQueryUpdatesNotificationShown) {
          const message =
            queriesWithUpdates.length === 1
              ? `1 shared query has an update available`
              : `${queriesWithUpdates.length} shared queries have updates available`;

          enqueueSnackbar(message, {
            variant: 'info',
            persist: true,
            action,
          });

          setPendingQueryUpdatesNotificationShown(true);
        }
      } else {
        setSharedWithMeQueries([]);
      }
    } catch (err: any) {
      // Extract detailed error message from Apex/LWC error structure
      const errorMessage = err?.body?.message || err?.message || err?.error || JSON.stringify(err);
      prettyPrint('useQuerySharing loadSharedQueries error', {
        fullError: err,
        message: errorMessage,
        body: err?.body,
        stack: err?.stack
      }, 'red');
      enqueueSnackbar(`Failed to load shared queries: ${errorMessage}`, { variant: 'error', action });
    } finally {
      setSharedWithMeQueriesLoading(false);
    }
  }, [
    apiClient,
    sObjectName,
    pendingQueryUpdatesNotificationShown,
    setSharedWithMeQueries,
    setSharedWithMeQueriesLoading,
    setPendingQueryUpdates,
    setPendingQueryUpdatesNotificationShown,
    enqueueSnackbar,
    action,
    getNotifiedSharedQueryIds,
    markSharedQueriesAsNotified,
  ]);

  const shareQuery = useCallback(
    async (queryId: string, userIds: string[], shareWithAll: boolean) => {
      try {
        await apiClient.shareQuery({
          queryId,
          userIds,
          shareWithAll,
        });

        enqueueSnackbar(
          shareWithAll
            ? 'Query shared with all users'
            : `Query shared with ${userIds.length} user${userIds.length !== 1 ? 's' : ''}`,
          { variant: 'success' }
        );

        return true;
      } catch (err) {
        prettyPrint('useQuerySharing shareQuery error', err);
        enqueueSnackbar('Failed to share query', { variant: 'error', action });
        return false;
      }
    },
    [apiClient, enqueueSnackbar, action]
  );

  const unshareQuery = useCallback(
    async (queryId: string, userIds?: string[]) => {
      try {
        await apiClient.unshareQuery({
          queryId,
          userIds,
        });

        enqueueSnackbar('Query sharing removed', { variant: 'success' });
        return true;
      } catch (err) {
        prettyPrint('useQuerySharing unshareQuery error', err);
        enqueueSnackbar('Failed to remove sharing', { variant: 'error', action });
        return false;
      }
    },
    [apiClient, enqueueSnackbar, action]
  );

  const upsertQueryOption = useCallback((query: SObjectQuery) => {
    setQueryOptions((prev: any[]) => {
      const list = Array.isArray(prev) ? prev : [];
      const queryId = query?.id;
      const index = queryId ? list.findIndex((q) => q?.id === queryId) : -1;

      if (index === -1) {
        return [...list, query];
      }

      const next = [...list];
      next[index] = query;
      return next;
    });
  }, [setQueryOptions]);

  const importQuery = useCallback(
    async (
      sharedQuery: SharedQueryDTO,
      queryName: string,
      syncMode: 'Sync' | 'Snapshot'
    ): Promise<SObjectQuery | null> => {
      try {
        const response: any = await apiClient.importSharedQuery({
          sharedQueryId: sharedQuery.id,
          queryName,
          syncMode,
        });

        const importedQuery = response?.query || response;

        if (importedQuery?.id) {
          enqueueSnackbar(`Query "${queryName}" imported successfully`, {
            variant: 'success',
          });

          await loadSharedQueries();

          upsertQueryOption(importedQuery);

          setSelectedQuery(importedQuery);

          return importedQuery;
        }

        if (response?.errorMessage) {
          enqueueSnackbar(response.errorMessage, { variant: 'error', action });
        }

        return null;
      } catch (err) {
        prettyPrint('useQuerySharing importQuery error', err);
        enqueueSnackbar('Failed to import query', { variant: 'error', action });
        return null;
      }
    },
    [apiClient, enqueueSnackbar, action, loadSharedQueries, setSelectedQuery, upsertQueryOption]
  );

  const updateImportedQuery = useCallback(
    async (queryId: string): Promise<SObjectQuery | null> => {
      try {
        const response: any = await apiClient.updateImportedQuery({
          queryId,
        });

        const updatedQuery = response?.query || response;

        if (updatedQuery?.id) {
          enqueueSnackbar('Query updated successfully', { variant: 'success' });

          markQueryAsUpdated(queryId);

          await loadSharedQueries();

          upsertQueryOption(updatedQuery);

          setSelectedQuery(updatedQuery);

          return updatedQuery;
        }

        if (response?.errorMessage) {
          enqueueSnackbar(response.errorMessage, { variant: 'error', action });
        }

        return null;
      } catch (err) {
        prettyPrint('useQuerySharing updateImportedQuery error', err);
        enqueueSnackbar('Failed to update query', { variant: 'error', action });
        return null;
      }
    },
    [apiClient, enqueueSnackbar, action, markQueryAsUpdated, loadSharedQueries, setSelectedQuery, upsertQueryOption]
  );

  const incrementShareQueryVersion = useCallback(
    async (queryId: string): Promise<boolean> => {
      try {
        await apiClient.incrementShareQueryVersion({ queryId });
        return true;
      } catch (err) {
        prettyPrint('useQuerySharing incrementShareQueryVersion error', err);
        return false;
      }
    },
    [apiClient]
  );

  const openShareDialog = useCallback(
    (queryId: string, queryName: string) => {
      openShareQueryDialog(queryId, queryName);
    },
    [openShareQueryDialog]
  );

  const openImportDialog = useCallback(
    (sharedQuery: SharedQueryDTO) => {
      openImportQueryDialog(sharedQuery);
    },
    [openImportQueryDialog]
  );

  const pendingUpdateCount = pendingQueryUpdates.length;
  const hasUpdatesAvailable = pendingUpdateCount > 0;

  return {
    sharedWithMeQueries,
    sharedWithMeQueriesLoading,
    pendingQueryUpdates,
    pendingUpdateCount,
    hasUpdatesAvailable,

    loadSharedQueries,
    shareQuery,
    unshareQuery,
    importQuery,
    updateImportedQuery,
    incrementShareQueryVersion,
    openShareDialog,
    openImportDialog,
  };
}

export default useQuerySharing;
