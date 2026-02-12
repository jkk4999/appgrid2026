// Rule for the Industry field (remains the same)
Map<String, Object> rule1 = new Map<String, Object>{
  'field' => 'Industry',
  'operator' => 'in',
  'value' => new List<String>{ 'Pharmaceuticals', 'Chemicals', 'Energy' },
  'type' => 'string'
};

// --- START: NEW DATE RANGE RULE ---
// To filter on a date range, we use the 'between' operator.
// The value must be a list containing two date strings in ISO 8601 format (YYYY-MM-DD).
// NOTE: I've corrected the user-provided date '03-01-2-25' to the standard '2025-03-01'.
Map<String, Object> rule2 = new Map<String, Object>{
  'field' => 'AppGridAg__SLAExpirationDate__c',
  'operator' => 'between',
  'value' => new List<String>{ '2015-03-01', '2025-06-01' },
  'type' => 'date'
};

// --- END: NEW DATE RANGE RULE ---

// Add both rules to the main rule group.
// The condition is 'AND', so records must match both the Industry AND the SLA Date rules.
Map<String, Object> ruleGroup = new Map<String, Object>{
  'condition' => 'AND',
  'rules' => new List<Object>{ rule1, rule2 } // Add rule2 to the list
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
  // Create the parameter object with the combined main query rule and the subquery rule.
  AgQueryParameters queryParams = new AgQueryParameters(
    'Account',
    ruleJSON,
    subQueryRuleJSON,
    'Contacts'
  );

  String params = JSON.serialize(queryParams);

  AgWrapperQueryResult2 result = AppGridController.executeDynamicSOQL(params);

  if (result.status == 'OK') {
    System.debug('Query with date range filter successful!');
    System.debug('Account Query Results Count: ' + result.records.size());

    if (!result.records.isEmpty()) {
      System.debug(
        '--- FULLY NESTED ACCOUNT RECORD DATA (WITH DATE RANGE FILTER) ---'
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
