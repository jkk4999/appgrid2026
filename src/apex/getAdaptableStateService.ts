// Html Encode/Decode
import { decode } from "he";

// Lodash
import * as _ from "lodash-es";

// Axios
import axios from "axios";

// functions
import { lccPromise } from "./lccPromise";
import { lccPromise2args } from "./lccPromise2args";

// ENVIRONMENT
const env = import.meta.env.VITE_REACT_APP_ENV;

// takes 2 arguments
function adaptableStateService(objName: string, isDetailState: boolean) {
  return new Promise((resolve, reject) => {
    if (env === "DEV") {
      const params = {
        apexClass: "AppGridController",
        methodName: "getAdaptableObjState",
        selectedObject: objName,
        isDetailState: isDetailState
      };
      // returns a promise
      axios
        .post("http://localhost:4000/getAdaptableObjState", params)
        .then((result) => {
          const apiResult = result.data;

          if (apiResult.status !== "ok") {
            reject(apiResult.errorMessage);
          }

          if (apiResult.state.length > 1) {
            reject("more than 1 state record found");
          }

          if (apiResult.state.length === 0) {
            // TBD: CREATE DEFAULT STATE
            resolve({
              sObjectApiName: objName,
              state: null
            });
          }

          let stateObj = null;

          if (apiResult.state[0].AppGrid__GridState__c) {
            // decode the response
            const decodedText = decode(
              apiResult.state[0].AppGrid__GridState__c
            );
            const objState = JSON.parse(decodedText);

            let kanbanState = null;
            if (apiResult.state[0].AppGrid__KanbanState__c) {
              const decodedKanBanState = decode(
                apiResult.state[0].AppGrid__KanbanState__c
              );
              kanbanState = JSON.parse(decodedKanBanState);
            }
            const objectName = apiResult.state[0].AppGrid__SObjectApiName__c;

            stateObj = {
              sObjectApiName: objectName,
              state: objState,
              kanbanState: kanbanState,
              recId: apiResult.state[0].Id,
              isDetailState: apiResult.isDetailState
            };
          } else {
            stateObj = {
              sObjectApiName: objName,
              state: null
            };
          }

          resolve(stateObj);
        })
        .catch((error) => {
          reject(
            `Axios error calling getObjState from node service - ${error.message}`
          );
        });
    }
    if (env !== "DEV") {
      lccPromise2args(
        "AppGridAg.AppGridController.getAdaptableObjState",
        objName,
        isDetailState
      )
        .then((result: any) => {
          // console.log(
          //   "AppGridAg.AppGridController.getAdaptableObjState apiResult is"
          // );
          // console.dir(result);

          let stateObj = null;

          if (result.status !== "ok") {
            reject(
              "adaptableStateService - Salesforce api error retrieving appliation state"
            );
          }

          if (result.state.length > 1) {
            reject("adaptableStateService - more than 1 state record found");
          }

          if (result.state.length === 0) {
            stateObj = {
              sObjectApiName: objName,
              state: null
            };

            resolve(stateObj);
          } else {
            const objState: any = result.state[0];

            if (objState.AppGrid__GridState__c) {
              // decode the response
              const decodedText = decode(objState.AppGrid__GridState__c);
              const state = JSON.parse(decodedText);
              const objectName = objState.AppGrid__SObjectApiName__c;

              stateObj = {
                sObjectApiName: objectName,
                state: state,
                recId: result.state[0].Id
              };
            } else {
              stateObj = {
                sObjectApiName: objName,
                state: null,
                recId: null
              };
            }

            resolve(stateObj);
          }
        })
        .catch((error) => {
          console.log("error thrown from adaptableStateService is");
          console.dir(error.message);
          reject(error.message);
        });
    }
  });
}

export default adaptableStateService;
