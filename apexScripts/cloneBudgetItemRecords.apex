public static void cloneBudgetItems() {
  // Get the existing records with 'North America' as the Budget Region value
  List<AppGrid__AG_Budget_Item__c> existingRecords = [
    SELECT
      Id,
      AppGrid__AG_Budget__c,
      AppGrid__Budget_Date__c,
      AppGrid__Budget_Item_Type__c,
      AppGrid__Cost_of_Goods_Sold__c,
      AppGrid__Insurance__c,
      AppGrid__IsApproved__c,
      AppGrid__Maintenance_and_Repairs__c,
      AppGrid__Marketing_and_Advertising__c,
      AppGrid__Miscellaneous_Expenses__c,
      AppGrid__Office_Supplies__c,
      AppGrid__Professional_Services__c,
      AppGrid__Rent_and_Utilities__c,
      AppGrid__Salaries_and_Benefits__c,
      AppGrid__Travel_and_Entertainment__c
    FROM AppGrid__AG_Budget_Item__c
    WHERE AppGrid__Budget_Region__c = 'North America'
  ];

  // Get the picklist values for AppGrid__Budget_Region__c
  Schema.DescribeFieldResult fieldResult = AppGrid__AG_Budget_Item__c.AppGrid__Budget_Region__c.getDescribe();
  List<Schema.PicklistEntry> picklistValues = fieldResult.getPicklistValues();

  // Create new records for each picklist value
  List<AppGrid__AG_Budget_Item__c> newRecords = new List<AppGrid__AG_Budget_Item__c>();
  for (Schema.PicklistEntry picklistValue : picklistValues) {
    String regionValue = picklistValue.getValue();

    // Skip 'North America' as we already have records for it
    if (regionValue == 'North America') {
      continue;
    }

    for (AppGrid__AG_Budget_Item__c existingRecord : existingRecords) {
      AppGrid__AG_Budget_Item__c newRecord = existingRecord.clone(
        false,
        true,
        false,
        false
      );
      newRecord.AppGrid__Budget_Region__c = regionValue;
      newRecords.add(newRecord);
    }
  }

  // Insert the new records
  if (!newRecords.isEmpty()) {
    insert newRecords;
  }
}

cloneBudgetItems();
