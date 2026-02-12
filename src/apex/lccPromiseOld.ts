import LCC from "lightning-container";

// NOTE: really important to use the buffer: false otherwise using promise.all fails
export function lccPromise(methodName: string, parameter: any): Promise<any> {
  return new Promise((resolve, reject) => {
    LCC.callApex(
      methodName,
      parameter,
      (result, event) => {
        if (event.status) {
          resolve(result);
        } else if (event.type === "exception") {
          reject(new Error(event.message + " : " + event.where));
        } else {
          reject(new Error("Unknown lccPromise error"));
        }
      },
      { escape: true,
        buffer: false
       }
    );
  });
}
