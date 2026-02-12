String sObjectApiName = 'Account';

Map<String, Object> paramsMap = new Map<String, Object>{
   'isSubgridView' => false,
   'sObjectApiName' => sObjectApiName
};

// Serialize the map to a JSON string
String params = JSON.serialize(paramsMap);

AgWrapperViews result = AppGridAg.AppGridController.getObjViews(params);

system.debug(result);