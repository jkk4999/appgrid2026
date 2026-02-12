import { useEffect } from "react";

// Services
import createDefaultLayoutColumns from "./defaultLayoutColumnsService";
import { lccPromiseUpsert } from "./lccPromiseUpsert";

async function CreateAdaptableObjStateService(
  sObjectApiName: string,
  selectedObjMetadata: any,
  isDetailState: boolean
) {
  try {

    const layoutColumns = selectedObjMetadata.objMetadata.fields.map((f: any) => f.name)

    // create a new state for the selectedObject

    const gridState = {
      Layout: {
        CurrentLayout: "Default Layout",
        Layouts: [
          {
            AggregationColumns: null,
            ColumnFilters: null,
            ColumnHeadersMap: null,
            ColumnSorts: null,
            Columns: layoutColumns,
            ColumnWidthMap: null,
            EnablePivot: true,
            ExpandedRowGroupValues: null,
            HideColumnWhenGrouped: true,
            Name: "Default Layout",
            PinnedColumnsMap: null,
            PivotColumns: null,
            RowGroupedColumns: null,
            SuppressAggFuncInHeader: false,
            IsDetailState: isDetailState
          }
        ]
      }
    };

    const gridRec = {
      GridState__c: JSON.stringify(gridState),
      SObjectApiName__c: sObjectApiName,
      IsDetailState__c: isDetailState
    };

    const gridStateRecs = [gridRec];

    const recsStr = JSON.stringify(gridStateRecs);

    const result: any = await lccPromiseUpsert(
      "AppGridController.upsertRecs2",
      "AG_Config__c",
      recsStr
    );

    for (let i: number = 0; i < Object.keys(result.upsertResult).length; i++) {
      const value = result.upsertResult[i];

      if (value !== "success") {
        throw new Error(`CreateAdaptableObjStateService - ${value}`);
      }
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export default CreateAdaptableObjStateService;
