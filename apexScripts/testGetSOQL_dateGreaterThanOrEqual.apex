Map<String, Object> queryRuleMap = new Map<String, Object>{
  'condition' => 'and',
  'rules' => new List<Object>{
    new Map<String, Object>{
      'label' => 'Last Viewed Date',
      'field' => 'LastViewedDate',
      'type' => 'date',
      'operator' => 'greaterthanorequal',
      'value' => '2025-02-13'
    }
  },
  'isNot' => false
};

// Define the paramsObj map
Map<String, Object> paramsObj = new Map<String, Object>{
  'queryType' => 'QueryBuilder',
  'sObjectApiName' => 'Account',
  'sObjectRelatedName' => '',
  'relationName' => '',
  'rawWhereClause' => '',
  'queryRule' => queryRuleMap
};

// Serialize to JSON
String jsonStr = JSON.serialize(paramsObj);
System.debug('Generated JSON: ' + jsonStr);

// Call getSOQL and handle potential errors
AgWrapperQueryResult result;
try {
  result = AppGridController.executeDynamicSOQL(jsonStr);
} catch (Exception e) {
  System.debug('Error calling getSOQL: ' + e.getMessage());
}

// System.debug('Full Result: ' + JSON.serializePretty(result));
System.debug('status is ' + result.status);
System.debug('errorMessage is ' + result.errorMessage);
System.debug('queryResult is ' + result.records.size());
