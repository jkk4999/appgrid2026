// Query Accounts with AnnualRevenue populated
List<Account> accountsToUpdate = [
  SELECT Id, AnnualRevenue, AppGridAg__AnnualProfit__c
  FROM Account
  WHERE AnnualRevenue != NULL
];

// Loop through accounts and calculate profit
for (Account acc : accountsToUpdate) {
  // Generate a random percentage between 0.15 and 0.50
  Decimal randomPercent = 0.15 + (Decimal.valueOf(Math.random()) * 0.35);

  // Calculate profit
  acc.AppGridAg__AnnualProfit__c = acc.AnnualRevenue * randomPercent;
}

// Perform update
if (!accountsToUpdate.isEmpty()) {
  update accountsToUpdate;
}

System.debug('Updated ' + accountsToUpdate.size() + ' Account records.');
