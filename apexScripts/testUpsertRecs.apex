String sObjectApiName = 'AppGridAg__AG_Budget__c';

AppGridAg__AG_Budget__c budget = new AppGridAg__AG_Budget__c();
budget.Name = 'Test Budget';
budget.AppGridAg__Budget_Type__c = 'Operating Budget';
budget.AppGridAg__Fiscal_Year__c = '2025';

List<AppGridAg__AG_Budget__c> recsToUpsert = new List<AppGridAg__AG_Budget__c>{
  budget
};

Map<String, Object> params = new Map<String, Object>();
params.put('jsonRecs', JSON.serialize(recsToUpsert));
params.put('sObjectApiName', 'AppGridAg__AG_Budget__c');

String jsonString = JSON.serialize(params);

List<AgUpsertResult> result = AppGridAg.AppGridController.upsertRecs(
  jsonString
);
system.debug(result);
