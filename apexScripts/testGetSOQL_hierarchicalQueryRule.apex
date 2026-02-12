Map<String, Object> queryRuleMap = new Map<String, Object>{
  'condition' => 'and',
  'rules' => new List<Object>{
    new Map<String, Object>{
      'condition' => 'and',
      'rules' => new List<Object>{
        new Map<String, Object>{
          'label' => 'Industry',
          'field' => 'Industry',
          'type' => 'string',
          'operator' => 'equal',
          'value' => 'tech'
        },
        new Map<String, Object>{
          'label' => 'F500 Rank',
          'field' => 'AppGridAg__F500_Rank__c',
          'type' => 'number',
          'operator' => 'equal',
          'value' => 1
        }
      }
    },
    new Map<String, Object>{
      'label' => 'Is Active',
      'field' => 'AppGridAg__IsActive__c',
      'type' => 'boolean',
      'operator' => 'equal',
      'value' => 'true'
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
  'queryRule' => queryRuleMap
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
