// String sObjectName = 'AppGridAg__AG_Budget__c';
// String sObjectName = 'AppGridAg__AG_Budget_Item__c';
// String sObjectName = 'AppGridAg__AG_Chart__c';
// String sObjectName = 'AppGridAg__AG_Config_Template__c';
// String sObjectName = 'AppGridAg__AG_Flow__c';
// String sObjectName = 'AppGridAg__AG_Forecast__c';
// String sObjectName = 'AppGridAg__AG_Grid_Permissions__c';
// String sObjectName = 'AppGridAg__AG_Grid_Prefs__c';
// String sObjectName = 'AppGridAg__AG_Grid_Template__c';
// String sObjectName = 'AppGridAg__AG_Grid_Template_Item__c';
// String sObjectName = 'AppGridAg__AG_Query__c';
// String sObjectName = 'AppGridAg__AG_TimeSeriesGrid_Pref__c';
// String sObjectName = 'AppGridAg__AG_TreeGrid_Prefs__c';
// String sObjectName = 'AppGridAg__AG_User_Object_Prefs__c';
// String sObjectName = 'AppGridAg__AG_User_Relation_Prefs__c';
String sObjectname = 'AppGridAg__AG_View__c';

// Get the SObjectType from the SObject name
SObjectType sObjectType = Schema.getGlobalDescribe().get(sObjectName);

if (sObjectType != null) {
  // Dynamically construct the SOQL query to fetch all records
  String query = 'SELECT Id FROM ' + sObjectName;
  List<SObject> records = Database.query(query);

  // Delete all queried records
  if (!records.isEmpty()) {
    delete records;
    System.debug('Deleted ' + records.size() + ' records from ' + sObjectName);
  } else {
    System.debug('No records found to delete in ' + sObjectName);
  }
} else {
  System.debug('Invalid SObject name: ' + sObjectName);
}
