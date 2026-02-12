// Fetch all Account records
List<Account> accounts = [
  SELECT
    Id,
    AppGridAg__SLA__c,
    AppGridAg__SLAExpirationDate__c,
    AppGridAg__SLASerialNumber__c
  FROM Account
];

// Get picklist values for AppGridAg__SLA__c dynamically
Schema.DescribeFieldResult fieldDescribe = Account.AppGridAg__SLA__c.getDescribe();
List<Schema.PicklistEntry> picklistEntries = fieldDescribe.getPicklistValues();
List<String> picklistValues = new List<String>();
for (Schema.PicklistEntry entry : picklistEntries) {
  if (entry.isActive()) {
    picklistValues.add(entry.getValue());
  }
}

// Define today's date (March 18, 2025, per system date)
Date today = Date.newInstance(2025, 3, 18);

// Prepare for updates
List<Account> accountsToUpdate = new List<Account>();
for (Account acc : accounts) {
  // Random picklist value for AppGridAg__SLA__c
  Integer randomPicklistIndex = Math.floor(
      Math.random() * picklistValues.size()
    )
    .intValue();
  acc.AppGridAg__SLA__c = picklistValues[randomPicklistIndex];

  // Random date within 120 days from today for AppGridAg__SLAExpirationDate__c
  Integer randomDays = Math.floor(Math.random() * 121).intValue(); // 0 to 120 inclusive
  acc.AppGridAg__SLAExpirationDate__c = today.addDays(randomDays);

  // Random text value for AppGridAg__SLASerialNumber__c (e.g., "SLA-XXXXX")
  String randomNum = String.valueOf((Integer) (Math.random() * 100000))
    .leftPad(5, '0');
  acc.AppGridAg__SLASerialNumber__c = 'SLA-' + randomNum;

  accountsToUpdate.add(acc);
}

// Update the records
if (!accountsToUpdate.isEmpty()) {
  try {
    update accountsToUpdate;
    System.debug(
      'Successfully updated ' + accountsToUpdate.size() + ' Account records.'
    );
  } catch (DmlException e) {
    System.debug('Error updating Accounts: ' + e.getMessage());
  }
} else {
  System.debug('No Account records found to update.');
}
