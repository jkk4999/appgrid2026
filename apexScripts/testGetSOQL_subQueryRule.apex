Map<String, Object> queryRuleMap = new Map<String, Object>{
  'condition' => 'and',
  'rules' => new List<Object>{
    new Map<String, Object>{
      'label' => 'Industry',
      'field' => 'Industry',
      'type' => 'string',
      'operator' => 'equal',
      'value' => 'Airlines'
    }
  },
  'isNot' => false
};

Map<String, Object> subQueryRuleMap = new Map<String, Object>{
  'condition' => 'and',
  'rules' => new List<Object>{
    new Map<String, Object>{
      'label' => 'Last Name',
      'field' => 'LastName',
      'type' => 'string',
      'operator' => 'equal',
      'value' => 'Garrett'
    }
  },
  'isNot' => false
};

Map<String, Object> paramsObj = new Map<String, Object>{
  'queryType' => 'QueryBuilder',
  'sObjectApiName' => 'Account',
  'sObjectRelatedName' => '',
  'relationName' => '',
  'rawWhereClause' => '',
  'queryRule' => queryRuleMap,
  'subQueryRule' => subQueryRuleMap,
  'subQueryRelation' => 'Contacts' // Child relationship name from Account
};

String jsonStr = JSON.serialize(paramsObj);
System.debug('Generated JSON: ' + jsonStr);

AgWrapperQueryResult2 result;
try {
  result = AppGridController.executeDynamicSOQL(jsonStr);
} catch (Exception e) {
  System.debug('Error calling executeDynamicSOQL: ' + e.getMessage());
}

System.debug('status is ' + result.status);
System.debug('errorMessage is ' + result.errorMessage);
System.debug('queryResult is ' + result.records.size());
