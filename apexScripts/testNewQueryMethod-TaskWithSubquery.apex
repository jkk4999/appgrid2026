
String taskSObjectApiName = 'Task';

// Main Query Rule for Tasks: Find 'High' priority tasks
Map<String, Object> mainTaskRule = new Map<String, Object>{
    'field' => 'Priority',
    'operator' => 'equal',
    'value' => 'High',
    'type' => 'string' // Or string, depending on how your QB sends picklist values
};
Map<String, Object> mainTaskQueryGroup = new Map<String, Object>{
    'condition' => 'AND',
    'rules' => new List<Object>{ mainTaskRule }
};
String mainTaskQueryRuleJson = JSON.serialize(mainTaskQueryGroup);
System.debug('Main Task Query Rule JSON: ' + mainTaskQueryRuleJson);

// Subquery Rule for Accounts: Find Accounts of Type 'Technology'
Map<String, Object> subAccountRule = new Map<String, Object>{
    'field' => 'Type',
    'operator' => 'equal',
    'value' => 'Technology', // Make sure this matches Type in your test data
    'type' => 'string'
};
Map<String, Object> subAccountQueryGroup = new Map<String, Object>{
    'condition' => 'AND',
    'rules' => new List<Object>{ subAccountRule }
};
String subAccountQueryRuleJson = JSON.serialize(subAccountQueryGroup);
System.debug('Subquery Account Rule JSON: ' + subAccountQueryRuleJson);

try {
    List<Map<String, Object>> results7 = AppGridController.executeQueryWithRule2(
        taskSObjectApiName,             // sObjectApiName (Parent, which is Task)
        mainTaskQueryRuleJson,          // queryRuleJson (for Task)
        'Account',                      // subQuerySObjectApiName (WhatId can point to Account)
        'WhatId',                       // subQueryRelationshipFieldOnParent (Task.WhatId)
        'Id',                           // subQueryFieldToSelectInSubquery (Account.Id)
        'IN',                           // subQueryOperator
        subAccountQueryRuleJson         // subQueryRuleJson (for Account's WHERE clause)
    );

    System.debug('Results 7 (Tasks) Count: ' + results7.size());

    Boolean foundExpectedTask = false;
    for (Map<String, Object> recordMap : results7) {
        System.debug('--- Task Record Data ---');
        // Print all direct fields of the Task
        List<String> fieldKeys = new List<String>();
        for(String k : recordMap.keySet()){
            if(!(recordMap.get(k) instanceof Map<String,Object>)){ // Exclude nested relationship maps for now
                fieldKeys.add(k);
            }
        }
        fieldKeys.sort();
        for(String fieldName : fieldKeys){
            System.debug('  ' + fieldName + ': ' + String.valueOf(recordMap.get(fieldName)));
        }


        // Specifically check and print the 'What' polymorphic relationship
        if (recordMap.get('What') instanceof Map<String, Object>) {
            Map<String, Object> whatObjectMap = (Map<String, Object>) recordMap.get('What');
            Map<String, Object> attributes = (Map<String, Object>) whatObjectMap.get('attributes');
            String relatedType = attributes != null ? (String) attributes.get('type') : 'Unknown Related Type';

            System.debug('  What (Related ' + relatedType + '):');
            System.debug('    Id: ' + String.valueOf(whatObjectMap.get('Id')));
            if (whatObjectMap.containsKey('Name')) {
                System.debug('    Name/Identifier: ' + String.valueOf(whatObjectMap.get('Name')));
            }
            // If What was a Case, your TYPEOF should have selected CaseNumber, which would appear as 'Name' in the map
            // or you'd access it directly if getSoqlFields selected it as CaseNumber.
            // The current processing logic standardizes to 'Name' key in the output map.
            if (relatedType.equalsIgnoreCase('Account') && String.valueOf(whatObjectMap.get('Name')) == 'TaskQuery Account Tech') {
                 if(String.valueOf(recordMap.get('Subject')).startsWith('High Prio Follow-up')){
                    foundExpectedTask = true;
                 }
            }
        }
        System.debug('--------------------------');
    }

    // Assertion: Expect 1 Task - "High Prio Follow-up for Tech Account"
    // This task has Priority='High' and its WhatId points to 'TaskQuery Account Tech' (Type='Technology')
    System.assert(results7.size() == 1, 'Test Case 7: Expected 1 high priority task related to a Technology Account. Found: ' + results7.size());
    System.assert(foundExpectedTask, 'Test Case 7: Did not find the specific "High Prio Follow-up for Tech Account" task.');


} catch (Exception e) {
    System.debug('Error in Test Case 7 (Task Query): ' + e.getMessage());
    System.debug('Stack Trace: ' + e.getStackTraceString());
}
System.debug('=================================');