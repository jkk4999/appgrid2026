// Axios
import axios from "axios";

// functions
import { lccPromise } from "./lccPromise";

// ENVIRONMENT
const env = import.meta.env.VITE_REACT_APP_ENV;

// takes a string instead of SelectedObject for arg

async function getObjDefaultFields(objName: string) {
  if (env === "DEV") {
    try {
      const params = {
        apexClass: "AppGridController",
        methodName: "getObjDefaultFields",
        selectedObject: objName
      };

      const apiResult = await axios.post(
        "http://localhost:4000/getObjDefaultFields",
        params
      );

      return apiResult;
    } catch (error: any) {
      console.log("getObjDefaultFields api error is");
      console.dir(error.message);

      throw new Error(error.message); // send error to tanstack
    }
  } else {
    try {
      const apiResult: any = await lccPromise(
        "AppGridAg.AppGridController.getObjDefaultFields",
        objName
      );

      return apiResult;
    } catch (error: any) {
      throw new Error(error.message); // send error to tanstack
    }
  }
}

export default getObjDefaultFields;
