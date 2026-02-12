String sObjectApiNameForTaskTest = 'Task';

// Define a Query Rule for Tasks:
// Find Tasks with Status 'Open' AND Priority 'High'
Map<String, Object> taskRule1 = new Map<String, Object>{
  'field' => 'Status',
  'operator' => 'equal',
  'value' => 'Not Started',
  'type' => 'string' // Or string, depending on how your QB sends picklist values
};

Map<String, Object> taskRule2 = new Map<String, Object>{
  'field' => 'Priority',
  'operator' => 'equal',
  'value' => 'High',
  'type' => 'string'
};

Map<String, Object> mainTaskQueryGroup = new Map<String, Object>{
  'condition' => 'AND',
  'rules' => new List<Object>{ taskRule1, taskRule2 }
};

String taskQueryRuleJson = JSON.serialize(mainTaskQueryGroup);

try {
  // Call executeQueryWithRule2, passing null for all subquery parameters
  // Or, if you created an overloaded version of executeQueryWithRule2 that only takes
  // sObjectApiName and queryRuleJson, call that one.
  List<Map<String, Object>> results = AppGridController.executeQuery(
    sObjectApiNameForTaskTest, // sObjectApiName
    taskQueryRuleJson, // queryRule
    null, // subQueryRule
    null // subQueryRelation
  );

  System.debug('Task Query Results Count: ' + results.size());

  if (!results.isEmpty()) {
    // Just print the first record as a pretty JSON to verify the structure
    System.debug('--- FULLY NESTED ACCOUNT RECORD DATA ---');
    System.debug(JSON.serializePretty(results));
  }
} catch (Exception e) {
  System.debug('Error in Simple Task Query Test Case: ' + e.getMessage());
  System.debug('Stack Trace: ' + e.getStackTraceString());
}
