// sObjectMetadataType
import { SObjectMetadata } from "../sObjectMetadataTypes";

// Axios
import axios from "axios";

// functions
import { lccPromise } from "./lccPromise";

// ENVIRONMENT
const env = import.meta.env.VITE_REACT_APP_ENV;

// takes a string instead of SelectedObject for arg

async function getObjMetadata(objName: string) {
  if (env === "DEV") {
    try {
      const params = {
        apexClass: "AppGridController",
        methodName: "apiGetSObjectMetadata",
        selectedObject: objName
      };

      const apiResponse = await axios.post(
        "http://localhost:4000/apiGetSObjectMetadata",
        params
      );

      const apiResult = apiResponse.data;

      return apiResult as SObjectMetadata;
    } catch (error: any) {
      throw new Error(error.message); // send error to tanstack
    }
  } else {
    try {
      const apiResult: any = await lccPromise(
        "AppGridAg.AppGridController.apiGetSObjectMetadata",
        objName
      );

      return apiResult as SObjectMetadata;
    } catch (error: any) {
      throw new Error(error.message); // send error to tanstack
    }
  }
}

export default getObjMetadata;
