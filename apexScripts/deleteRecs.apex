// Correct list initialization with proper syntax
List<String> recordIds = new List<String>{ 'a0Rak000003Le3xEAC' };
String sObjectType = 'AppGridAg__AG_Grid_Template__c';

// Proper Apex Map syntax
Map<String, Object> myMap = new Map<String, Object>(); // Using Object instead of 'any'
myMap.put('recordIds', recordIds); // Changed set() to put() and fixed variable name
myMap.put('sObjectApiName', sObjectType);

String params = JSON.serialize(myMap);

List<AgDeleteResult> result = AppGridAg.AppGridController.deleteRecs(params);
System.debug(result);
