String sObjectField = 'AppGridAg__Active__c';
String fieldValue = 'yes';

// Query all Account records where AccountNumber is NULL
List<Account> accountsToUpdate = [SELECT Id, Name, AppGridAg__Active__c FROM Account];

// List to hold updated accounts
List<Account> updatedAccounts = new List<Account>();

// Iterate over the accounts and set the AccountNumber field
for (Account acc : accountsToUpdate) {
    // Concatenate the Name prefix and random number to form the new AccountNumber
    acc.AppGridAg__Active__c = 'yes';

    // Add the updated account to the list
    updatedAccounts.add(acc);
}

// Perform the DML update if there are any accounts to update
if (!updatedAccounts.isEmpty()) {
    update updatedAccounts;
}
