// --- START: MODIFIED MAIN QUERY RULE ---
// To filter on multiple values for a single field, we change the operator
// to 'in' and provide a list of values.
Map<String, Object> rule1 = new Map<String, Object>{
  'field' => 'Industry',
  'operator' => 'in', // Changed from 'equal' to 'in'
  'value' => new List<String>{ 'Pharmaceuticals', 'Chemicals', 'Energy' }, // Value is now a List
  'type' => 'string'
};

Map<String, Object> ruleGroup = new Map<String, Object>{
  'condition' => 'AND',
  'rules' => new List<Object>{ rule1 }
};

String ruleJSON = JSON.serialize(ruleGroup);

// The subquery setup remains the same.
Map<String, Object> subQueryRule = new Map<String, Object>{
  'field' => 'Title',
  'operator' => 'equal',
  'value' => 'CEO',
  'type' => 'string'
};

Map<String, Object> subQueryRuleGroup = new Map<String, Object>{
  'condition' => 'AND',
  'rules' => new List<Object>{ subQueryRule }
};

String subQueryRuleJSON = JSON.serialize(subQueryRuleGroup);

try {
  // The final query will now find Accounts WHERE Industry is IN ('Pharmaceuticals', 'Banking', 'Energy')
  // AND that have at least one Contact with LastName 'Gonzalez'.
  AgQueryParameters queryParams = new AgQueryParameters(
    'Account',
    ruleJSON,
    subQueryRuleJSON,
    'Contacts'
  );

  String params = JSON.serialize(queryParams);

  // The call to the method remains identical.
  AgWrapperQueryResult2 result = AppGridController.executeDynamicSOQL(params);

  if (result.status == 'OK') {
    System.debug('Query with multi-value filter successful!');
    System.debug('Account Query Results Count: ' + result.records.size());

    if (!result.records.isEmpty()) {
      System.debug(
        '--- FULLY NESTED ACCOUNT RECORD DATA (WITH MULTI-VALUE FILTER) ---'
      );
      System.debug(JSON.serializePretty(result.records));
    }
  } else {
    System.debug('Query failed with a controlled error.');
    System.debug('Error Message: ' + result.errorMessage);
  }
} catch (Exception e) {
  System.debug('A critical, unhandled exception occurred: ' + e.getMessage());
  System.debug('Stack Trace: ' + e.getStackTraceString());
}
