import { useCallback, useEffect, useRef, useState } from 'react';
import { prettyPrint } from '../utilities/prettyPrint';

interface UseGridPrefsOptions {
  apiClient: any;
  sObjectApiName: string;
  isSubgrid: boolean;
  enabled?: boolean;
}

export function useGridPrefs({
  apiClient,
  sObjectApiName,
  isSubgrid,
  enabled = true
}: UseGridPrefsOptions) {
  const [prefId, setPrefId] = useState<string | null>(null);
  const [lastViewUsed, setLastViewUsed] = useState<string | null>(null);
  const [lastQueryUsed, setLastQueryUsed] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isSavingRef = useRef(false);
  const currentObjectRef = useRef(sObjectApiName);
  const lastLoadedObjectRef = useRef<string | null>(null);

  const lastSavedViewRef = useRef<string | null>(null);
  const lastSavedQueryRef = useRef<string | null>(null);

  const prefIdRef = useRef<string | null>(null);

  // Track if initial save is in progress to prevent duplicate record creation
  const initialSaveInProgressRef = useRef(false);

  /**
   * ✅ PURE load function
   * - Does NOT reset isLoaded
   * - Does NOT care why it was called
   */
  const load = useCallback(async () => {
    if (!apiClient?.getObjGridPrefs || !sObjectApiName) return;

    currentObjectRef.current = sObjectApiName;
    setIsLoading(true);
    setError(null);

    try {
      const prefs = await apiClient.getObjGridPrefs({
        sObjectName: sObjectApiName,
        isSubgridView: isSubgrid
      });

      if (currentObjectRef.current !== sObjectApiName) return;

      const pref = Array.isArray(prefs) && prefs.length > 0 ? prefs[0] : null;

      if (pref) {
        const id = pref.id || pref.Id || null;
        const view = pref.lastViewUsed || null;
        const query = pref.lastQueryUsed || null;

        prefIdRef.current = id;
        setPrefId(id);
        setLastViewUsed(view);
        setLastQueryUsed(query);

        lastSavedViewRef.current = view;
        lastSavedQueryRef.current = query;
      } else {
        prefIdRef.current = null;
        setPrefId(null);
        setLastViewUsed(null);
        setLastQueryUsed(null);
        lastSavedViewRef.current = null;
        lastSavedQueryRef.current = null;
      }

      // ✅ monotonic
      setIsLoaded(true);
    } catch (err) {
      if (currentObjectRef.current !== sObjectApiName) return;
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
    } finally {
      if (currentObjectRef.current === sObjectApiName) {
        setIsLoading(false);
      }
    }
  }, [apiClient, sObjectApiName, isSubgrid]);

  /**
   * ✅ Effect controls lifecycle
   */
  useEffect(() => {
    if (!enabled) return;

    // ✅ Reset ONLY when object changes
    if (lastLoadedObjectRef.current !== sObjectApiName) {
      lastLoadedObjectRef.current = sObjectApiName;

      prefIdRef.current = null;
      lastSavedViewRef.current = null;
      lastSavedQueryRef.current = null;
      initialSaveInProgressRef.current = false; // Reset initial save guard for new object

      setPrefId(null);
      setLastViewUsed(null);
      setLastQueryUsed(null);
      setIsLoaded(false);
      setError(null);
    }

    load();
  }, [enabled, sObjectApiName, load]);

  /**
   * Save logic with race condition protection.
   * CRITICAL: When no prefId exists, we must prevent multiple concurrent saves
   * from creating duplicate records. Only one initial save is allowed; subsequent
   * saves must wait until the first one completes and provides a record ID.
   */
  const save = useCallback(
    async (updates: Record<string, string>) => {
      if (!apiClient?.upsertRecs || !isLoaded || isSavingRef.current) return;

      // CRITICAL: If no prefId exists yet, only allow ONE initial save
      // This prevents duplicate record creation when multiple save calls race
      if (!prefIdRef.current) {
        if (initialSaveInProgressRef.current) {
          prettyPrint('[useGridPrefs] Skipping save - initial save in progress', sObjectApiName, 'orange');
          return;
        }
        initialSaveInProgressRef.current = true;
        prettyPrint('[useGridPrefs] Starting initial save (creating new record)', sObjectApiName, 'cyan');
      }

      isSavingRef.current = true;

      try {
        const payload: any = {
          AppGridAg__SObjectApiName__c: sObjectApiName,
          AppGridAg__IsSubgridView__c: isSubgrid,
          ...updates
        };

        if (prefIdRef.current) {
          payload.Id = prefIdRef.current;
        }

        const res = await apiClient.upsertRecs({
          sObjectName: 'AppGridAg__AG_Grid_Prefs__c',
          jsonRecs: JSON.stringify([payload])
        });

        if (res?.status !== 'success') throw new Error(res?.errorMessage || 'Failed to save preference');
        const result = res?.results?.[0];
        if (!result?.isSuccess) throw new Error(result?.errorMessages?.[0]);

        if (result.recordId && result.recordId !== prefIdRef.current) {
          prefIdRef.current = result.recordId;
          setPrefId(result.recordId);
          prettyPrint('[useGridPrefs] Set prefIdRef.current', result.recordId, 'green');
        }
      } finally {
        isSavingRef.current = false;
        // Note: Don't reset initialSaveInProgressRef here - it should stay true
        // once we have a record ID (tracked via prefIdRef.current)
      }
    },
    [apiClient, sObjectApiName, isSubgrid, isLoaded]
  );

  const saveLastViewUsed = useCallback(
    async (viewId: string) => {
      if (!viewId || viewId === lastSavedViewRef.current) return;
      lastSavedViewRef.current = viewId;
      await save({ AppGridAg__LastViewUsed__c: viewId });
      setLastViewUsed(viewId);
    },
    [save]
  );

  const saveLastQueryUsed = useCallback(
    async (queryId: string) => {
      if (!queryId || queryId === lastSavedQueryRef.current) return;
      lastSavedQueryRef.current = queryId;
      await save({ AppGridAg__LastQueryUsed__c: queryId });
      setLastQueryUsed(queryId);
    },
    [save]
  );

  return {
    prefId,
    lastViewUsed,
    lastQueryUsed,
    isLoading,
    isLoaded,
    error,
    saveLastViewUsed,
    saveLastQueryUsed,
    reload: load
  };
}
