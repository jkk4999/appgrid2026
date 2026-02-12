// =========================================================================
// === Anonymous Apex to Test the Case Subgrid Query ===
// =========================================================================
System.debug(LoggingLevel.ERROR, '### STARTING CASE SUBGRID TEST ###');

try {
  // --- Step 1: Define the inner queryRule for Case ---
  // Find Cases where AccountId matches a specific Account.
  Map<String, Object> caseRule = new Map<String, Object>{
    'field' => 'AccountId',
    'operator' => 'equal',
    'value' => '001ak00000nNjtiAAC' // Use the exact ID from your logs
  };

  Map<String, Object> caseRuleGroup = new Map<String, Object>{
    'condition' => 'AND',
    'rules' => new List<Object>{ caseRule }
  };

  // --- Step 2: Build the 'AgQueryParameters' object as a Map ---
  // This mimics the structure your client-side code creates.
  Map<String, Object> queryParamsMap = new Map<String, Object>();
  queryParamsMap.put('sObjectApiName', 'Case');

  // The queryRule value must be a string containing JSON.
  queryParamsMap.put('queryRule', JSON.serialize(caseRuleGroup));

  // Set subquery params to null for this test.
  queryParamsMap.put('subQueryRule', null);
  queryParamsMap.put('subQueryRelation', null);

  // --- Step 3: Serialize the parameters Map into the final string ---
  // This is the string that executeDynamicSOQL expects.
  String serializedParams = JSON.serialize(queryParamsMap);
  System.debug(
    '### TEST SCRIPT: Final `serializedParameters` string being passed to method:\n' +
    serializedParams
  );

  // --- Step 4: Call the method and get the result ---
  // No need to simulate the REST call, we can call the method directly.
  AgWrapperQueryResult2 result = AppGridController.executeDynamicSOQL(
    serializedParams
  );

  // --- Step 5: Analyze and print the final result ---
  System.debug('### FINAL RESULT FROM executeDynamicSOQL ###');

  System.debug('Result Status: ' + result.status);

  if (result.status == 'OK') {
    System.debug(
      'Records Found: ' + (result.records == null ? 0 : result.records.size())
    );
    if (result.records != null && !result.records.isEmpty()) {
      // Print the first fully processed record to see the nested objects
      System.debug(
        LoggingLevel.ERROR,
        'First Processed Record:\n' + JSON.serializePretty(result.records[0])
      );
    }
  } else {
    // If an error occurred, the wrapper will contain the details.
    System.debug('Error Message: ' + result.errorMessage);
  }
} catch (Exception e) {
  // This will catch any unexpected crash in the test script itself.
  System.debug('### CATASTROPHIC EXCEPTION IN TEST SCRIPT ###');
  System.debug('Exception Type: ' + e.getTypeName());
  System.debug('Exception Message: ' + e.getMessage());
  System.debug('Stack Trace:\n' + e.getStackTraceString());
}

System.debug(LoggingLevel.ERROR, '### FINISHED CASE SUBGRID TEST ###');
