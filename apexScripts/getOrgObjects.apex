String sObjectApiName = 'Account';

Map<String, Object> params = new Map<String, Object>{};

String result = AppGridAg.AppGridController.getOrgObjects(params);

system.debug(result);
