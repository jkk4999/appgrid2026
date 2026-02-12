import { useCallback } from "react";

// import { useSelector, useDispatch } from 'react-redux'

// Axios
import axios from "axios";

// functions
import { lccPromiseDelete } from "../apex/lccPromiseDelete";

// app interfaces
// import { SelectedObject } from '../appInterfaces/grid/gridInterfaces'

// ENVIRONMENT
const env = import.meta.env.VITE_REACT_APP_ENV;

function useDeleteRecordsService() {
  const deleteRecordsService = useCallback(
    async (recordIds: string[], selectedObject: string) => {
      if (env === "DEV") {
        try {
          const params = {
            apexClass: "AppGridController",
            methodName: "deleteRecs",
            objectType: selectedObject,
            recordIds: recordIds
          };

          const response = await axios.post(
            "http://localhost:4000/deleteRecs",
            params
          );

          const apiResult = response;

          return apiResult;
        } catch (error: any) {
          console.error(error.response.data);
          throw new Error(error.response.data);
        }
      } else {
        const apiResult = await lccPromiseDelete(
          "AppGridAg.AppGridController.deleteRecs",
          recordIds,
          selectedObject
        );
        return apiResult;
      }
    },
    []
  );

  return deleteRecordsService;
}

export default useDeleteRecordsService;
