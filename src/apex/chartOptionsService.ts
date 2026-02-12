import { useCallback } from "react";

// Redux
// import { useSelector, useDispatch } from 'react-redux'

// Html Encode/Decode
import { decode } from "he";

// Lodash
import * as _ from "lodash-es";

// Axios
import axios from "axios";

// functions
import { lccPromise } from "./lccPromise";

// ENVIRONMENT
const env = import.meta.env.VITE_ENV

// takes a string instead of SelectedObject for arg

async function chartOptionsService(objName: string) {
  if (env === "DEV") {
    try {
      const params = {
        apexClass: "AppGridController",
        methodName: "getChartOptions",
        selectedObject: objName
      };

      const result: any = await axios.post(
        "http://localhost:4000/getChartOptions",
        params
      );
      const apiResult = result.data;

      if (apiResult.status !== "ok") {
        throw new Error(apiResult.errorMessage);
      }

      const queryList: any = _.cloneDeep(apiResult.options);

      // Apex html-encodes rest responses so remove them
      queryList.forEach((q: any) => {
        const escapedName = decode(q.Name);
        q.Name = escapedName;
      });

      return queryList;
    } catch (error: any) {
      throw new Error(error.message); // send error to tanstack
    }
  } else {
    try {
      const apiResult: any = await lccPromise(
        "AppGridAg.AppGridController.getChartOptions",
        objName
      );

      if (apiResult.status !== "ok") {
        throw new Error(apiResult.errorMessage);
      }

      const optionsList: any = _.cloneDeep(apiResult.options);

      // Apex html-encodes rest responses so remove them
      optionsList.forEach((q: any) => {
        const escapedName = decode(q.Name);
        q.Name = escapedName;
      });

      return optionsList;
    } catch (error: any) {
      throw new Error(error.message); // send error to tanstack
    }
  }
}

export default chartOptionsService;
