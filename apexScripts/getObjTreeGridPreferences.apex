// String sObjectApiName = 'Account';
String sObjectApiName = 'AppGridAg__AG_Forecast__c';

/*
Map<String, String> paramObj = new Map<String, String>{
  'sObjectApiName' => sObjectApiName // Correct key usage with string literal
};

String params = JSON.serialize(paramObj);

AgWrapperTreeGridPrefs result = AppGridController.getObjTreeGridPreferences(
  params
);
system.debug(result);

*/

List<AppGridAg__AG_TreeGrid_Prefs__c> treeGridPrefs = [
  SELECT
    Id,
    Name,
    AppGridAg__SObjectApiName__c,
    OwnerId,
    AppGridAg__Preferences__c,
    AppGridAg__Parent_Lookup_Field__c,
    AppGridAg__Group_Field__c,
    AppGridAg__Column_State__c,
    LastModifiedById,
    CreatedById
  FROM AppGridAg__AG_TreeGrid_Prefs__c
  WHERE AppGridAg__SObjectApiName__c = :sObjectApiName
];

system.debug(treeGridPrefs);

for (AppGridAg__AG_TreeGrid_Prefs__c pref : treeGridPrefs) {
  System.debug('Column_State__c: ' + pref.AppGridAg__Column_State__c);
  System.debug('Preferences__c: ' + pref.AppGridAg__Preferences__c);
}

// Use getPopulatedFieldsAsMap() to get the fields that were populated by the query
// Map<String, Object> fieldMap = treeGridPrefs[0].getPopulatedFieldsAsMap();

// for (String fieldName : fieldMap.keySet()) {
//   System.debug(fieldName + ' => ' + fieldMap.get(fieldName));
// }
