String sObjectApiName = 'Account';

Map<String, Object> params = new Map<String, Object>{
  'sObjectName' => sObjectApiName,
  'isSubgridView' => false
};

List<AppGridAg.AgObjQueryDTO> result = AppGridAg.AppGridController.getObjQueries(
  params
);

system.debug(result);
