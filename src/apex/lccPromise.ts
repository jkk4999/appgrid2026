import LCC from "lightning-container";

export function lccPromise<T>(methodName: string, parameter: any): Promise<T> {
   return new Promise((resolve, reject) => {
     LCC.callApex(
       methodName,
       parameter,
       (result: T, event: any) => {
         if (event.status) {
           resolve(result);
         } else if (event.type === "exception") {
           reject(new Error(event.message + " : " + event.where));
         } else {
           reject(new Error("Unknown lccPromise error"));
         }
       },
       {
         escape: true,
         buffer: false,
       }
     );
   });
 }
 