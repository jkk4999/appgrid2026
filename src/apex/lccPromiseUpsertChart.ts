// Lightning Container
import LCC from "lightning-container";

export const lccPromiseUpsertChart = (apexMethod: string, args: string) => {
  return new Promise(function (resolve, reject) {
    // console.log("calling LCC " + apexMethod);
    LCC.callApex(
      apexMethod,
      args,
      (result, event) => {
        if (event.status) {
          resolve(result);
        } else if (event.type === "exception") {
          console.log("LCC call failed");
          console.dir(event);
          reject(event.message);
        }
      },
      { escape: true }
    );
  });
};
