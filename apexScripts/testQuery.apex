Map<String, Object> queryRule = new Map<String, Object>{
  'condition' => 'and',
  'rules' => new List<Map<String, Object>>{
    new Map<String, Object>{
      'label' => 'Created Date',
      'field' => 'CreatedDate',
      'operator' => 'greaterthanorequal',
      'type' => 'date',
      'value' => '2021/07/01'
    }
  },
  'not' => false
};

{"queryType":"QueryBuilder","sObjectApiName":"Owner","sObjectRelatedName":"","relationName":"","rawWhereClause":"","queryRule":{"condition":"and","rules":[{"label":"Name","field":"Name","type":"string","operator":"beginswith","value":"ale"}]}}

Map<String, Object> paramsObj = new Map<String, Object>{
  'queryType' => 'QueryBuilder',
  'sObjectApiName' => 'Account',
  'sObjectRelatedName' => '',
  'relationName' => '',
  'rawWhereClause' => '',
  'queryRule' => queryRule
};

String jsonStr = JSON.serialize(paramsObj);

AgWrapperQueryResult result = AppGridController.getSOQL(jsonStr);

System.debug(result);
