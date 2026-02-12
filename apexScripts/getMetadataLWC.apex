String sObjectApiName = 'Account';

Map<String, Object> paramsMap = new Map<String, Object>{
  'sObjectName' => sObjectApiName
};

Map<String, Object> result = AppGridAg.AppGridController.getMetadata(paramsMap);

system.debug(result);
