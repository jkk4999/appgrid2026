import LCC from "lightning-container";

export function lccPromiseDelete<T>(
  apexMethod: string,
  records: string[], // Array of record IDs
  sObjectType: string
): Promise<T> {

  // stringify parameters
  const params = {
    recordIds: records,
    sObjectApiName: sObjectType
  }

  const paramsStr = JSON.stringify(params);
  
  return new Promise((resolve, reject) => {
    LCC.callApex(
      apexMethod,
      paramsStr, // Combine parameters into one object
      (result: T, event: any) => {
        if (event.status) {
          resolve(result);
        } else if (event.type === "exception") {
          console.error("LCC call failed", event);
          reject(new Error(event.message + " : " + event.where));
        } else {
          reject(new Error("Unknown lccPromiseDelete error"));
        }
      },
      {
        escape: true, // Escape HTML
        buffer: false, // Default behavior, unless needed
      }
    );
  });
}
