// Define the queryRuleMap with CreatedDate filter (matching debug log)
Map<String, Object> queryRuleMap = new Map<String, Object>{
  'condition' => 'and',
  'rules' => new List<Object>{
    new Map<String, Object>{
      'label' => 'Created Date',
      'field' => 'CreatedDate',
      'type' => 'date',
      'operator' => 'greaterthan',
      // CreatedDate is a Datetime field; provide a full ISO value
      // Use a very early date to guarantee matches in most orgs
      'value' => '2000-01-01T00:00:00Z'
    }
  },
  'isNot' => false
};

// Define the paramsObj map
Map<String, Object> paramsObj = new Map<String, Object>{
  'sObjectName' => 'Account',
  'queryRule' => queryRuleMap,
  'subQueryRule' => '',
  'subQueryRelation' => ''
};

// Build JSON string for queryRule as required by controller
String queryRuleJson = JSON.serialize(queryRuleMap);
paramsObj.put('queryRule', queryRuleJson);
System.debug(
  'Params being sent to executeDynamicSOQL: ' + JSON.serialize(paramsObj)
);

// Call executeDynamicSOQL and handle potential errors
String resultJson;
Map<String, Object> result;
try {
  resultJson = AppGridController.executeDynamicSOQL(paramsObj);
  result = (Map<String, Object>) JSON.deserializeUntyped(resultJson);
} catch (Exception e) {
  System.debug('Error calling executeDynamicSOQL: ' + e.getMessage());
  resultJson = JSON.serialize(new Map<String, Object>{
    'status' => 'error',
    'errorMessage' => e.getMessage()
  }, true);
  result = (Map<String, Object>) JSON.deserializeUntyped(resultJson);
}

// Log the overall result status and error message
System.debug('Status: ' + (String) result.get('status'));
System.debug('Error Message: ' + (String) result.get('errorMessage'));

List<Object> recs = (List<Object>) result.get('records');
System.debug('Total Records Returned: ' + (recs == null ? 0 : recs.size()));

// Print all key/value pairs from the first non-null record
if (recs != null && !recs.isEmpty()) {
  Integer firstIndex = -1;
  for (Integer i = 0; i < recs.size(); i++) {
    if (recs[i] != null) {
      firstIndex = i;
      break;
    }
  }
  if (firstIndex == -1) {
    System.debug('All entries in records are null.');
  } else {
    Object first = recs[firstIndex];
    System.debug('First non-null record index: ' + firstIndex);
    // Print each key and value
    Map<String, Object> recordMap;
    try {
      recordMap = (Map<String, Object>) first;
    } catch (Exception ex) {
      recordMap = null;
    }
    if (recordMap != null) {
      List<String> keys = new List<String>();
      keys.addAll(recordMap.keySet());
      keys.sort();
      for (String k : keys) {
        System.debug('Field ' + k + ' = ' + JSON.serialize(recordMap.get(k)));
      }
    } else if (first instanceof SObject) {
      SObject so = (SObject) first;
      Map<String, Object> kmap = so.getPopulatedFieldsAsMap();
      List<String> keys = new List<String>();
      keys.addAll(kmap.keySet());
      keys.sort();
      for (String k : keys) {
        System.debug('Field ' + k + ' = ' + JSON.serialize(kmap.get(k)));
      }
    } else {
      System.debug('First record unexpected type: ' + String.valueOf(first));
    }
  }
} else {
  System.debug('No records returned.');
  System.debug(
    'Full result payload for troubleshooting: ' + JSON.serializePretty(result)
  );
}
