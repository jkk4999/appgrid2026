String sObjectApiName = 'Account';

Map<String, Object> params = new Map<String, Object>{};

String result = AppGridAg.AppGridController.getObjPermissions(params);

system.debug(result);
