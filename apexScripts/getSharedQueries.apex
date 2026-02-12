// Anonymous Apex code to get shared views for Accounts

Map<String, Object> params = new Map<String, Object>{
  'sObjectName' => 'Account'
};

List<AgSharedQueryDTO> queries = AppGridController.getSharedQueries(params);

system.debug(queries);
