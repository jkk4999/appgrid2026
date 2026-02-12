// The setup for the query rule itself remains the same.
Map<String, Object> rule1 = new Map<String, Object>{
  'field' => 'Industry',
  'operator' => 'equal',
  'value' => 'Pharmaceuticals',
  'type' => 'string'
};

Map<String, Object> ruleGroup = new Map<String, Object>{
  'condition' => 'AND',
  'rules' => new List<Object>{ rule1 }
};

String ruleJSON = JSON.serialize(ruleGroup);

// --- START: MODIFIED LOGIC ---

try {
  // Step 1: Create an instance of the parameter class with all the query details.
  AgQueryParameters queryParams = new AgQueryParameters(
    'Account', // sObjectApiName
    ruleJSON, // queryRule
    null, // subQueryRule
    null // subQueryRelation
  );

  // Step 2: Serialize the entire parameter object into a single JSON string.
  String params = JSON.serialize(queryParams);

  // Step 3: Call the new executeDynamicSOQL method with the single serialized parameter.
  // The method now returns an AgWrapperQueryResult object.
  AgWrapperQueryResult2 result = AppGridController.executeDynamicSOQL(params);

  // Step 4: Check the status on the returned wrapper object to determine success or failure.
  if (result.status == 'OK') {
    System.debug('Query successful!');
    System.debug('Account Query Results Count: ' + result.records.size());

    if (!result.records.isEmpty()) {
      // Print the nested records from the wrapper's 'records' property.
      System.debug('--- FULLY NESTED ACCOUNT RECORD DATA ---');
      System.debug(JSON.serializePretty(result.records));
    }
  } else {
    // If the query failed, the error message will be in the wrapper.
    System.debug('Query failed with a controlled error.');
    System.debug('Error Message: ' + result.errorMessage);
  }
} catch (Exception e) {
  // This catch block will now only fire for unexpected, system-level errors
  // that prevent the wrapper object from being returned at all.
  System.debug('A critical, unhandled exception occurred: ' + e.getMessage());
  System.debug('Stack Trace: ' + e.getStackTraceString());
}
