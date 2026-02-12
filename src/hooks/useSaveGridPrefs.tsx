import { useEffect, useRef, useCallback, RefObject } from 'react';
import _ from 'lodash';
import { enqueueSnackbar } from 'notistack';
import { prettyPrint } from '../utilities/prettyPrint';
import { SObjectMetadata, SObjectQuery, SObjectView } from '../sObjectMetadataTypes';
import { APIClient } from '../brideDesignPattern/apiInterface';
import { UseBoundStore } from 'zustand';
import { StoreApi } from 'zustand';
import { Store } from '../zustandStore';

export const useGridPrefSaver = ({
  sObjectName,
  selectedObjMetadata,
  selectedView,
  selectedQuery,
  ready,
  apiClient,
  action,
  isSubgridView,
  includeQuery = true,
  zustandRef,
}: {
  sObjectName: string | undefined | null;
  selectedObjMetadata: SObjectMetadata | null;
  selectedView: SObjectView | null;
  selectedQuery?: SObjectQuery | null;
  ready: boolean; // caller-defined readiness condition (data loaded, view applied, etc.)
  apiClient: APIClient;
  action: any;
  isSubgridView: boolean;
  includeQuery?: boolean;
  zustandRef: RefObject<UseBoundStore<StoreApi<Store>>>;
}) => {

  const isSavingGridPref = useRef(false);

  const savePref = useCallback(async () => {
    const { objGridPreference, setGridPreferenceRecId } = zustandRef.current.getState();

    console.log('🔍🔍🔍 [GridPrefSaver] savePref called - NEW VERSION 2.0');
    prettyPrint('[GridPrefSaver] savePref called', {
      ready,
      sObjectName,
      metadataApiName: selectedObjMetadata?.apiName,
      viewId: selectedView?.id,
      queryId: selectedQuery?.id,
      querySObjectApiName: selectedQuery?.sObjectApiName,
      includeQuery
    }, 'cyan');

    if (!ready) { prettyPrint('[GridPrefSaver] SKIP: not ready', null, 'orange'); return; }
    if (!sObjectName || !selectedObjMetadata || !selectedView) { prettyPrint('[GridPrefSaver] SKIP: missing required fields', null, 'orange'); return; }
    if (selectedObjMetadata.apiName !== sObjectName) { prettyPrint('[GridPrefSaver] SKIP: metadata mismatch', null, 'orange'); return; }
    if (includeQuery && !selectedQuery) { prettyPrint('[GridPrefSaver] SKIP: no query', null, 'orange'); return; }
    if (includeQuery && selectedQuery && selectedQuery.sObjectApiName !== sObjectName) {
      prettyPrint('⚠️ BLOCKED save: Query object mismatch', {
        queryObject: selectedQuery.sObjectApiName,
        currentObject: sObjectName,
        queryId: selectedQuery.id
      }, 'red');
      return;
    }

    if (isSavingGridPref.current) {
      prettyPrint('⏸ Skipping save: already saving', null, 'orange');
      return;
    }

    isSavingGridPref.current = true;

    try {
      //  prettyPrint('⚡ savePref CALLED', {
      //    object: sObjectName,
      //    view: selectedView?.id,
      //    query: selectedQuery?.id,
      //    gridPreferenceRecId: objGridPreference.gridPreferenceRecId,
      //    lastViewId: objGridPreference.lastViewId,
      //    lastQueryId: objGridPreference.lastQueryId,
      //    includeQuery,
      //    isSubgridView,
      //  }, 'pink');

      const upsertRec: Record<string, any> = {
        AppGridAg__SObjectApiName__c: sObjectName,
        AppGridAg__IsSubgridView__c: isSubgridView,
        // Use the current selection directly to avoid stale lastViewId
        AppGridAg__LastViewUsed__c: selectedView?.id,
      };

      if (includeQuery && selectedQuery?.id) {
        // Use the current selection directly to avoid stale lastQueryId
        upsertRec['AppGridAg__LastQueryUsed__c'] = selectedQuery.id;
      }

      if (objGridPreference.gridPreferenceRecId) {
        //  prettyPrint('🟢 Adding Id to upsert rec', objGridPreference.gridPreferenceRecId, 'green');
        upsertRec['Id'] = objGridPreference.gridPreferenceRecId;
      } else {
        //  prettyPrint('🟡 Inserting new pref (no gridPrefRecId)', null, 'yellow');
      }

      const params = {
        sObjectName: 'AppGridAg__AG_Grid_Prefs__c',
        jsonRecs: JSON.stringify([upsertRec])
      };

      //  prettyPrint('📤 Upsert request', params, 'cyan');
      const result = await apiClient.upsertRecs(params);
      //  prettyPrint('📥 Upsert response', result, 'cyan');

      if (result.status !== 'success' || result.results.length !== 1 || !result.results[0].isSuccess) {
        throw new Error(result.errorMessage || 'Error saving grid preference');
      }

      // Update store with the newly created ID
      if (!_.isEqual(result.results[0].recordId, objGridPreference.gridPreferenceRecId)) {
        //  prettyPrint('✅updating gridPreferenceRecId', result.results[0].recordId, 'green');
        setGridPreferenceRecId(result.results[0].recordId);
      }

      prettyPrint('✅ Save SUCCESS', {
        newGridPrefId: result.results[0].recordId,
        lastViewId: selectedView?.id,
        lastQueryId: selectedQuery?.id
      }, 'green');

    } catch (error: any) {
      enqueueSnackbar(error.message, { action, variant: 'error' });
      console.error('❌ Save error:', error);
    } finally {
      isSavingGridPref.current = false;
    }
  }, [zustandRef, ready, sObjectName, selectedObjMetadata, selectedView, includeQuery, selectedQuery, isSubgridView, apiClient, action]);

  // Trigger save whenever view/query changes
  useEffect(() => {
    if (!ready) return;

    savePref();
  }, [ready, sObjectName, selectedView?.id, selectedQuery?.id, includeQuery, isSubgridView, savePref, zustandRef]);
};
