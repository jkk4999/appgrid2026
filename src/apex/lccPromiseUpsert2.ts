// Lightning Container
import LCC from 'lightning-container';

export const lccPromiseUpsert2 = <T>(apexMethod: string, sObjectType: string, records: string): Promise<T> => {

  const params = {
    sObjectApiName: sObjectType,
    jsonRecs: records
  }

  const paramsStr = JSON.stringify(params);

  return new Promise(function (resolve, reject) {
    // console.log("calling LCC " + apexMethod);
    LCC.callApex(
      apexMethod,
      paramsStr,
      (result, event) => {
        if (event.status) {
          resolve(result);
        } else if (event.type === 'exception') {
          console.log('LCC call failed');
          console.dir(event);
          reject(event.message);
        }
      },
      { escape: true },
    );
  });
};
