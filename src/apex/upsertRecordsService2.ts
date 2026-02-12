import { useCallback } from "react";

// Redux
// import { useSelector, useDispatch } from 'react-redux'

// Axios
import axios from "axios";

// functions
import { lccPromiseUpsert } from "./lccPromiseUpsert";

// ENVIRONMENT
const env = import.meta.env.VITE_REACT_APP_ENV;

// takes a string instead of SelectedObject for arg

function useUpsertRecordsService2() {
  const upsertRecordsService2 = useCallback(
    async (objName: string, jsonRec: any) => {
      if (env === "DEV") {
        try {
          const params = {
            apexClass: "AppGridController",
            methodName: "upsertRecs2",
            sObjectApiName: objName,
            jsonRecs: jsonRec
          };

          const response = await axios.post(
            "http://localhost:4000/upsertRecs2",
            params
          );

          const apiResult = response.data;

          if (apiResult.status !== "ok") {
            throw new Error(apiResult.errorMessage);
          }

          return apiResult;
        } catch (error: any) {
          console.error(error.message);
          throw new Error(error);
        }
      } else {
        const apiResult: any = await lccPromiseUpsert(
          "AppGridAg.AppGridController.upsertRecs2",
          objName,
          jsonRec
        );

        if (apiResult.status !== "ok") {
          throw new Error(apiResult.errorMessage);
        }

        return apiResult;
      }
    },
    []
  );

  return upsertRecordsService2;
}

export default useUpsertRecordsService2;
