// Define the starting date
Date startDate = Date.newInstance(2026, 1, 1);

// Query Accounts sorted by Name
List<Account> accountsToUpdate = [
  SELECT Id, Name, AppGridAg__SLAExpirationDate__c
  FROM Account
  WHERE AppGridAg__SLAExpirationDate__c != NULL
  ORDER BY Name ASC
];

// Assign incrementing dates starting from 1/1/2026
Integer dayOffset = 0;
for (Account acct : accountsToUpdate) {
  acct.AppGridAg__SLAExpirationDate__c = startDate.addDays(dayOffset);
  dayOffset++;
}

// Perform update if records exist
if (!accountsToUpdate.isEmpty()) {
  update accountsToUpdate;
}

System.debug('Updated ' + accountsToUpdate.size() + ' Account records.');
