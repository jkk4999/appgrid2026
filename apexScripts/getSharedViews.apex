// Anonymous Apex code to get shared views for Accounts

Map<String, Object> params = new Map<String, Object>{
  'sObjectName' => 'Account'
};

List<AgSharedViewDTO> views = AppGridController.getSharedViews(params);

system.debug(views);
