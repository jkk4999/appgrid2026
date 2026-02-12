// =========================================================================
// === Final Anonymous Apex to Simulate the Corrected REST Call ===
// =========================================================================

// --- Step 1: Prepare the 'AgQueryParameters' object as a Map ---
// This mimics what your Node.js server creates as 'queryParamsObject'.
Map<String, Object> queryParamsAsMap = new Map<String, Object>();
queryParamsAsMap.put('sObjectApiName', 'Account');

// Create the inner rule object and stringify it. This is what the executeDynamicSOQL method expects.
Map<String, Object> rule = new Map<String, Object>{
  'field' => 'Industry',
  'operator' => 'equal',
  'value' => 'Energy'
};
Map<String, Object> ruleGroup = new Map<String, Object>{
  'condition' => 'AND',
  'rules' => new List<Object>{ rule }
};
queryParamsAsMap.put('queryRule', JSON.serialize(ruleGroup));

// Set subquery params to null for this test
queryParamsAsMap.put('subQueryRule', null);
queryParamsAsMap.put('subQueryRelation', null);

System.debug(
  LoggingLevel.ERROR,
  'TEST SCRIPT: `params` object prepared:\n' +
  JSON.serializePretty(queryParamsAsMap)
);

// --- Step 2: Prepare the 'inputPayload' ---
// This mimics what your Node.js server sends to the myRestService method.
// The 'params' key now holds the MAP we just created, not a string.
Map<String, Object> inputPayloadMap = new Map<String, Object>();
inputPayloadMap.put('methodName', 'executeDynamicSOQL');
inputPayloadMap.put('params', queryParamsAsMap); // <-- THE KEY CHANGE: Pass the Map directly

// This is the final string that will be the entire HTTP body.
String inputPayload = JSON.serialize(inputPayloadMap);
System.debug(
  LoggingLevel.ERROR,
  'TEST SCRIPT: Final `inputPayload` to be sent to REST service:\n' +
  inputPayload
);

// --- Step 3: Simulate the HTTP Request and Call the Method ---
// This part remains the same.
RestRequest request = new RestRequest();
request.requestBody = Blob.valueOf(inputPayload);
RestContext.request = request;

RestResponse response = new RestResponse();
RestContext.response = response;

try {
  // Call your REST service method directly.
  String jsonResult = AppGridController.myRestService(inputPayload);

  // --- Step 4: Analyze the Result ---
  System.debug(
    LoggingLevel.ERROR,
    '>>>>>>>>> FINAL RESULT FROM myRestService >>>>>>>>>'
  );

  Map<String, Object> resultMap = (Map<String, Object>) JSON.deserializeUntyped(
    jsonResult
  );
  String status = (String) resultMap.get('status');

  System.debug('Result Status: ' + status);

  if (status == 'OK') {
    List<Object> records = (List<Object>) resultMap.get('records');
    System.debug('Records Found: ' + (records == null ? 0 : records.size()));
    if (records != null && !records.isEmpty()) {
      System.debug(JSON.serializePretty(records[0]));
    }
  } else {
    String errorMessage = (String) resultMap.get('errorMessage');
    System.debug('Error Message: ' + errorMessage);
  }
} catch (Exception e) {
  System.debug(
    LoggingLevel.ERROR,
    '>>>>>>>>> CATASTROPHIC EXCEPTION CAUGHT >>>>>>>>>'
  );
  System.debug('Exception Type: ' + e.getTypeName());
  System.debug('Exception Message: ' + e.getMessage());
  System.debug('Stack Trace:\n' + e.getStackTraceString());
}
