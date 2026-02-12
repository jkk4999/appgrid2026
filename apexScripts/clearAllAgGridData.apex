// Define the list of SObjects to delete
List<String> sObjects = new List<String>{
  'AppGridAg__AG_Budget__c',
  'AppGridAg__AG_Chart__c',
  'AppGridAg__AG_Config_Template__c',
  'AppGridAg__AG_Flow__c',
  'AppGridAg__AG_Forecast__c',
  'AppGridAg__AG_Grid_Permissions__c',
  'AppGridAg__AG_Grid_Prefs__c',
  'AppGridAg__AG_Grid_Template__c',
  'AppGridAg__AG_Query__c',
  'AppGridAg__AG_TimeSeriesGrid_Pref__c',
  'AppGridAg__AG_TreeGrid_Prefs__c',
  'AppGridAg__AG_User_Object_Prefs__c',
  'AppGridAg__AG_User_Relation_Prefs__c',
  'AppGridAg__AG_View__c'
};

// Iterate over each SObject and delete its records
for (String sObjectName : sObjects) {
  try {
    // Get the SObjectType from the SObject name
    SObjectType sObjectType = Schema.getGlobalDescribe().get(sObjectName);

    if (sObjectType != null) {
      // Check if the object is deletable
      if (!sObjectType.getDescribe().isDeletable()) {
        System.debug(
          'Cannot delete records from ' +
            sObjectName +
            ': Insufficient permissions.'
        );
        continue;
      }

      // Construct the SOQL query with a limit to respect governor limits
      String query = 'SELECT Id FROM ' + sObjectName + ' LIMIT 10000';
      List<SObject> records = Database.query(query);

      if (!records.isEmpty()) {
        // Perform the delete operation with partial success allowed
        Database.DeleteResult[] deleteResults = Database.delete(records, false);
        Integer successCount = 0;

        // Check results for any errors
        for (Database.DeleteResult dr : deleteResults) {
          if (dr.isSuccess()) {
            successCount++;
          } else {
            System.debug(
              'Error deleting record in ' +
                sObjectName +
                ': ' +
                dr.getErrors()[0].getMessage()
            );
          }
        }
        System.debug(
          'Deleted ' + successCount + ' records from ' + sObjectName
        );
      } else {
        System.debug('No records found to delete in ' + sObjectName);
      }
    } else {
      System.debug('Invalid SObject name: ' + sObjectName);
    }
  } catch (Exception e) {
    System.debug(
      'Error processing ' +
        sObjectName +
        ': ' +
        e.getMessage() +
        ' at line ' +
        e.getLineNumber()
    );
  }
}

System.debug('Data deletion process completed.');
