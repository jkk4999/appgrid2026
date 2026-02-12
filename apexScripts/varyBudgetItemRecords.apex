public static void updateBudgetItems() {
  // Get the existing records with 'North America' as the Budget Region value
  List<AppGrid__AG_Budget_Item__c> existingRecords = [
    SELECT
      Id,
      AppGrid__AG_Budget__c,
      AppGrid__Budget_Date__c,
      AppGrid__Budget_Item_Type__c,
      AppGrid__Budget_Region__c,
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
    WHERE AppGrid__Budget_Region__c != 'North America'
  ];

  // Update the currency values for each record
  for (AppGrid__AG_Budget_Item__c record : existingRecords) {
    record.AppGrid__Cost_of_Goods_Sold__c = varyCurrency(
      record.AppGrid__Cost_of_Goods_Sold__c
    );
    record.AppGrid__Insurance__c = varyCurrency(record.AppGrid__Insurance__c);
    record.AppGrid__Maintenance_and_Repairs__c = varyCurrency(
      record.AppGrid__Maintenance_and_Repairs__c
    );
    record.AppGrid__Marketing_and_Advertising__c = varyCurrency(
      record.AppGrid__Marketing_and_Advertising__c
    );
    record.AppGrid__Miscellaneous_Expenses__c = varyCurrency(
      record.AppGrid__Miscellaneous_Expenses__c
    );
    record.AppGrid__Office_Supplies__c = varyCurrency(
      record.AppGrid__Office_Supplies__c
    );
    record.AppGrid__Professional_Services__c = varyCurrency(
      record.AppGrid__Professional_Services__c
    );
    record.AppGrid__Rent_and_Utilities__c = varyCurrency(
      record.AppGrid__Rent_and_Utilities__c
    );
    record.AppGrid__Salaries_and_Benefits__c = varyCurrency(
      record.AppGrid__Salaries_and_Benefits__c
    );
    record.AppGrid__Travel_and_Entertainment__c = varyCurrency(
      record.AppGrid__Travel_and_Entertainment__c
    );
  }

  // Update the records in the database
  if (!existingRecords.isEmpty()) {
    update existingRecords;
  }
}

// Helper method to vary currency values by ±30%
private static Decimal varyCurrency(Decimal originalValue) {
  if (originalValue == null) {
    return null;
  }
  Decimal variation = originalValue * 0.3;
  Decimal minValue = originalValue - variation;
  Decimal maxValue = originalValue + variation;
  return minValue + (maxValue - minValue) * Math.random();
}

updateBudgetItems();
