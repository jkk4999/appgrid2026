// Fetch all Account records
List<Account> accounts = [SELECT Id, AppGridAg__IsActive__c FROM Account];

// Prepare for updates
List<Account> accountsToUpdate = new List<Account>();
for (Account acc : accounts) {
  acc.AppGridAg__IsActive__c = true;
  accountsToUpdate.add(acc);
}

// Update the records
if (!accountsToUpdate.isEmpty()) {
  try {
    update accountsToUpdate;
    System.debug(
      'Successfully updated ' +
        accountsToUpdate.size() +
        ' Account records with AppGridAg__IsActive__c = true.'
    );
  } catch (DmlException e) {
    System.debug('Error updating Accounts: ' + e.getMessage());
  }
} else {
  System.debug('No Account records found to update.');
}
