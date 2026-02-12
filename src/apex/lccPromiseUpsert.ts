// Lightning Container
import LCC from 'lightning-container';

export const lccPromiseUpsert = (apexMethod: string, sObjectType: string, records: string) => {
  return new Promise(function (resolve, reject) {
    // console.log("calling LCC " + apexMethod);
    LCC.callApex(
      apexMethod,
      sObjectType,
      records,
      // @ts-ignore
      (result, event) => {
        if (event.status) {

          resolve(result);
        } else if (event.type === 'exception') {
          console.log('LCC call failed');
          console.dir(event);
          reject(event.message);
        }
      },
      // @ts-ignore
      { escape: true },
    );
  });
};
