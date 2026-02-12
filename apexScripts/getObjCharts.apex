String sObjectApiName = 'Account';

Map<String, Object> paramsMap = new Map<String, Object>{
  'SObjectApiName' => sObjectApiName
};

// Serialize the map to a JSON string
String params = JSON.serialize(paramsMap);

AgWrapperCharts result = AppGridAg.AppGridController.getObjCharts(params);

system.debug(result);
