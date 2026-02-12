String sObjectApiName = 'Account';

Map<String, Object> params = new Map<String, Object>{};

List<AppGridAg.AgObjPreferenceDTO> result = AppGridAg.AppGridController.getObjPreferences();

system.debug(result);
