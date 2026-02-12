String sObjectApiName = 'Account';

Map<String, Object> params = new Map<String, Object>{
  'sObjectName' => sObjectApiName
};

String result = AppGridAg.AppGridController.getObjCharts(params);

system.debug(result);
