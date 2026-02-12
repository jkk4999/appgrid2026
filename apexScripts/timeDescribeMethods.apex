// String sObjectName = 'AppGrid__AG_Budget_Item__c';
String sObjectName = 'PaymentMethod';

// Capture start time
Long startTime = System.currentTimeMillis();

Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();

// Capture end time
Long endTime = System.currentTimeMillis();

// Calculate elapsed time
Long elapsedTime = endTime - startTime;

// Log the elapsed time
System.debug(
  'getGlobalDescribe execution time: ' + elapsedTime + ' milliseconds'
);

startTime = System.currentTimeMillis();

DescribeSObjectResult describeResult = globalDescribe
  .get(sObjectName)
  .getDescribe();

endTime = System.currentTimeMillis();

elapsedTime = endTime - startTime;

System.debug('describeResult execution time: ' + elapsedTime + ' milliseconds');
