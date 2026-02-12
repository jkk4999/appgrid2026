Map<String, Object> params = new Map<String, Object>();
params.put('flowName', 'UpdateAccountDescription');
params.put('flowRecordIds', new List<String>{ '001ak00000nNdhDAAS' });

Map<String, Object> flowParams = new Map<String, Object>();
flowParams.put('accountDescription', 'jeffs accounts');

params.put('flowParameters', flowParams);

String jsonString = JSON.serialize(params);

AgWrapperFlowResult result = AppGridAg.AppGridController.runFlow(jsonString);

system.debug(result);

