// Query all Account records where AccountNumber is NULL
List<Account> accountsToUpdate = [SELECT Id, Name FROM Account WHERE AccountNumber = NULL];

// List to hold updated accounts
List<Account> updatedAccounts = new List<Account>();

// Iterate over the accounts and set the AccountNumber field
for (Account acc : accountsToUpdate) {
    // Get the first 4 characters of the Account Name
    String namePrefix = acc.Name.length() >= 4 ? acc.Name.substring(0, 4) : acc.Name;

    // Generate a random number between 1000 and 9999
    Integer randomNumber = Integer.valueOf(Math.rint(Math.random() * (9999 - 1000 + 1) + 1000).toString());

    // Concatenate the Name prefix and random number to form the new AccountNumber
    acc.AccountNumber = namePrefix + randomNumber;

    // Add the updated account to the list
    updatedAccounts.add(acc);
}

// Perform the DML update if there are any accounts to update
if (!updatedAccounts.isEmpty()) {
    update updatedAccounts;
}
