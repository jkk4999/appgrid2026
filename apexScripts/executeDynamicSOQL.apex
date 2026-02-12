try {
  AgQueryParameters paramsObj = new AgQueryParameters();

  paramsObj.sObjectApiName = 'Account';
  paramsObj.queryRule = '{"condition":"and","rules":[{"label":"Owner ID","field":"OwnerId","type":"string","operator":"equal","value":"005ak00000BLhtFAAT"}],"isNot":false}';

  paramsObj.subQueryRule = null;
  paramsObj.subQueryRelation = null;

  Map<String, Object> result = AppGridAg.AppGridController.executeDynamicSOQL(
    paramsObj
  );
  System.debug('Result: ' + JSON.serialize(result));
} catch (Exception e) {
  System.debug('Test error: ' + e.getTypeName() + ' - ' + e.getMessage());
}
