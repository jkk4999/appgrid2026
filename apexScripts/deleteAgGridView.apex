String sObjectName = 'AppGridAg__AG_View__c';

List<String> recordIds = new List<String>();
recordIds.add('a0Gak00000BAQyzEAH');


// Create the params object
Map<String, Object> paramsObj = new Map<String, Object>();
paramsObj.put('sObjectApiName', sObjectName); // Assign the string directly
paramsObj.put('recordIds', recordIds);       // Assign the list of record IDs

// Serialize paramsObj to JSON
String params = JSON.serialize(paramsObj);

// Call the deleteRecs method
List<AgDeleteResult> result = AppGridAg.AppGridController.deleteRecs(params);

// Log the result
System.debug(result);
