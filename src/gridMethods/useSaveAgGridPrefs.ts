import { useCallback } from 'react';
import { UpsertServiceParams } from '../brideDesignPattern/apiInterface';

interface SaveAgGridPrefResult {
  status: string;
  errorMessage?: string;
  gridPrefRecId?: string;
}

export const useAgGridPrefs = (apiClient: any) => {
  const saveAgGridPrefs = useCallback(
    async (
      selectedObject: string,
      isSubGrid: boolean,
      gridPrefRecId?: string | null,
      selectedViewId?: string,
      selectedQueryId?: string
    ): Promise<SaveAgGridPrefResult> => {
      try {
        const upsertRec: Record<string, any> = {
          AppGridAg__SObjectApiName__c: selectedObject,
          AppGridAg__IsSubgridView__c: isSubGrid
        };

        if (selectedViewId) {
          upsertRec['AppGridAg__LastViewUsed__c'] = selectedViewId;
        }

        if (selectedQueryId) {
          upsertRec['AppGridAg__LastQueryUsed__c'] = selectedQueryId;
        }

        if (gridPrefRecId) {
          upsertRec['Id'] = gridPrefRecId!;
        }

        const upsertRecs = [upsertRec];

        const param: UpsertServiceParams = {
          sObjectName: 'AppGridAg__AG_Grid_Prefs__c',
          jsonRecs: JSON.stringify(upsertRecs)
        };

        const result = await apiClient.upsertRecordsService(param);

        if (result.length > 1) {
          throw new Error(
            'Unexpected error - More than 1 grid pref record returned.'
          );
        }

        if (!result[0].status) {
          console.log(`Error saving grid preference - ${result[0].errors[0]}`);
          throw new Error('Unexpected error saving grid preference.');
        }

        const recId = result[0].id;

        return {
          status: 'success',
          gridPrefRecId: recId
        };
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
    [apiClient]
  );

  return { saveAgGridPrefs };
};
