// Step 1: Find the Accounts that are targeted for deletion.
List<Account> accountsToDelete = [
  SELECT Id
  FROM Account
  WHERE AppGridAg__F500_Rank__c > 400
];

if (accountsToDelete.isEmpty()) {
  System.debug('No accounts with a rank greater than 400 were found.');
  return;
}

Set<Id> accountIdsToDelete = new Map<Id, Account>(accountsToDelete).keySet();
System.debug(
  'Found ' + accountIdsToDelete.size() + ' accounts to process for deletion.'
);

// Step 2: Find and delete all Cases related to these accounts first.
List<Case> casesToDelete = [
  SELECT Id
  FROM Case
  WHERE AccountId IN :accountIdsToDelete
];

if (!casesToDelete.isEmpty()) {
  System.debug('Found ' + casesToDelete.size() + ' related cases to delete.');
  try {
    delete casesToDelete;
    System.debug('Successfully deleted related cases.');
  } catch (DmlException e) {
    System.debug('Could not delete related cases. Error: ' + e.getMessage());
    // Stop the process if cases can't be deleted.
    return;
  }
} else {
  System.debug('No related cases found for the targeted accounts.');
}

// Step 3: Now that related cases are gone, delete the accounts.
try {
  delete accountsToDelete;
  System.debug(
    'Success: Deleted ' + accountsToDelete.size() + ' low-ranked account(s).'
  );
} catch (DmlException e) {
  System.debug('An error occurred during account deletion: ' + e.getMessage());
}
