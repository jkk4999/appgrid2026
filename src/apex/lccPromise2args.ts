// Lightning Container
import LCC from "lightning-container";

export async function lccPromise2args(
  methodName: string,
  param1: any,
  param2: any
) {
  return new Promise((resolve, reject) => {
    LCC.callApex(
      methodName,
      param1,
      param2,
      // @ts-ignore
      (result: any, event: any) => {
        if (event.status) {
          resolve(result);
        } else if (event.type === "exception") {
          reject(new Error(event.message + " : " + event.where));
        }
      },
      // @ts-ignore
      { escape: true }
    );
  });
}
