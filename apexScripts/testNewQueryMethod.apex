// 1. Define SObject API Name
String sObjectApiName = 'Account';

// Main Query Rule for Accounts
Map<String, Object> mainAccountIndividualRule = new Map<String, Object>{
  'field' => 'Type',
  'operator' => 'equal',
  'value' => 'Technology Partner',
  'type' => 'string'
};
Map<String, Object> mainQueryTopLevelGroup = new Map<String, Object>{
  'condition' => 'AND',
  'rules' => new List<Object>{ mainAccountIndividualRule }
};

String mainQueryRuleJsonForTest6 = JSON.serialize(mainQueryTopLevelGroup);
System.debug('Main Query Rule JSON (Test 6): ' + mainQueryRuleJsonForTest6);

// Subquery Rule for Contacts
Map<String, Object> subContactIndividualRule = new Map<String, Object>{
  'field' => 'Title',
  'operator' => 'equal',
  'value' => 'CEO',
  'type' => 'string'
};
Map<String, Object> subQueryTopLevelGroup = new Map<String, Object>{
  'condition' => 'AND',
  'rules' => new List<Object>{ subContactIndividualRule }
};
String subQueryRuleJsonForTest6 = JSON.serialize(subQueryTopLevelGroup);
System.debug('Subquery Rule JSON (Test 6): ' + subQueryRuleJsonForTest6);

try {
  // Correct the expected return type here
  List<Map<String, Object>> results6 = AppGridController.executeQueryWithRule2(
    'Account',
    mainQueryRuleJsonForTest6,
    'Contact',
    'Id',
    'AccountId',
    'IN',
    subQueryRuleJsonForTest6
  );
  System.debug('Results 6 Count: ' + results6.size());

  // Update assertion message if needed, or keep as is if "DynamicQueryTest" is your actual test data name
  System.debug('Results 6 Count: ' + results6.size());

  //   system.debug(results6);

  for (Map<String, Object> recordMap : results6) {
    // Iterate through List<Map<String, Object>>
    System.debug('--- Record Data ---');
    // To get the Id, access it directly from the map
    System.debug('  Id: ' + String.valueOf(recordMap.get('Id'))); // Example for Account Id

    // To print all fields from the map:
    List<String> fieldKeys = new List<String>(recordMap.keySet());
    fieldKeys.sort(); // For consistent output

    for (String fieldName : fieldKeys) {
      Object fieldValue = recordMap.get(fieldName);

      // Check if the field value is a map itself (indicating our structured relationship object)
      if (fieldValue instanceof Map<String, Object>) {
        Map<String, Object> relatedObjectMap = (Map<String, Object>) fieldValue;
        Map<String, Object> attributes = (Map<String, Object>) relatedObjectMap.get(
          'attributes'
        );
        String relatedType = attributes != null
          ? (String) attributes.get('type')
          : 'Unknown Related Type';

        System.debug(
          '  ' +
            fieldName + // This is the relationship name, e.g., "CreatedBy"
            ' (Related ' +
            relatedType +
            '):'
        );
        System.debug('    Id: ' + String.valueOf(relatedObjectMap.get('Id')));
        if (relatedObjectMap.containsKey('Name')) {
          // We standardized to 'Name'
          System.debug(
            '    Name: ' + String.valueOf(relatedObjectMap.get('Name'))
          );
        }
      } else {
        // This is a direct field of the primary object (or the original ID of a lookup)
        System.debug('  ' + fieldName + ': ' + String.valueOf(fieldValue));
      }
    }
    System.debug('--------------------------');
  }
} catch (Exception e) {
  System.debug('Error in Test Case 1: ' + e.getMessage());
  System.debug('Stack Trace: ' + e.getStackTraceString());
}
System.debug('=================================');
